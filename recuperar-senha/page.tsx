'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import Link from 'next/link';

// Ligando o motor do banco de dados (Supabase)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function RecuperarSenha() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleRecuperar = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    // Comando do Supabase para enviar email de recuperação
    const { error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) {
      setMessage('Erro: ' + error.message);
    } else {
      setMessage('Te enviamos um email com as instruções para criar uma nova senha!');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/60 rounded-3xl p-8 shadow-2xl">
        <h1 className="text-3xl font-bold text-zinc-50 mb-4 text-center">Recuperar Senha</h1>
        <p className="text-zinc-400 text-center mb-6 text-sm">
          Digite seu email abaixo e enviaremos um link para você criar uma nova senha.
        </p>
        
        <form onSubmit={handleRecuperar} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-zinc-400">Email da sua conta</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-zinc-100 focus:outline-none focus:border-amber-500 transition-all"
              placeholder="seu@email.com"
            />
          </div>

          {message && (
            <div className={`p-4 rounded-xl text-sm font-semibold text-center ${message.includes('enviamos') ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
              {message}
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold py-4 rounded-xl transition-all disabled:opacity-50"
          >
            {loading ? 'Enviando...' : 'Enviar link de recuperação'}
          </button>
        </form>

        <div className="mt-6 text-center text-zinc-400 text-sm">
          Lembrou a senha?{' '}
          <Link href="/login" className="text-amber-500 hover:underline font-semibold">
            Voltar para o login
          </Link>
        </div>
      </div>
    </div>
  );
}
