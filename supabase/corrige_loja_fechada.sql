-- =====================================================================
-- FECHA O FURO DO "LOJA_FECHADA"
--
-- Rode este arquivo INTEIRO no SQL Editor do Supabase.
-- Pode rodar mais de uma vez sem problema (é idempotente).
--
-- O PROBLEMA
-- A chave que fecha a barbearia é um agendamento com servico =
-- 'LOJA_FECHADA' (ver toggleStatusLoja em app/page.tsx). A função
-- loja_fechada() só procurava por esse nome de serviço, e a política de
-- inserção não dizia nada sobre a coluna 'servico'. Resultado: qualquer
-- cliente logado podia gravar uma linha com esse nome e deixar o site
-- inteiro exibindo "Estamos Fechados" para todo mundo - sem conseguir
-- desfazer depois, porque apagar é só do admin.
--
-- A CORREÇÃO, em duas camadas independentes:
--   1. a política de inserção passa a recusar o nome 'LOJA_FECHADA'
--      vindo de cliente;
--   2. a loja_fechada() passa a exigir status = 'Fechado', que é o que o
--      painel grava e que a política NUNCA permite a um cliente (ele só
--      pode gravar status = 'Pendente').
--
-- Uma camada sozinha já resolveria; as duas juntas garantem que um erro
-- futuro numa delas não reabre o buraco.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. ANTES DE CORRIGIR: existe alguma linha dessas gravada por cliente?
--    Se vier linha com criado_pelo_admin = false e status <> 'Fechado',
--    alguém derrubou o site - apague pelo painel depois de conferir.
-- ---------------------------------------------------------------------
select id, data, hora, cliente_nome, status, criado_pelo_admin, user_id, created_at
from agendamentos
where servico = 'LOJA_FECHADA'
order by created_at;


-- ---------------------------------------------------------------------
-- 2. Camada 1: cliente não grava mais 'LOJA_FECHADA'.
--    O ramo do admin continua intacto - é ele que usa o botão de fechar.
-- ---------------------------------------------------------------------
drop policy if exists "insercao: cliente pra si, admin qualquer" on public.agendamentos;

create policy "insercao: cliente pra si, admin qualquer"
  on public.agendamentos
  for insert
  to authenticated
  with check (
    is_admin()
    or (
      user_id::text = auth.uid()::text
      and criado_pelo_admin = false
      and status = 'Pendente'
      and servico is distinct from 'LOJA_FECHADA'
    )
  );


-- ---------------------------------------------------------------------
-- 3. Camada 2: só conta como "loja fechada" o que o painel grava.
--    O botão insere status = 'Fechado' (app/page.tsx, toggleStatusLoja);
--    cliente só consegue gravar 'Pendente'.
-- ---------------------------------------------------------------------
create or replace function public.loja_fechada()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (
    select 1 from agendamentos
    where servico = 'LOJA_FECHADA'
      and status = 'Fechado'
  );
$$;


-- ---------------------------------------------------------------------
-- 4. Conferência: a política tem a nova condição e a função o novo filtro.
--    As duas colunas têm que voltar 'true'.
-- ---------------------------------------------------------------------
select
  (select position('LOJA_FECHADA' in pg_get_expr(pol.polwithcheck, pol.polrelid)) > 0
     from pg_policy pol
    where pol.polrelid = 'public.agendamentos'::regclass
      and pol.polname = 'insercao: cliente pra si, admin qualquer')
    as politica_bloqueia_loja_fechada,
  (select position('Fechado' in pg_get_functiondef(p.oid)) > 0
     from pg_proc p
    where p.pronamespace = 'public'::regnamespace
      and p.proname = 'loja_fechada')
    as funcao_exige_status_fechado;
