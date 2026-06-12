import Image from 'next/image';
import { Calendar, Clock, Scissors, User } from 'lucide-react';
import logoImg from './logo.jpeg';
import donoImg from './dono.jpeg';

export default function Home() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-amber-500 selection:text-zinc-950">
      {/* Menu Superior */}
      <header className="border-b border-zinc-800/60 bg-zinc-950/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Image src={logoImg} alt="Novo de Novo Logo" width={50} height={50} className="rounded-full border-2 border-amber-500/20" />
            <span className="text-xl font-bold tracking-wider text-amber-500 uppercase">Novo de Novo</span>
          </div>
          <button className="bg-amber-500 hover:bg-amber-400 text-zinc-950 font-semibold px-6 py-2.5 rounded-lg transition-all duration-300 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            Entrar
          </button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-12 grid lg:grid-cols-2 gap-12 items-center">
        
        {/* Coluna da Esquerda - Textos e Imagem */}
        <div className="space-y-10">
          <div className="space-y-6">
            <h1 className="text-5xl md:text-6xl font-extrabold leading-tight tracking-tight">
              O seu estilo, <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-yellow-200">
                nossa especialidade.
              </span>
            </h1>
            <p className="text-zinc-400 text-lg leading-relaxed max-w-md">
              A barbearia que combina tradição e tendências. Agende seu horário com os melhores profissionais e garanta um visual impecável.
            </p>
          </div>

          <div className="relative h-64 md:h-96 w-full rounded-3xl overflow-hidden border border-zinc-800/60 shadow-2xl group">
            <Image 
              src={donoImg} 
              alt="Barbeiro cortando cabelo" 
              fill 
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent opacity-90"></div>
            <div className="absolute bottom-6 left-6 right-6">
               <div className="flex items-center gap-3 text-amber-400 bg-zinc-950/80 backdrop-blur-sm w-fit px-4 py-2 rounded-full border border-amber-500/20">
                  <Scissors size={18} />
                  <span className="text-sm font-semibold tracking-wide uppercase">Cortes Premium</span>
               </div>
            </div>
          </div>
        </div>

        {/* Coluna da Direita - Formulário de Agendamento */}
        <div className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/60 rounded-3xl p-6 md:p-10 shadow-2xl relative overflow-hidden">
          {/* Brilho decorativo no fundo */}
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl"></div>

          <h2 className="text-3xl font-bold mb-8 flex items-center gap-3">
            <span className="bg-amber-500 w-2 h-8 rounded-full inline-block shadow-[0_0_10px_rgba(245,158,11,0.5)]"></span>
            Agendar Horário
          </h2>

          <form className="space-y-8 relative z-10">
            {/* Escolha do Serviço */}
            <div className="space-y-4">
              <label className="text-sm font-semibold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                <Scissors size={16} className="text-amber-500" /> 1. Escolha o Serviço
              </label>
              <div className="grid grid-cols-2 gap-3">
                {['Corte Social', 'Barba', 'Corte + Barba', 'Sobrancelha'].map((servico) => (
                  <label key={servico} className="cursor-pointer">
                    <input type="radio" name="servico" className="peer sr-only" />
                    <div className="p-4 rounded-2xl border border-zinc-800 bg-zinc-950/50 text-center hover:border-amber-500/50 peer-checked:border-amber-500 peer-checked:bg-amber-500/10 peer-checked:text-amber-500 transition-all duration-300">
                      <span className="font-medium text-sm md:text-base">{servico}</span>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Profissional */}
            <div className="space-y-4">
              <label className="text-sm font-semibold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                <User size={16} className="text-amber-500" /> 2. Profissional
              </label>
              <div className="relative">
                <select className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 pl-4 pr-10 text-zinc-100 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all appearance-none cursor-pointer">
                  <option value="">Qualquer profissional</option>
                  <option value="dono">Dono (Especialista)</option>
                  <option value="hugo">Hugo</option>
                </select>
              </div>
            </div>

            {/* Data e Hora */}
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <label className="text-sm font-semibold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                  <Calendar size={16} className="text-amber-500" /> Data
                </label>
                <input type="date" className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-zinc-100 focus:outline-none focus:border-amber-500 transition-all [color-scheme:dark] cursor-pointer" />
              </div>
              <div className="space-y-4">
                <label className="text-sm font-semibold text-zinc-400 uppercase tracking-widest flex items-center gap-2">
                  <Clock size={16} className="text-amber-500" /> Hora
                </label>
                <input type="time" className="w-full bg-zinc-950 border border-zinc-800 rounded-2xl p-4 text-zinc-100 focus:outline-none focus:border-amber-500 transition-all [color-scheme:dark] cursor-pointer" />
              </div>
            </div>

            {/* Botão Confirmar */}
            <button type="button" className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-lg py-5 rounded-2xl mt-4 transition-all duration-300 shadow-[0_0_20px_rgba(245,158,11,0.15)] hover:shadow-[0_0_30px_rgba(245,158,11,0.3)] hover:-translate-y-1">
              Confirmar Agendamento
            </button>
          </form>
        </div>

      </main>
    </div>
  );
}
