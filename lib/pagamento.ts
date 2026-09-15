import type { SupabaseClient } from '@supabase/supabase-js';

// Regra do sistema: SÓ agendamento pago ocupa horário.
//
// Enquanto o cliente não paga, existe uma linha no banco (pra conseguir casar
// o pagamento quando ele chegar), mas ela NÃO segura o horário - quem pagar
// primeiro leva. Estes são os status que não ocupam a agenda; precisam bater
// com o índice parcial criado em supabase/corrige_reservas_expiradas.sql.
export const STATUS_QUE_NAO_OCUPAM = ['aguardando_pagamento', 'expirado', 'pago_sem_horario'];

export type ResultadoConfirmacao =
  | { status: 'confirmado'; agendamento: any }
  | { status: 'pago_sem_horario'; agendamento: any }
  | { status: 'nao_encontrado' };

// Chamada quando a InfinitePay confirma que o sinal foi pago (pelo webhook
// ou pela checagem ativa no retorno do checkout). Confirma o agendamento; se
// outra pessoa pagou esse mesmo horário primeiro, registra como
// 'pago_sem_horario' em vez de engolir o pagamento em silêncio.
export async function confirmarReservaPaga(
  supabase: SupabaseClient,
  orderNsu: string,
  dados: { transacaoNsu?: string | null; comprovanteUrl?: string | null }
): Promise<ResultadoConfirmacao> {
  const { data: reserva } = await supabase
    .from('agendamentos')
    .select('*')
    .eq('order_nsu', orderNsu)
    .maybeSingle();

  if (!reserva) return { status: 'nao_encontrado' };

  // O webhook e o retorno do checkout podem chegar quase juntos - se já foi
  // resolvido antes, devolve o que está gravado sem mexer de novo.
  if (reserva.status === 'Pendente') return { status: 'confirmado', agendamento: reserva };
  if (reserva.status === 'pago_sem_horario') return { status: 'pago_sem_horario', agendamento: reserva };

  const camposPagamento = {
    transacao_nsu: dados.transacaoNsu || null,
    comprovante_url: dados.comprovanteUrl || null,
  };

  const { data: confirmado, error } = await supabase
    .from('agendamentos')
    .update({ status: 'Pendente', ...camposPagamento })
    .eq('order_nsu', orderNsu)
    .select()
    .single();

  if (!error) return { status: 'confirmado', agendamento: confirmado };

  // 23505 = outra pessoa pagou esse horário primeiro. O dinheiro entrou, então
  // fica registrado pro barbeiro resolver (remarcar ou devolver) em vez de sumir.
  if (error.code !== '23505') throw error;

  const { data: semHorario } = await supabase
    .from('agendamentos')
    .update({ status: 'pago_sem_horario', ...camposPagamento })
    .eq('order_nsu', orderNsu)
    .select()
    .single();

  return { status: 'pago_sem_horario', agendamento: semHorario };
}
