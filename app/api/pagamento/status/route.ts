import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const orderNsu = searchParams.get('order_nsu');
  const transactionNsu = searchParams.get('transaction_nsu');
  const slug = searchParams.get('slug');
  const receiptUrl = searchParams.get('receipt_url');

  if (!orderNsu) {
    return NextResponse.json({ error: 'order_nsu é obrigatório.' }, { status: 400 });
  }

  const { data: agendamento } = await supabase
    .from('agendamentos')
    .select('*')
    .eq('order_nsu', orderNsu)
    .maybeSingle();

  if (!agendamento) {
    return NextResponse.json({ status: 'nao_encontrado' });
  }

  if (agendamento.status !== 'aguardando_pagamento') {
    return NextResponse.json({ status: 'confirmado', agendamento });
  }

  // Ainda aguardando: se voltamos do checkout com os dados da transação,
  // confirma ativamente na InfinitePay - cobre o caso do webhook atrasar
  // ou (em ambiente local, sem URL pública) nunca chegar a ser chamado.
  const handle = process.env.INFINITEPAY_HANDLE;
  if (handle && transactionNsu && slug) {
    try {
      const respostaCheck = await fetch('https://api.infinitepay.io/invoices/public/checkout/payment_check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ handle, order_nsu: orderNsu, transaction_nsu: transactionNsu, slug }),
      });
      const resultado = await respostaCheck.json().catch(() => null);

      if (resultado?.paid === true) {
        const { data: atualizado } = await supabase
          .from('agendamentos')
          .update({
            status: 'Pendente',
            transacao_nsu: transactionNsu,
            comprovante_url: receiptUrl || null,
            expira_em: null,
          })
          .eq('order_nsu', orderNsu)
          .select()
          .single();

        return NextResponse.json({ status: 'confirmado', agendamento: atualizado });
      }
    } catch {
      // Segue e responde "aguardando" abaixo - o front-end tenta de novo.
    }
  }

  const expirado = agendamento.expira_em ? new Date(agendamento.expira_em) < new Date() : false;
  return NextResponse.json({ status: expirado ? 'expirado' : 'aguardando' });
}
