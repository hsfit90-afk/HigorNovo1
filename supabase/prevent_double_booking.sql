-- 1) Verifique antes se já existem horários duplicados no histórico atual.
--    Se essa consulta retornar linhas, resolva-as manualmente antes do passo 2
--    (a constraint abaixo falha ao criar se já houver duplicatas).
select data, hora, count(*)
from agendamentos
group by data, hora
having count(*) > 1;

-- 2) Trava definitiva: impede que exista mais de um agendamento
--    para o mesmo dia + horário, mesmo sob concorrência (2 clientes
--    confirmando ao mesmo tempo).
alter table agendamentos
  add constraint agendamentos_data_hora_unique unique (data, hora);
