'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Calendar, Clock, Scissors, User, LogOut } from 'lucide-react';
import logoImg from './logo.jpeg';
import donoImg from './dono.jpeg';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

// Ligando o motor do banco de dados (Supabase)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // O "Segurança" invisível: se não tiver logado, manda pro /login
  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        router.push('/login'); // Expulsa para a tela de login
      } else {
        setLoading(false); // Libera a entrada
      }
    };
    checkUser();
  }, [router]);

  // Função para deslogar
  const handleSair = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  // Tela de carregamento enquanto o "Segurança" verifica a conta
  if (loading) {
    return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-amber-500 font-bold text-xl">Carregando Barbearia...</div>;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-amber-500 selection:text-zinc-950">
      {/* Navbar */}
      <nav className="flex justify-between items-center p-6 md:px-12 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50 border-b border-zinc-800/60">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]">
            <Image src={logoImg} alt="Logo" className="w-full h-full object-cover" />
          </div>
          <span className="text-xl font-black tracking-widest text-zinc-100">NOVO DE NOVO</span>
        </div>
        
        {/* Novo botão de Sair (já que a pessoa já vai estar logada) */}
        <button 
          onClick={handleSair}
          className="flex items-center gap-2 bg-zinc-800 text-zinc-300 px-6 py-2 rounded-full font-bold hover:bg-zinc-700 hover:text-white transition-colors"
        >
          <LogOut size={18} />
          Sair da Conta
        </button>
      </nav>

      {/* Hero Section */}
      <main className="flex flex-col lg:flex-row items-center justify-between p-6 md:p-12 gap-12 max-w-7xl mx-auto mt-8">
        
        {/* Lado Esquerdo - Textos e Imagem do Dono */}
        <div className="flex-1 space-y-8">
          <h1 className="text-5xl md:text-7xl font-black leading-tight">
            O seu estilo, <br />
            <span className="text-amber-500 drop-shadow-[0_0_15px_rgba(245,158,11,0.4)]">nossa especialidade.</span>
          </h1>
          <p className="text-lg text-zinc-400 max-w-md leading-relaxed">
            A barbearia que combina tradição e tendências. Agende seu horário com os melhores profissionais e garanta um visual impecável.
          </p>

          {/* Imagem do Dono Premium */}
          <div className="relative h-64 md:h-96 w-full rounded-3xl overflow-hidden border border-zinc-800/60 shadow-2xl group">
            <Image 
              src={donoImg} 
              alt="Barbeiro cortando cabelo" 
              fill 
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/80 to-transparent"></div>
            <div className="absolute bottom-4 left-4 bg-zinc-950/80 backdrop-blur-sm px-4 py-2 rounded-full border border-amber-500/30 flex items-center gap-2">
              <Scissors size={16} className="text-amber-500" />
              <span className="text-sm font-bold text-amber-500 tracking-wide uppercase">Cortes Premium</span>
            </div>
          </div>
        </div>

        {/* Lado Direito - Formulario de Agendamento */}
        <div className="flex-1 w-full max-w-md bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/60 rounded-3xl p-8 shadow-2xl">
          <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
            <div className="w-1.5 h-6 bg-amber-500 rounded-full"></div>
            Agendar Horário
          </h2>

          <form className="space-y-6">
            
            {/* Serviço */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-zinc-500 tracking-widest uppercase flex items-center gap-2">
                <Scissors size={14} /> 1. Escolha o Serviço
              </label>
              <div className="grid grid-cols-2 gap-3">
                {['Corte Social', 'Barba', 'Corte + Barba', 'Sobrancelha'].map((servico) => (
                  <label key={servico} className="relative cursor-pointer">
                    <input type="radio" name="servico" className="peer sr-only" />
                    <div className="p-3 rounded-xl border border-zinc-700 text-sm font-semibold text-zinc-400 text-center peer-checked:border-amber-500 peer-checked:bg-amber-500/10 peer-checked:text-amber-500 transition-all hover:border-zinc-500">
                      {servico}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Profissional */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-zinc-500 tracking-widest uppercase flex items-center gap-2">
                <User size={14} /> 2. Profissional
              </label>
              <select className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-4 text-zinc-100 focus:outline-none focus:border-amber-500 appearance-none">
                <option>Qualquer profissional</option>
                <option>Higor (Dono)</option>
                <option>Lucas</option>
              </select>
            </div>

            {/* Data e Hora */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-3">
                <label className="text-xs font-bold text-zinc-500 tracking-widest uppercase flex items-center gap-2">
                  <Calendar size={14} /> Data
                </label>
                <input type="date" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 text-zinc-100 focus:outline-none focus:border-amber-500" />
              </div>
              <div className="space-y-3">
                <label className="text-xs font-bold text-zinc-500 tracking-widest uppercase flex items-center gap-2">
                  <Clock size={14} /> Hora
                </label>
                <input type="time" className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3.5 text-zinc-100 focus:outline-none focus:border-amber-500" />
              </div>
            </div>

            {/* Botão Confirmar */}
            <button type="button" className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-lg py-4 rounded-xl mt-4 transition-all duration-300 shadow-[0_0_20px_rgba(245,158,11,0.15)] hover:shadow-[0_0_30px_rgba(245,158,11,0.3)] hover:-translate-y-1">
              Confirmar Agendamento
            </button>
          </form>
        </div>

      </main>
    </div>
  );
}
