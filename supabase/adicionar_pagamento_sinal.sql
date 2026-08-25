-- Colunas para controlar o sinal pago via API de Checkout da InfinitePay.
--
-- O agendamento passa a ser gravado com status 'aguardando_pagamento' assim
-- que o cliente inicia o checkout - isso já reserva o horário, aproveitando
-- a trava unique(data, hora) que a tabela já tem (ver prevent_double_booking.sql).
-- Só vira um agendamento "de verdade" (status 'Pendente') quando a InfinitePay
-- confirma o pagamento, via webhook ou via checagem ativa no retorno do checkout.
alter table agendamentos
  add column if not exists order_nsu text unique,
  add column if not exists expira_em timestamptz,
  add column if not exists transacao_nsu text,
  add column if not exists comprovante_url text;

-- Acelera a limpeza de reservas expiradas (feita a cada nova tentativa de
-- agendamento e a cada carregamento da agenda).
create index if not exists agendamentos_aguardando_pagamento_expira_em_idx
  on agendamentos (expira_em)
  where status = 'aguardando_pagamento';
