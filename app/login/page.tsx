'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Scissors } from 'lucide-react';

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

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setMessage('Email ou senha incorretos.');
    } else {
      // REGRA DO CHEFE: Se o email for o seu, manda pro Painel do Admin!
      if (email === 'souza.higor@gmail.com') {
        router.push('/admin');
      } else {
        router.push('/');
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4 relative overflow-hidden">
      
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-amber-600/20 blur-[120px] rounded-full pointer-events-none mix-blend-screen"></div>

      <div className="w-full max-w-md bg-zinc-900/40 backdrop-blur-2xl border border-white/10 rounded-[2rem] p-8 shadow-2xl relative z-10">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-zinc-950 border border-amber-500/30 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.2)]">
            <Scissors size={28} className="text-amber-500" />
          </div>
        </div>

        <h1 className="text-3xl font-black text-white text-center mb-2">Bem-vindo de volta</h1>
        <p className="text-zinc-400 text-center text-sm mb-8">Faça login para continuar</p>

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-bold text-zinc-400 tracking-widest uppercase">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-zinc-100 focus:outline-none focus:border-amber-500/50 transition-colors"
              placeholder="seu@email.com"
              required
            />
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-zinc-400 tracking-widest uppercase">Senha</label>
              <Link href="/recuperar-senha" className="text-xs text-amber-500 hover:text-amber-400 font-semibold transition-colors">
                Esqueceu a senha?
              </Link>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-zinc-100 focus:outline-none focus:border-amber-500/50 transition-colors"
              placeholder="••••••••"
              required
            />
          </div>

          {message && (
            <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-semibold text-center">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-lg py-4 rounded-xl mt-6 transition-all shadow-[0_0_20px_rgba(245,158,11,0.2)] disabled:opacity-50"
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
