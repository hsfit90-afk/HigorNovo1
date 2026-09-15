import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { confirmarReservaPaga } from '../../../../lib/pagamento';

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

  const valorCobrado = Number(body.amount) || 0;
  const valorPago = Number(body.paid_amount) || 0;

  if (!(valorPago > 0 && valorPago >= valorCobrado)) {
    // Pagamento parcial ou não aprovado: nada a fazer, mas responde 200 pra
    // InfinitePay não ficar reenviando.
    return NextResponse.json({ ok: true });
  }

  try {
    await confirmarReservaPaga(supabase, orderNsu, {
      transacaoNsu: body.transaction_nsu,
      comprovanteUrl: body.receipt_url,
    });
  } catch {
    // Falha inesperada no banco: responde erro pra InfinitePay tentar de novo,
    // em vez de dar o pagamento como tratado.
    return NextResponse.json({ error: 'Falha ao registrar o pagamento.' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
