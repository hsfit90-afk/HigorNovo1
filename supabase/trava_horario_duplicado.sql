-- TRAVA EXTRA contra dois clientes no mesmo horário.
--
-- Já existe um índice único (agendamentos_data_hora_ativos_unique) fazendo
-- esse papel. Este gatilho é uma segunda camada: roda a cada gravação, vale
-- para qualquer caminho (site, painel, acesso direto ao banco) e devolve uma
-- mensagem clara em vez de um erro técnico.
--
-- Regra: um horário só aceita UM agendamento de cliente. O encaixe feito pelo
-- dono no painel (criado_pelo_admin = true) continua permitido, porque ele
-- precisa disso pra atender cliente sem celular.

create or replace function public.impede_horario_duplicado()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  ja_ocupado integer;
begin
  -- Encaixe do dono: liberado de propósito.
  if coalesce(new.criado_pelo_admin, false) then
    return new;
  end if;

  -- Linhas que não ocupam a agenda (checkout sem pagamento, etc) não disputam.
  if new.status in ('aguardando_pagamento', 'expirado', 'pago_sem_horario') then
    return new;
  end if;

  -- "Loja fechada" é uma linha de controle, não um atendimento.
  if new.servico = 'LOJA_FECHADA' then
    return new;
  end if;

  select count(*)
    into ja_ocupado
  from agendamentos a
  where a.data = new.data
    and a.hora = new.hora
    and a.servico is distinct from 'LOJA_FECHADA'
    and a.status not in ('aguardando_pagamento', 'expirado', 'pago_sem_horario')
    and (tg_op = 'INSERT' or a.id <> new.id);

  if ja_ocupado > 0 then
    -- O código 23505 é o mesmo de "já existe" do banco, então o site já sabe
    -- mostrar a mensagem certa pro cliente sem precisar de ajuste.
    raise exception 'Este horário já está ocupado.' using errcode = '23505';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_impede_horario_duplicado on public.agendamentos;

create trigger trg_impede_horario_duplicado
  before insert or update on public.agendamentos
  for each row
  execute function public.impede_horario_duplicado();

-- Garante que o índice único está mesmo no lugar (é ele que resolve o caso de
-- dois clientes confirmando no mesmo instante - o gatilho sozinho não cobre
-- isso, porque as duas gravações simultâneas ainda não enxergam uma à outra).
create unique index if not exists agendamentos_data_hora_ativos_unique
  on agendamentos (data, hora)
  where status not in ('aguardando_pagamento', 'expirado', 'pago_sem_horario')
    and criado_pelo_admin = false;
