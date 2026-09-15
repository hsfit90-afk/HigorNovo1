-- PASSO 1 - DIAGNÓSTICO (só consulta, não altera nada)
--
-- Roda isso antes de so_pago_ocupa_horario.sql. Ele mostra os horários que
-- têm mais de um agendamento ocupando o mesmo dia+hora, que é o que impede
-- a criação da trava contra duplo agendamento.

select
  data,
  hora,
  count(*)                       as quantidade,
  array_agg(id order by id)      as ids,
  array_agg(cliente_nome order by id) as clientes,
  array_agg(cliente_telefone order by id) as telefones,
  array_agg(servico order by id) as servicos,
  array_agg(status order by id)  as status
from agendamentos
where coalesce(status, 'Pendente') not in ('aguardando_pagamento', 'expirado', 'pago_sem_horario')
group by data, hora
having count(*) > 1
order by data, hora;

-- Confere também se a trava antiga existe ou não hoje:
select conname as travas_existentes
from pg_constraint
where conrelid = 'agendamentos'::regclass and contype = 'u';

select indexname as indices_existentes
from pg_indexes
where tablename = 'agendamentos';
