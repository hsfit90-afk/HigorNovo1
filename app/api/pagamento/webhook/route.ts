import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// A InfinitePay chama esta URL quando o pagamento é processado. Ela não
// manda um campo "pago: true" - manda o valor cobrado e o valor pago, e
// quem confirma a aprovação é quem recebe o webhook.
export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const orderNsu = body?.order_nsu;

  if (!orderNsu) {
    return NextResponse.json({ error: 'order_nsu ausente' }, { status: 400 });
  }

  const { data: agendamento } = await supabase
    .from('agendamentos')
    .select('id, status')
    .eq('order_nsu', orderNsu)
    .maybeSingle();

  // Não é nosso pedido, ou já foi confirmado antes (pelo retorno do checkout,
  // por exemplo) - responde 200 pra InfinitePay não ficar reenviando.
  if (!agendamento || agendamento.status !== 'aguardando_pagamento') {
    return NextResponse.json({ ok: true });
  }

  const valorCobrado = Number(body.amount) || 0;
  const valorPago = Number(body.paid_amount) || 0;

  if (valorPago > 0 && valorPago >= valorCobrado) {
    await supabase
      .from('agendamentos')
      .update({
        status: 'Pendente',
        transacao_nsu: body.transaction_nsu || null,
        comprovante_url: body.receipt_url || null,
        expira_em: null,
      })
      .eq('order_nsu', orderNsu);
  }

  return NextResponse.json({ ok: true });
}
