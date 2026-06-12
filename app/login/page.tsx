'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

// Ligando o motor do banco de dados (Supabase)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage('Erro ao entrar. Verifique seu email e senha.');
      setLoading(false);
    } else {
      // REGRA DO ADMIN: Se o email for este abaixo, vai pro painel admin. Se não, vai pra página inicial.
      if (email === 'admin@barbearia.com') {
        router.push('/admin');
      } else {
        router.push('/');
      }
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/60 rounded-3xl p-8 shadow-2xl">
        <h1 className="text-3xl font-bold text-zinc-50 mb-6 text-center">Entrar</h1>
        
        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-400">Email</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-zinc-100 focus:outline-none focus:border-amber-500 transition-all"
              placeholder="seu@email.com"
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-semibold text-zinc-400">Senha</label>
              <Link href="/recuperar-senha" className="text-sm text-amber-500 hover:underline">
                Esqueceu a senha?
              </Link>
            </div>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-zinc-100 focus:outline-none focus:border-amber-500 transition-all"
              placeholder="••••••••"
            />
          </div>

          {message && (
            <div className="p-4 rounded-xl text-sm font-semibold text-center bg-red-500/10 text-red-500 border border-red-500/20">
              {message}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold py-4 rounded-xl transition-all disabled:opacity-50"
          >
            {loading ? 'Entrando...' : 'Fazer Login'}
          </button>
        </form>

        <div className="mt-6 text-center text-zinc-400 text-sm">
          Ainda não tem conta?{' '}
          <Link href="/cadastro" className="text-amber-500 hover:underline font-semibold">
            Criar conta
          </Link>
        </div>
      </div>
    </div>
  );
}
