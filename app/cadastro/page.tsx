'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

// Ligando o motor do banco de dados (Supabase)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function Cadastro() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleCadastro = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    // Comando para salvar o usuário no Supabase
    const { error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      setMessage('Erro ao cadastrar: ' + error.message);
    } else {
      setMessage('Conta criada com sucesso! Você já pode fazer o login.');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/60 rounded-3xl p-8 shadow-2xl">
        <h1 className="text-3xl font-bold text-zinc-50 mb-6 text-center">Criar Conta</h1>
        
        <form onSubmit={handleCadastro} className="space-y-6">
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
            <label className="text-sm font-semibold text-zinc-400">Senha</label>
            <input 
              type="password" 
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-zinc-100 focus:outline-none focus:border-amber-500 transition-all"
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          {message && (
            <div className={`p-4 rounded-xl text-sm font-semibold text-center ${message.includes('sucesso') ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
              {message}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold py-4 rounded-xl transition-all disabled:opacity-50"
          >
            {loading ? 'Criando conta...' : 'Cadastrar'}
          </button>
        </form>

        <div className="mt-6 text-center text-zinc-400 text-sm">
          Já tem uma conta?{' '}
          <Link href="/login" className="text-amber-500 hover:underline font-semibold">
            Fazer login
          </Link>
        </div>
      </div>
    </div>
  );
}
