-- DIAGNÓSTICO do agendamento duplicado (só consulta, não altera nada).
-- Responde as duas perguntas que decidem a correção.

-- 1) As duas linhas das 19:00 do dia 03/10: quem criou, como, e quando.
--    Se "criado_pelo_admin" vier true em alguma, foi encaixe feito no painel.
select
  id,
  data,
  hora,
  cliente_nome,
  cliente_telefone,
  servico,
  status,
  criado_pelo_admin,
  user_id
from agendamentos
where data = '2026-10-03'
order by hora, id;

-- 2) A trava contra duplicado existe mesmo? Tem que aparecer uma linha
--    chamada "agendamentos_data_hora_ativos_unique".
select indexname, indexdef
from pg_indexes
where tablename = 'agendamentos';

-- 3) Existe algum outro horário duplicado hoje no banco (fora o do admin)?
select data, hora, count(*) as quantidade, array_agg(cliente_nome) as clientes
from agendamentos
where criado_pelo_admin = false
  and status not in ('aguardando_pagamento', 'expirado', 'pago_sem_horario')
group by data, hora
having count(*) > 1
order by data, hora;
