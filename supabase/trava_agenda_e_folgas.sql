-- =====================================================================
-- TRAVA DA AGENDA: nunca dois clientes no mesmo dia + hora,
-- e ninguém agenda em dia de folga do barbeiro.
--
-- Rode este arquivo INTEIRO no SQL Editor do Supabase.
-- Pode rodar mais de uma vez sem problema (é idempotente).
--
-- Pré-requisito: supabase/so_pago_ocupa_horario.sql já aplicado
-- (é ele que cria a coluna criado_pelo_admin).
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1. ANTES DE TRAVAR: ver se já existe alguém marcado nos dias de folga.
--    O resultado desta consulta aparece na aba "Results". Se vier alguma
--    linha, fale com esses clientes ANTES - a trava só vale pra
--    agendamento novo, ela não apaga nem avisa quem já está marcado.
-- ---------------------------------------------------------------------
select id, data, hora, cliente_nome, cliente_telefone, status
from agendamentos
where data::text in (
        '2026-12-25','2026-12-26','2026-12-27',
        '2027-01-01','2027-01-02','2027-01-03','2027-01-04','2027-01-05'
      )
  and status not in ('aguardando_pagamento','expirado','pago_sem_horario')
order by data, hora;


-- ---------------------------------------------------------------------
-- 2. Dias em que o barbeiro não atende.
--
--    ATENÇÃO: esta lista precisa bater com as datas de lista vazia ([])
--    em lib/horarios.ts. Mudou de ideia sobre uma folga? Mude nos dois
--    lugares - aqui o banco recusa, lá a tela deixa de oferecer.
-- ---------------------------------------------------------------------
create table if not exists public.agenda_fechada (
  data   text primary key,
  motivo text
);

insert into public.agenda_fechada (data, motivo) values
  ('2026-12-25', 'Natal - barbeiro nao trabalha'),
  ('2026-12-26', 'Barbeiro nao trabalha'),
  ('2026-12-27', 'Barbeiro nao trabalha'),
  ('2027-01-01', 'Folga de inicio de ano'),
  ('2027-01-02', 'Folga de inicio de ano'),
  ('2027-01-03', 'Folga de inicio de ano'),
  ('2027-01-04', 'Folga de inicio de ano'),
  ('2027-01-05', 'Folga de inicio de ano')
on conflict (data) do nothing;

-- Cliente não precisa ler esta tabela (a grade dele vem do código), e
-- ninguém de fora pode alterá-la.
alter table public.agenda_fechada enable row level security;
revoke all on table public.agenda_fechada from anon, authenticated;


-- ---------------------------------------------------------------------
-- 3. Reafirma o índice único: dois agendamentos de CLIENTE no mesmo
--    data+hora não entram no banco, aconteça o que acontecer na tela.
--    (Já vem de so_pago_ocupa_horario.sql; repetido aqui porque é a
--    trava principal e precisa existir de verdade.)
-- ---------------------------------------------------------------------
create unique index if not exists agendamentos_data_hora_ativos_unique
  on agendamentos (data, hora)
  where status not in ('aguardando_pagamento', 'expirado', 'pago_sem_horario')
    and criado_pelo_admin = false;


