import { createClient } from '@supabase/supabase-js';

// Cliente do Supabase para código que roda SÓ no servidor (rotas em app/api).
//
// Usa a chave de serviço (SUPABASE_SERVICE_ROLE_KEY), que ignora as regras de
// proteção (RLS) - necessário porque as rotas de pagamento criam e confirmam
// agendamentos em nome do cliente, e a chave pública não tem mais permissão
// pra isso depois de supabase/protecao_dados.sql.
//
// NUNCA use esta chave no navegador nem a exponha com prefixo NEXT_PUBLIC_.
// Ela é configurada na Vercel em Project Settings -> Environment Variables
// (tipo "Secret"), e no .env.local pra rodar localmente.
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const chaveDeServico = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!chaveDeServico) {
  console.warn(
    '[supabaseServer] SUPABASE_SERVICE_ROLE_KEY não configurada - usando a chave pública. ' +
    'Com a proteção (RLS) ligada, as rotas de pagamento vão falhar até configurar.'
  );
}

export const supabaseServer = createClient(
  url,
  chaveDeServico || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);
