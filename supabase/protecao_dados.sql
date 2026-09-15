-- PROTEÇÃO DOS DADOS (RLS) - quem pode fazer o quê no banco.
--
-- Antes: a tabela "agendamentos" tinha 4 políticas "Permitir tudo" para
-- qualquer pessoa, e "assinantes" estava sem proteção nenhuma. Como a chave
-- que o site usa no navegador é pública (qualquer um vê no F12), isso
-- significava que QUALQUER PESSOA, sem login, conseguia ler o nome e o
-- telefone de todos os clientes, apagar agendamentos, fechar a loja, etc.
--
-- Agora:
--   - Visitante (sem login): só enxerga quais horários estão ocupados e se a
--     loja está fechada - através de funções que não devolvem dado pessoal.
--   - Cliente logado: cria agendamento pra si mesmo e vê só os próprios.
--   - Admin (emails abaixo): tudo.
--   - Rotas do servidor (pagamento): usam a chave de serviço, que ignora
--     estas regras - ver lib/supabaseServer.ts.
--
-- ORDEM DE APLICAÇÃO: rode este arquivo DEPOIS do código novo estar no ar.
-- O site novo tenta as funções abaixo e, se ainda não existirem, cai no
-- acesso antigo; assim não há janela em que o agendamento pare de funcionar.


-- ============================================================
-- 1) Quem é admin (mesma lista que o código usa hoje)
-- ============================================================
create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select coalesce(auth.jwt() ->> 'email', '')
         in ('souza.higor@gmail.com', 'pietro.radical.black@gmail.com');
$$;


-- ============================================================
-- 2) Funções públicas seguras (não devolvem nome nem telefone)
-- ============================================================

-- Horários ocupados de um dia. Devolve só hora e status - é tudo que a grade
-- de horários precisa pra pintar o que está livre e o que não está.
create or replace function public.horarios_ocupados(p_data text)
returns table (hora text, status text)
language sql stable security definer
set search_path = public
as $$
  select a.hora::text, a.status::text
  from agendamentos a
  where a.data::text = p_data;
$$;

-- A loja está fechada para novos agendamentos?
create or replace function public.loja_fechada()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (select 1 from agendamentos where servico = 'LOJA_FECHADA');
$$;

-- O assinante desse telefone ainda tem corte do plano neste mês?
-- Usado só quando a cobrança de sinal está ligada (SINAL_ATIVO em app/page.tsx).
-- Devolve apenas verdadeiro/falso - nunca a lista de assinantes.
create or replace function public.tem_corte_de_plano(p_telefone text)
returns boolean
language sql stable security definer
set search_path = public
as $$
  select coalesce((
    select (case when a.cortes_mes_referencia = to_char(now() at time zone 'America/Sao_Paulo', 'YYYY-MM')
                 then coalesce(a.cortes_usados, 0)
                 else 0 end) < 4
    from assinantes a
    where a.cliente_telefone = regexp_replace(p_telefone, '\D', '', 'g')
      and a.ativo = true
    limit 1
  ), false);
$$;

revoke all on function public.is_admin() from public;
revoke all on function public.horarios_ocupados(text) from public;
revoke all on function public.loja_fechada() from public;
revoke all on function public.tem_corte_de_plano(text) from public;

grant execute on function public.is_admin() to anon, authenticated;
grant execute on function public.horarios_ocupados(text) to anon, authenticated;
grant execute on function public.loja_fechada() to anon, authenticated;
grant execute on function public.tem_corte_de_plano(text) to authenticated;


-- ============================================================
-- 3) agendamentos
-- ============================================================
alter table public.agendamentos enable row level security;

-- Remove as políticas antigas de "Permitir tudo pra todo mundo", seja qual
-- for o nome exato delas.
do $$
declare p record;
begin
  for p in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'agendamentos'
  loop
    execute format('drop policy if exists %I on public.agendamentos', p.policyname);
  end loop;
end $$;

-- Ler: admin vê tudo; cliente logado vê só os próprios agendamentos.
-- Visitante sem login não lê a tabela (usa horarios_ocupados / loja_fechada).
create policy "leitura: admin tudo, cliente os proprios"
  on public.agendamentos
  for select
  to authenticated
  using (is_admin() or user_id::text = auth.uid()::text);

-- Criar: cliente logado só agenda pra si mesmo, como agendamento normal;
-- admin agenda qualquer coisa (encaixe, fechar loja, cliente sem celular).
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
    )
  );

-- Alterar e apagar: só admin.
create policy "atualizacao: so admin"
  on public.agendamentos
  for update
  to authenticated
  using (is_admin())
  with check (is_admin());

create policy "exclusao: so admin"
  on public.agendamentos
  for delete
  to authenticated
  using (is_admin());


-- ============================================================
-- 4) assinantes - só admin, em tudo
-- ============================================================
alter table public.assinantes enable row level security;

do $$
declare p record;
begin
  for p in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'assinantes'
  loop
    execute format('drop policy if exists %I on public.assinantes', p.policyname);
  end loop;
end $$;

create policy "assinantes: so admin"
  on public.assinantes
  for all
  to authenticated
  using (is_admin())
  with check (is_admin());
