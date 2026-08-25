import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const VALOR_SINAL_CENTAVOS = 1000; // R$ 10,00
const MINUTOS_PARA_EXPIRAR = 15;

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

  // Libera horários que ficaram reservados por um checkout nunca concluído.
  await supabase
    .from('agendamentos')
    .delete()
    .eq('status', 'aguardando_pagamento')
    .lt('expira_em', new Date().toISOString());

  const orderNsu = crypto.randomUUID();
  const expiraEm = new Date(Date.now() + MINUTOS_PARA_EXPIRAR * 60 * 1000).toISOString();

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
      expira_em: expiraEm,
    }])
    .select()
    .single();

  if (erroReserva) {
    if (erroReserva.code === '23505') {
      return NextResponse.json({ error: 'Este horário acabou de ser reservado por outra pessoa. Escolha outro.' }, { status: 409 });
    }
    return NextResponse.json({ error: erroReserva.message }, { status: 500 });
  }

  const siteUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000').replace(/\/$/, '');
  const webhookUtilizavel = /^https:\/\//.test(siteUrl);
  const telefoneLimpo = String(cliente_telefone).replace(/\D/g, '');

  const payload: Record<string, unknown> = {
    handle,
    order_nsu: orderNsu,
    redirect_url: `${siteUrl}/agendamento/retorno?order_nsu=${orderNsu}`,
    amount: VALOR_SINAL_CENTAVOS,
    items: [{ quantity: 1, price: VALOR_SINAL_CENTAVOS, description: `Sinal de agendamento - ${servico}` }],
    customer: {
      name: cliente_nome,
      ...(telefoneLimpo ? { phone: `+55${telefoneLimpo}` } : {}),
    },
  };

  // A InfinitePay não consegue chamar de volta uma URL local, então só
  // mandamos webhook_url quando o site está publicado (https).
  if (webhookUtilizavel) {
    payload.webhook_url = `${siteUrl}/api/pagamento/webhook`;
  }

  let respostaInfinitePay: Response;
  try {
    respostaInfinitePay = await fetch('https://api.infinitepay.io/invoices/public/checkout/links', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
  } catch {
    await supabase.from('agendamentos').delete().eq('id', reserva.id);
    return NextResponse.json({ error: 'Não foi possível conectar com a InfinitePay. Tente novamente.' }, { status: 502 });
  }

  const resultado = await respostaInfinitePay.json().catch(() => null);
  const checkoutUrl = resultado?.url || resultado?.payment_url;

  if (!respostaInfinitePay.ok || !checkoutUrl) {
    await supabase.from('agendamentos').delete().eq('id', reserva.id);
    return NextResponse.json(
      { error: resultado?.error || 'Não foi possível gerar o link de pagamento na InfinitePay. Confira o INFINITEPAY_HANDLE.' },
      { status: 502 }
    );
  }

  return NextResponse.json({ checkoutUrl, orderNsu });
}
