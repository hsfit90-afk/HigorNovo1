import { createClient } from '@supabase/supabase-js';

// Aqui o código vai buscar as chaves secretas que guardamos no cofre da Vercel
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Criando a conexão com o banco de dados
export const supabase = createClient(supabaseUrl, supabaseKey);
