-- Rode SOZINHA esta consulta (o Supabase só mostra o resultado da última).
-- Olhe a coluna "criado_pelo_admin" nas duas linhas das 19:00:
--   true  = foi encaixe feito por você/Pietro no painel (comportamento combinado)
--   false = foram dois clientes agendando pelo site (aí é falha de verdade)

select
  id,
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
