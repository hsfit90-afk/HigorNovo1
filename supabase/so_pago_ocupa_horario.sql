-- REGRA 1: só agendamento PAGO ocupa horário. Quem paga primeiro leva.
-- REGRA 2: a trava de horário único vale só pro CLIENTE agendando pelo site.
--          O dono da barbearia pode encaixar mais de um cliente no mesmo
--          horário (ex: cliente sem celular, que ele marca na mão).
--
-- Antes, o horário era reservado assim que o cliente abria o checkout e ficava
-- travado por 15 minutos. Isso causava dois problemas:
--   1) quem não concluía o pagamento de primeira (fechou a aba, não tinha o
--      app do banco na mão) ficava bloqueado do PRÓPRIO horário, e ainda via
--      a mensagem "reservado por outra pessoa", que era mentira;
--   2) passados os 15 min a linha era APAGADA - se o Pix caísse depois disso,
--      o pagamento chegava sem nada pra casar: o cliente pagava R$10 e ficava
--      sem horário, sem ninguém saber.
--
-- Agora a linha continua sendo criada quando o checkout é aberto (é ela que
-- permite reconhecer o pagamento quando chegar), mas com status
-- 'aguardando_pagamento', que NÃO ocupa a agenda. O horário só é travado
-- quando o pagamento é confirmado.

-- Guarda o link de pagamento gerado, pra devolver o MESMO link quando o
-- cliente volta pra concluir um pagamento que ficou pela metade (dois links
-- abertos arriscariam ele pagar duas vezes pelo mesmo horário).
alter table agendamentos
  add column if not exists checkout_url text;

-- Marca os agendamentos feitos pelo dono no painel admin. Eles continuam
-- ocupando o horário na agenda do cliente (ninguém consegue agendar por cima),
-- mas ficam de fora da trava de duplicado - é o que permite o encaixe.
alter table agendamentos
  add column if not exists criado_pelo_admin boolean not null default false;

-- O índice parcial mais abaixo depende de status nunca ser nulo: em SQL,
-- "null not in (...)" não dá verdadeiro, então uma linha com status nulo
-- ficaria de fora do índice e deixaria de travar o horário - abrindo espaço
-- pra dois clientes no mesmo horário. Aqui isso é fechado de vez.
update agendamentos set status = 'Pendente' where status is null;

alter table agendamentos
  alter column status set default 'Pendente';

alter table agendamentos
  alter column status set not null;

-- Os horários que já têm mais de um agendamento hoje são justamente encaixes
-- feitos na mão. Em cada horário repetido, o primeiro continua sendo o
-- agendamento "normal" e os demais passam a contar como encaixe do admin.
-- Assim a trava consegue ser criada sem apagar nenhum agendamento.
with duplicados as (
  select id,
         row_number() over (partition by data, hora order by id) as posicao
  from agendamentos
  where status not in ('aguardando_pagamento', 'expirado', 'pago_sem_horario')
)
update agendamentos a
   set criado_pelo_admin = true
  from duplicados d
 where a.id = d.id
   and d.posicao > 1;

-- A trava de horário único deixa de valer pra qualquer linha e passa a valer
-- só pras que realmente ocupam a agenda E foram feitas pelo próprio cliente.
alter table agendamentos
  drop constraint if exists agendamentos_data_hora_unique;

create unique index if not exists agendamentos_data_hora_ativos_unique
  on agendamentos (data, hora)
  where status not in ('aguardando_pagamento', 'expirado', 'pago_sem_horario')
    and criado_pelo_admin = false;

-- Status usados na coluna "status":
--   'aguardando_pagamento' - checkout aberto, sinal não pago: NÃO ocupa horário
--   'Pendente'             - sinal pago, agendamento valendo (ocupa o horário)
--   'pago_sem_horario'     - pagou, mas outra pessoa pagou esse horário antes:
--                            precisa o barbeiro remarcar ou devolver
--   'expirado'             - linha antiga do modelo de reserva, não ocupa nada
--   'Fechado'              - linha especial de "loja fechada"
