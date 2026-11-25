-- =====================================================================
-- CANCELAMENTO PELO PRÓPRIO CLIENTE
--
-- Rode este arquivo INTEIRO no SQL Editor do Supabase.
-- Pode rodar mais de uma vez sem problema (é idempotente).
--
-- Por que uma função, e não uma política de DELETE solta:
-- uma política daria ao cliente o direito de apagar linhas direto da
-- tabela, e qualquer regra nova (não cancelar o que o dono marcou, não
-- apagar histórico antigo) teria que ser repetida em todo lugar que
-- apaga. Aqui a regra vive num lugar só, e o cliente continua SEM
-- permissão de UPDATE ou DELETE na tabela - como está em
-- supabase/protecao_dados.sql.
-- =====================================================================

create or replace function public.cancelar_meu_agendamento(p_id bigint)
returns table (servico text, data text, hora text)
language plpgsql
security definer
set search_path = public
as $$
declare
  alvo agendamentos%rowtype;
  hoje_sp text := to_char(now() at time zone 'America/Sao_Paulo', 'YYYY-MM-DD');
begin
  if auth.uid() is null then
    raise exception 'Faca login para cancelar um agendamento.' using errcode = '42501';
  end if;

  select * into alvo from agendamentos a where a.id = p_id;

  if not found then
    raise exception 'Agendamento nao encontrado.' using errcode = 'P0002';
  end if;

  -- Dono do agendamento. Sem isso, qualquer cliente logado cancelaria o
  -- horario de outra pessoa so mandando o id na requisicao.
  if alvo.user_id is null or alvo.user_id::text <> auth.uid()::text then
    raise exception 'Este agendamento nao e seu.' using errcode = '42501';
  end if;

  -- Encaixe e marcacao feitos pelo dono no painel ficam so com ele: nao
  -- tem como o app saber de quem e, e o cliente nem enxerga na lista.
  if coalesce(alvo.criado_pelo_admin, false) then
    raise exception 'Fale com a barbearia para cancelar este agendamento.'
      using errcode = '42501';
  end if;

  -- Comparacao so por data, sem a hora de proposito: o horario 00:00 do
  -- dia 23/12 e a madrugada que entra no dia 24 (ver lib/horarios.ts).
  -- Comparando data+hora, ele contaria como passado durante todo o dia 23
  -- e o cliente ficaria sem conseguir cancelar.
  if alvo.data::text < hoje_sp then
    raise exception 'Agendamento ja passou e nao pode mais ser cancelado.'
      using errcode = '22023';
  end if;

  delete from agendamentos a where a.id = p_id;

  -- Devolve o que foi apagado para a tela montar o aviso do WhatsApp.
  servico := alvo.servico::text;
  data    := alvo.data::text;
  hora    := alvo.hora::text;
  return next;
end $$;

-- Só cliente logado chama. Visitante sem login não tem o que cancelar.
revoke all on function public.cancelar_meu_agendamento(bigint) from public, anon;
grant execute on function public.cancelar_meu_agendamento(bigint) to authenticated;


-- ---------------------------------------------------------------------
-- Conferência: a função existe e está com as permissões certas.
-- Tem que voltar 1 linha, com security_definer = true.
-- ---------------------------------------------------------------------
select p.proname                              as funcao,
       p.prosecdef                            as security_definer,
       has_function_privilege('authenticated', p.oid, 'execute') as cliente_pode_executar,
       has_function_privilege('anon',          p.oid, 'execute') as visitante_pode_executar
from pg_proc p
where p.pronamespace = 'public'::regnamespace
  and p.proname = 'cancelar_meu_agendamento';
