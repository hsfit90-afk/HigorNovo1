-- Controle manual de cortes do plano: o barbeiro marca "+1 corte" no painel
-- admin depois de atender um assinante, em vez do sistema tentar adivinhar
-- casando o telefone do agendamento com o telefone cadastrado (isso falhava
-- sempre que o número digitado no agendamento não batia exatamente com o
-- cadastrado no assinante).
--
-- cortes_mes_referencia guarda o mês ("YYYY-MM") a que cortes_usados se
-- refere - quando o barbeiro marca um corte num mês novo, o contador é
-- zerado automaticamente antes de contar esse corte.
alter table assinantes
  add column if not exists cortes_usados integer not null default 0,
  add column if not exists cortes_mes_referencia text;
