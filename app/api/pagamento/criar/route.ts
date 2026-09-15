import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { VALOR_SINAL_REAIS } from '../../../../lib/servicos';
import { STATUS_QUE_NAO_OCUPAM } from '../../../../lib/pagamento';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// O sinal é abatido do valor do serviço no dia do atendimento - só esse
// valor fixo é cobrado agora via InfinitePay, o restante é pago na hora.
const VALOR_SINAL_CENTAVOS = VALOR_SINAL_REAIS * 100;

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const { servico, data, hora, cliente_nome, cliente_telefone, user_id } = body ?? {};

  if (!servico || !data || !hora || !cliente_nome || !cliente_telefone) {
    return NextResponse.json({ error: 'Preencha todos os campos antes de pagar o sinal.' }, { status: 400 });
  }

  const handle = process.env.INFINITEPAY_HANDLE;
  if (!handle) {
    return NextResponse.json({ error: 'Pagamento não configurado no servidor (INFINITEPAY_HANDLE ausente).' }, { status: 500 });
  }

  const telefoneNormalizado = String(cliente_telefone).replace(/\D/g, '');

  const { data: linhasDoHorario } = await supabase
    .from('agendamentos')
    .select('id, status, user_id, cliente_telefone, order_nsu, checkout_url')
    .eq('data', data)
    .eq('hora', hora);

  const linhas = linhasDoHorario || [];

  // Horário já pago por alguém? Aí sim está ocupado de verdade.
  const jaConfirmado = linhas.find(l => !STATUS_QUE_NAO_OCUPAM.includes(l.status));
  if (jaConfirmado) {
    const ehDoProprioCliente =
      (user_id && jaConfirmado.user_id === user_id) ||
      (!!telefoneNormalizado &&
        String(jaConfirmado.cliente_telefone || '').replace(/\D/g, '') === telefoneNormalizado);

    return NextResponse.json(
      {
        error: ehDoProprioCliente
          ? 'Você já tem este horário confirmado.'
          : 'Este horário acabou de ser reservado por outra pessoa. Escolha outro.',
      },
      { status: 409 }
    );
  }

  // Cobrança que este mesmo cliente já abriu antes para este horário e não
  // concluiu: devolve o MESMO link em vez de gerar outro. Dois links abertos
  // arriscariam ele pagar duas vezes pelo mesmo horário.
  const cobrancaEmAberto = linhas.find(
    l =>
      l.status === 'aguardando_pagamento' &&
      l.checkout_url &&
      ((user_id && l.user_id === user_id) ||
        (!!telefoneNormalizado &&
          String(l.cliente_telefone || '').replace(/\D/g, '') === telefoneNormalizado))
  );

  if (cobrancaEmAberto) {
    await supabase
      .from('agendamentos')
      .update({ servico, cliente_nome, cliente_telefone })
      .eq('id', cobrancaEmAberto.id);

    return NextResponse.json({ checkoutUrl: cobrancaEmAberto.checkout_url, orderNsu: cobrancaEmAberto.order_nsu });
  }

  // Linha só para conseguir reconhecer o pagamento quando ele chegar - ela
  // NÃO segura o horário (ver STATUS_QUE_NAO_OCUPAM em lib/pagamento.ts).
  const orderNsu = crypto.randomUUID();

  const { data: reserva, error: erroReserva } = await supabase
    .from('agendamentos')
    .insert([{
      user_id: user_id ?? null,
      servico,
      data,
      hora,
      cliente_nome,
      cliente_telefone,
      status: 'aguardando_pagamento',
      order_nsu: orderNsu,
    }])
    .select()
    .single();

  if (erroReserva) {
    return NextResponse.json({ error: erroReserva.message }, { status: 500 });
  }

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
  const webhookUtilizavel = /^https:\/\//.test(siteUrl);

  const payload: Record<string, unknown> = {
    handle,
    order_nsu: orderNsu,
    redirect_url: `${siteUrl}/agendamento/retorno?order_nsu=${orderNsu}`,
    amount: VALOR_SINAL_CENTAVOS,
    items: [{ quantity: 1, price: VALOR_SINAL_CENTAVOS, description: `Sinal de agendamento - ${servico}` }],
    customer: {
      name: cliente_nome,
      ...(telefoneNormalizado ? { phone: `+55${telefoneNormalizado}` } : {}),
    },
  };

  // A InfinitePay não consegue chamar de volta uma URL local, então só
  // mandamos webhook_url quando o site está publicado (https).
  if (webhookUtilizavel) {
    payload.webhook_url = `${siteUrl}/api/pagamento/webhook`;
  }

  // Timeout explícito: sem isso, uma lentidão da InfinitePay deixava a tela do
  // cliente parada em "Salvando..." até a própria Vercel cortar a requisição,
  // dando a impressão de app travado.
  const controleTimeout = new AbortController();
  const timeout = setTimeout(() => controleTimeout.abort(), 8000);

  let respostaInfinitePay: Response;
  try {
    respostaInfinitePay = await fetch('https://api.infinitepay.io/invoices/public/checkout/links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: controleTimeout.signal,
    });
  } catch {
    await supabase.from('agendamentos').delete().eq('id', reserva.id);
    return NextResponse.json({ error: 'A InfinitePay demorou para responder. Tente de novo em instantes.' }, { status: 502 });
  } finally {
    clearTimeout(timeout);
  }

  const resultado = await respostaInfinitePay.json().catch(() => null);
  const checkoutUrl = resultado?.url || resultado?.payment_url;

  if (!respostaInfinitePay.ok || !checkoutUrl) {
    // Nenhum link foi gerado, então nenhum pagamento pode chegar por esta
    // linha - pode apagar sem risco de perder um pagamento.
    await supabase.from('agendamentos').delete().eq('id', reserva.id);
    return NextResponse.json(
      { error: resultado?.error || 'Não foi possível gerar o link de pagamento na InfinitePay. Confira o INFINITEPAY_HANDLE.' },
      { status: 502 }
    );
  }

  // Guarda o link para devolver o mesmo caso o cliente volte pra tentar de novo.
  await supabase.from('agendamentos').update({ checkout_url: checkoutUrl }).eq('id', reserva.id);

  return NextResponse.json({ checkoutUrl, orderNsu });
}