-- ---------------------------------------------------------------------
-- 4. O índice do item 3 cobre cliente contra cliente. Faltavam dois
--    casos, que este gatilho fecha:
--
--    a) Cliente marcando em cima de um encaixe feito pelo dono. Linhas do
--       dono ficam de fora do índice (criado_pelo_admin = true), então o
--       banco aceitava as duas. A tela barrava, mas dois celulares
--       enviando no mesmo segundo passavam.
--
--    b) Aba antiga. Quem deixou o site aberto antes desta atualização
--       continua vendo a grade velha (com 25/12 aberto, por exemplo) e
--       conseguiria agendar num dia de folga. O código novo só chega no
--       navegador dele depois que a página é recarregada.
--
--    O dono (admin) segue podendo encaixar e marcar em dia de folga -
--    isso é decisão dele, feita com o painel na mão.
-- ---------------------------------------------------------------------
create or replace function public.valida_agendamento()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  ocupado boolean;
begin
  -- Checkout aberto e pagamento sem horário não ocupam a agenda.
  if new.status in ('aguardando_pagamento', 'expirado', 'pago_sem_horario') then
    return new;
  end if;

  -- Linha de controle do botão "fechar a barbearia", não é agendamento.
  if new.servico = 'LOJA_FECHADA' then
    return new;
  end if;

  -- Encaixe e remarcação feitos pelo dono passam direto.
  if coalesce(new.criado_pelo_admin, false) then
    return new;
  end if;

  if tg_op = 'INSERT' and exists (
       select 1 from public.agenda_fechada f where f.data = new.data::text
     ) then
    raise exception 'O barbeiro nao atende no dia %.', new.data::text
      using errcode = '23514';
  end if;

  -- Serializa por data+hora: sem isso, dois INSERTs no mesmo instante
  -- fariam a verificação abaixo ao mesmo tempo, os dois veriam o horário
  -- livre e os dois entrariam. Com o lock, o segundo espera o primeiro
  -- terminar e aí enxerga o horário já tomado.
  perform pg_advisory_xact_lock(hashtext(new.data::text || ' ' || new.hora::text));

  select exists (
    select 1 from public.agendamentos a
    where a.data = new.data
      and a.hora = new.hora
      and a.servico is distinct from 'LOJA_FECHADA'
      and a.id is distinct from new.id
      and a.status not in ('aguardando_pagamento', 'expirado', 'pago_sem_horario')
  ) into ocupado;

  -- 23505 de propósito: é o código que o site e o lib/pagamento.ts já
  -- tratam como "outra pessoa pegou esse horário primeiro". Pagamento que
  -- já entrou vira 'pago_sem_horario' em vez de sumir.
  if ocupado then
    raise exception 'Este horario acabou de ser reservado por outra pessoa.'
      using errcode = '23505';
  end if;

  return new;
end $$;

drop trigger if exists trg_valida_agendamento on public.agendamentos;

create trigger trg_valida_agendamento
  before insert or update on public.agendamentos
  for each row execute function public.valida_agendamento();


-- ---------------------------------------------------------------------
-- 5. Remove a trava ANTIGA, que virou redundante.
--
--    A função impede_horario_duplicado(), de supabase/trava_horario_duplicado.sql,
--    fazia a mesma verificação de duplicado da função acima, com duas
--    diferenças:
--
--      - não tinha lock, então dois envios no mesmo instante contavam zero
--        os dois e passavam os dois (era justamente a falha a evitar);
--      - não conhecia os dias de folga.
--
--    Tudo que ela protegia, a valida_agendamento() acima protege - inclusive
--    a exclusão de LOJA_FECHADA, que foi copiada de lá. Manter as duas
--    deixaria a mesma regra escrita em dois lugares, e um dia alguém mudaria
--    só um deles.
--
--    O arquivo trava_horario_duplicado.sql continua no projeto como registro
--    do que existiu, mas NÃO deve mais ser executado: rodá-lo recria o gatilho
--    antigo e a regra volta a ficar duplicada.
-- ---------------------------------------------------------------------
drop trigger if exists trg_impede_horario_duplicado on public.agendamentos;
drop function if exists public.impede_horario_duplicado();


-- ---------------------------------------------------------------------
-- 6. Conferência final.
--    Tem que voltar EXATAMENTE 2 linhas:
--      indice   | agendamentos_data_hora_ativos_unique
--      gatilho  | trg_valida_agendamento
--
--    Se aparecer trg_impede_horario_duplicado, a remoção acima não rodou.
-- ---------------------------------------------------------------------
select 'indice' as trava, indexname as nome
from pg_indexes
where tablename = 'agendamentos'
  and indexname = 'agendamentos_data_hora_ativos_unique'
union all
select 'gatilho' as trava, tgname as nome
from pg_trigger
where tgrelid = 'public.agendamentos'::regclass
  and not tgisinternal
order by 1, 2;
