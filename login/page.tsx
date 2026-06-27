'use client';

import { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { Scissors, Eye, EyeOff } from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function Login() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  // NOVA FUNÇÃO DO OLHINHO:
  const [showPassword, setShowPassword] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setError('Email ou senha incorretos.');
      } else {
        router.push('/');
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        setError(error.message);
      } else {
        setSuccess('Conta criada com sucesso! Você já pode fazer o login.');
        setIsLogin(true); // Retorna para a tela de login
      }
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6 text-zinc-50 relative overflow-hidden">
      
      {/* Luzes de fundo iguais ao do site principal */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-zinc-900/40 backdrop-blur-3xl p-8 rounded-[2.5rem] border border-white/5 shadow-2xl relative z-10">
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 rounded-full bg-blue-600/10 flex items-center justify-center border border-blue-600/20 shadow-[0_0_20px_rgba(37,99,235,0.15)]">
            <Scissors className="text-blue-600" size={32} />
          </div>
        </div>

        <div className="text-center mb-8">
          <h1 className="text-3xl font-black mb-2">{isLogin ? 'Bem-vindo de volta' : 'Criar Conta'}</h1>
          <p className="text-zinc-400 text-sm font-medium">
            {isLogin ? 'Faça login para continuar' : 'Cadastre-se para agendar seu horário'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="flex flex-col gap-6">
          <div>
            <label className="block text-xs font-bold text-zinc-400 mb-2 uppercase tracking-wider">E-MAIL</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-zinc-950/50 border border-zinc-800 p-4 rounded-xl text-white outline-none focus:border-blue-600 transition-all"
              placeholder="exemplo@gmail.com"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider">SENHA</label>
              {isLogin && (
                <button type="button" className="text-xs font-bold text-blue-600 hover:text-blue-500">Esqueceu a senha?</button>
              )}
            </div>
            
            {/* NOVO CAMPO DE SENHA COM OLHINHO */}
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-950/50 border border-zinc-800 p-4 rounded-xl text-white outline-none focus:border-blue-600 transition-all pr-14"
                placeholder="••••••"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-blue-600 transition-colors p-1"
                aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-4 rounded-xl text-sm font-semibold text-center">
              {error}
            </div>
          )}

          {success && (
            <div className="bg-green-500/10 border border-green-500/20 text-green-500 p-4 rounded-xl text-sm font-semibold text-center">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-zinc-950 font-black rounded-xl text-lg transition-all shadow-[0_0_20px_rgba(37,99,235,0.2)] disabled:opacity-50 mt-2"
          >
            {loading ? 'Aguarde...' : (isLogin ? 'Fazer Login' : 'Cadastrar')}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button
            type="button"
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
              setSuccess('');
              setEmail('');
              setPassword('');
              setShowPassword(false);
            }}
            className="text-sm font-medium text-zinc-400 hover:text-white transition-colors"
          >
            {isLogin ? (
              <>Ainda não tem conta? <span className="text-blue-600 font-bold">Criar conta</span></>
            ) : (
              <>Já tem uma conta? <span className="text-blue-600 font-bold">Fazer login</span></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
