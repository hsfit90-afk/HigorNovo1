-- Tabela de assinantes dos planos mensais (Ouro / Diamante).
-- Cadastro manual pelo admin, depois de confirmar o pagamento no InfinitePay.
create table if not exists assinantes (
  id bigint generated always as identity primary key,
  cliente_nome text not null,
  cliente_telefone text not null unique,
  plano text not null check (plano in ('ouro', 'diamante')),
  ativo boolean not null default true,
  criado_em timestamptz not null default now()
);

-- Mantém a mesma abertura de acesso que a tabela "agendamentos" já usa hoje
-- com a chave anônima (o painel admin e o site autenticam só pelo email no
-- front-end, não por RLS). Ajuste isso se decidir reforçar RLS no futuro.
alter table assinantes disable row level security;
