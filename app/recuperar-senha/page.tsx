'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Scissors, Eye, EyeOff } from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function RecuperarSenha() {
  const router = useRouter();
  const [modo, setModo] = useState<'pedir' | 'redefinir'>('pedir');
  const [email, setEmail] = useState('');
  const [novaSenha, setNovaSenha] = useState('');
  const [showSenha, setShowSenha] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    // Quando o cliente clica no link do email, o Supabase abre esta mesma página
    // já autenticado numa "sessão de recuperação" e dispara este evento.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setModo('redefinir');
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const handlePedirRecuperacao = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/recuperar-senha`,
    });

    if (error) {
      setMessage('Erro: ' + error.message);
    } else {
      setMessage('Te enviamos um email com as instruções para criar uma nova senha!');
    }
    setLoading(false);
  };

  const handleRedefinirSenha = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const { error } = await supabase.auth.updateUser({ password: novaSenha });

    if (error) {
      setMessage('Erro: ' + error.message);
      setLoading(false);
    } else {
      setMessage('Senha atualizada com sucesso! Redirecionando...');
      setTimeout(() => router.push('/'), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6 text-zinc-50">
      <div className="w-full max-w-md bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/60 rounded-3xl p-8 shadow-2xl">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-full bg-blue-600/10 flex items-center justify-center border border-blue-600/20 shadow-[0_0_20px_rgba(37,99,235,0.15)]">
            <Scissors className="text-blue-600" size={32} />
          </div>
        </div>

        {modo === 'pedir' ? (
          <>
            <h1 className="text-3xl font-bold text-zinc-50 mb-4 text-center">Recuperar Senha</h1>
            <p className="text-zinc-400 text-center mb-6 text-sm">
              Digite seu email abaixo e enviaremos um link para você criar uma nova senha.
            </p>

            <form onSubmit={handlePedirRecuperacao} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-400">Email da sua conta</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-zinc-100 focus:outline-none focus:border-blue-600 transition-all"
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
                className="w-full bg-blue-600 hover:bg-blue-500 text-zinc-950 font-bold py-4 rounded-xl transition-all disabled:opacity-50"
              >
                {loading ? 'Enviando...' : 'Enviar link de recuperação'}
              </button>
            </form>

            <div className="mt-6 text-center text-zinc-400 text-sm">
              Lembrou a senha?{' '}
              <Link href="/login" className="text-blue-600 hover:underline font-semibold">
                Voltar para o login
              </Link>
            </div>
          </>
        ) : (
          <>
            <h1 className="text-3xl font-bold text-zinc-50 mb-4 text-center">Criar Nova Senha</h1>
            <p className="text-zinc-400 text-center mb-6 text-sm">
              Digite sua nova senha abaixo para concluir a recuperação.
            </p>

            <form onSubmit={handleRedefinirSenha} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-zinc-400">Nova senha</label>
                <div className="relative">
                  <input
                    type={showSenha ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={novaSenha}
                    onChange={(e) => setNovaSenha(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 pr-14 text-zinc-100 focus:outline-none focus:border-blue-600 transition-all"
                    placeholder="••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSenha(!showSenha)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-blue-600 transition-colors p-1"
                    aria-label={showSenha ? 'Ocultar senha' : 'Mostrar senha'}
                  >
                    {showSenha ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {message && (
                <div className={`p-4 rounded-xl text-sm font-semibold text-center ${message.includes('sucesso') ? 'bg-green-500/10 text-green-500 border border-green-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'}`}>
                  {message}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-500 text-zinc-950 font-bold py-4 rounded-xl transition-all disabled:opacity-50"
              >
                {loading ? 'Salvando...' : 'Salvar nova senha'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
