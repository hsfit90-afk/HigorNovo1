'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { createClient } from '@supabase/supabase-js';
import { Calendar, Clock, User, Phone, Scissors, ShieldCheck, LogOut, Droplet } from 'lucide-react';
import { useRouter } from 'next/navigation';
import logoImg from './logo.jpeg';
import donoImg from './dono.jpeg';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// SEUS SERVIÇOS
const servicos = [
  { nome: 'Pezinho', preco: 'R$ 15', categoria: 'Básico' },
  { nome: 'Sobrancelha', preco: 'R$ 10', categoria: 'Básico' },
  { nome: 'Bigode', preco: 'R$ 10', categoria: 'Básico' },
  { nome: 'Sobrancelha e Bigode', preco: 'R$ 15', categoria: 'Básico' },
  { nome: 'Barba', preco: 'R$ 25', categoria: 'Básico' },
  { nome: 'Cabelo', preco: 'R$ 35', categoria: 'Básico' },
  { nome: 'Cabelo e Barba', preco: 'R$ 50', categoria: 'Básico' },
  { nome: 'Platinado', preco: 'R$ 100', categoria: 'Químicas' },
  { nome: 'Luzes', preco: 'R$ 70', categoria: 'Químicas' },
  { nome: 'Alisante', preco: 'R$ 40', categoria: 'Químicas' },
  { nome: 'Hidratação', preco: 'R$ 30', categoria: 'Químicas' },
  { nome: 'Pigmentação', preco: 'R$ 20', categoria: 'Químicas' },
];

export default function Home() {
  const router = useRouter();
  const [isUserLoggedIn, setIsUserLoggedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  
  const [agendamento, setAgendamento] = useState({
    servicosSelecionados: [] as string[],
    data: '',
    hora: '',
    cliente_nome: '',
    cliente_telefone: ''
  });
  
  const [horariosOcupados, setHorariosOcupados] = useState<string[]>([]);
  const [horariosDisponiveis, setHorariosDisponiveis] = useState<string[]>([]);
  const [loadingAgendamento, setLoadingAgendamento] = useState(false);
  const [sucesso, setSucesso] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsUserLoggedIn(true);
        if (session.user.email === 'souza.higor@gmail.com') {
          setIsAdmin(true);
        }
      }
    };
    checkSession();
  }, []);

  useEffect(() => {
    if (agendamento.data) {
      buscarHorariosOcupados(agendamento.data);
      
      const [ano, mes, dia] = agendamento.data.split('-');
      const date = new Date(Number(ano), Number(mes) - 1, Number(dia));
      const dayOfWeek = date.getDay(); 

      if (dayOfWeek === 0) {
        setHorariosDisponiveis([]); 
        return;
      }

      let startHour = 9;
      let endHour = 21;

      if (dayOfWeek === 1) { startHour = 15; endHour = 21; } 
      else if (dayOfWeek === 3) { startHour = 9; endHour = 19; } 
      else if (dayOfWeek === 4) { startHour = 9; endHour = 18; } 

      const slots: string[] = [];
      for (let h = startHour; h < endHour; h++) {
        if (h === 13 || h === 14) continue; 
        slots.push(`${h.toString().padStart(2, '0')}:00`);
        slots.push(`${h.toString().padStart(2, '0')}:30`);
      }
      setHorariosDisponiveis(slots);
      setAgendamento(prev => ({ ...prev, hora: '' })); 
    }
  }, [agendamento.data]);

  const buscarHorariosOcupados = async (data: string) => {
    const { data: agendamentos } = await supabase
      .from('agendamentos')
      .select('hora')
      .eq('data', data)
      .eq('status', 'Confirmado');
    
    if (agendamentos) {
      setHorariosOcupados(agendamentos.map(a => a.hora));
    }
  };

  // FUNÇÃO QUE PERMITE MARCAR E DESMARCAR VÁRIOS SERVIÇOS
  const toggleServico = (nome: string) => {
    setAgendamento(prev => {
      const jaSelecionado = prev.servicosSelecionados.includes(nome);
      if (jaSelecionado) {
        return { ...prev, servicosSelecionados: prev.servicosSelecionados.filter(s => s !== nome) };
      } else {
        return { ...prev, servicosSelecionados: [...prev.servicosSelecionados, nome] };
      }
    });
  };

  const handleAgendar = async () => {
    if (!isUserLoggedIn) {
      alert("Por favor, faça login ou cadastre-se para agendar seu horário.");
      router.push('/login');
      return;
    }

    if (agendamento.servicosSelecionados.length === 0 || !agendamento.data || !agendamento.hora || !agendamento.cliente_nome || !agendamento.cliente_telefone) {
      alert('Por favor, preencha todos os campos e escolha pelo menos um serviço!');
      return;
    }

    setLoadingAgendamento(true);

    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    // JUNTA OS MÚLTIPLOS SERVIÇOS COM UM "+"
    const servicosFormatados = agendamento.servicosSelecionados.join(' + ');

    const { error } = await supabase
      .from('agendamentos')
      .insert([
        { 
          user_id: userId,
          servico: servicosFormatados, 
          data: agendamento.data, 
          hora: agendamento.hora,
          cliente_nome: agendamento.cliente_nome,
          cliente_telefone: agendamento.cliente_telefone,
          status: 'Confirmado'
        }
      ]);

    if (!error) {
      setSucesso(true);
      setTimeout(() => {
        setSucesso(false);
        setAgendamento({
          servicosSelecionados: [],
          data: '',
          hora: '',
          cliente_nome: '',
          cliente_telefone: ''
        });
        buscarHorariosOcupados(agendamento.data);
      }, 3000);
    } else {
      alert('Erro ao agendar: ' + error.message);
    }
    setLoadingAgendamento(false);
  };

  const handleSair = async () => {
    await supabase.auth.signOut();
    setIsUserLoggedIn(false);
    setIsAdmin(false);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-amber-500 selection:text-zinc-950 relative overflow-hidden">
      
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-amber-500/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none"></div>

      <nav className="flex justify-between items-center p-6 md:px-12 bg-zinc-950/40 backdrop-blur-2xl sticky top-0 z-50 border-b border-white/5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full overflow-hidden border border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.2)] bg-white">
            <Image src={logoImg} alt="Logo" className="w-full h-full object-contain" />
          </div>
          <span className="text-xl font-black tracking-widest text-zinc-100 drop-shadow-md">NOVO DE NOVO</span>
        </div>
        
        <div className="flex items-center gap-3">
          {isAdmin && (
            <button onClick={() => router.push('/admin')} className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 text-amber-500 rounded-full hover:bg-amber-500 hover:text-zinc-950 font-bold transition-all border border-amber-500/30">
              <ShieldCheck size={16} />
              <span className="text-sm hidden sm:inline">Painel do Admin</span>
            </button>
          )}

          {isUserLoggedIn ? (
            <button onClick={handleSair} className="flex items-center gap-2 px-4 py-2 bg-white/5 text-zinc-300 rounded-full hover:bg-red-500 hover:text-white transition-all font-bold">
              <LogOut size={16} />
              <span className="text-sm hidden sm:inline">Sair</span>
            </button>
          ) : (
            <button onClick={() => router.push('/login')} className="flex items-center gap-2 px-6 py-2 bg-amber-500 text-zinc-950 rounded-full hover:bg-amber-400 font-bold transition-all shadow-[0_0_15px_rgba(245,158,11,0.3)]">
              <User size={16} />
              <span className="text-sm">Fazer Login</span>
            </button>
          )}
        </div>
      </nav>

      <main className="flex flex-col xl:flex-row items-center justify-center p-6 md:p-12 gap-12 max-w-7xl mx-auto min-h-[calc(100vh-100px)]">
        
        <div className="w-full xl:w-1/2 flex flex-col gap-8 relative z-10">
          <div className="inline-block px-4 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-500 text-xs font-black tracking-widest w-fit shadow-[0_0_20px_rgba(245,158,11,0.1)]">
            EXCELÊNCIA EM BARBEARIA
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black leading-[1.1] tracking-tight">
            O seu estilo, <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-amber-300 drop-shadow-sm">
              nossa obra de arte.
            </span>
          </h1>
          
          <p className="text-zinc-400 text-lg md:text-xl max-w-md leading-relaxed font-medium">
            Uma experiência que combina a tradição clássica com as tendências modernas. Agende agora e eleve o seu visual com os melhores profissionais.
          </p>

          <div className="relative h-[300px] md:h-[450px] w-full max-w-xl rounded-[2rem] overflow-hidden border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] group mt-4">
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent z-10 opacity-60"></div>
            <Image src={donoImg} alt="Barbeiro" fill className="object-cover transition-transform duration-1000 group-hover:scale-110" />
            <div className="absolute bottom-6 left-6 z-20 flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-amber-500 flex items-center justify-center shadow-[0_0_20px_rgba(245,158,11,0.5)]">
                <Scissors className="text-zinc-950" />
              </div>
              <div>
                <p className="text-white font-bold text-lg leading-tight">Cortes Premium</p>
                <p className="text-amber-500 text-sm font-semibold">Técnicas Exclusivas</p>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full xl:w-1/2 max-w-lg relative z-10">
          <div className="bg-zinc-900/40 backdrop-blur-3xl p-8 md:p-10 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden">
            
            <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-[50px]"></div>

            <h2 className="text-3xl font-black mb-8 flex items-center gap-3 relative z-10">
              <div className="w-2 h-8 bg-amber-500 rounded-full"></div>
              Agende seu Horário
            </h2>

            <div className="mb-6 relative z-10">
              <label className="block text-sm font-bold text-zinc-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                <Scissors size={16} className="text-amber-500" /> 1. Cortes e Barba
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {servicos.filter(s => s.categoria === 'Básico').map((servico) => {
                  const isSelected = agendamento.servicosSelecionados.includes(servico.nome);
                  return (
                    <button
                      key={servico.nome}
                      onClick={() => toggleServico(servico.nome)}
                      className={`p-2 rounded-xl text-sm font-semibold border transition-all flex flex-col items-center justify-center gap-1 ${
                        isSelected
                          ? 'bg-amber-500 text-zinc-950 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                          : 'bg-zinc-900/50 text-zinc-300 border-zinc-800 hover:border-amber-500/50 hover:bg-zinc-800'
                      }`}
                    >
                      <span className="text-center truncate w-full px-1">{servico.nome}</span>
                      <span className={isSelected ? 'text-zinc-800 text-[11px]' : 'text-amber-500/80 text-[11px]'}>{servico.preco}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mb-8 relative z-10">
              <label className="block text-sm font-bold text-zinc-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                <Droplet size={16} className="text-amber-500" /> 2. Químicas e Tratamentos
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {servicos.filter(s => s.categoria === 'Químicas').map((servico) => {
                  const isSelected = agendamento.servicosSelecionados.includes(servico.nome);
                  return (
                    <button
                      key={servico.nome}
                      onClick={() => toggleServico(servico.nome)}
                      className={`p-2 rounded-xl text-sm font-semibold border transition-all flex flex-col items-center justify-center gap-1 ${
                        isSelected
                          ? 'bg-amber-500 text-zinc-950 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                          : 'bg-zinc-900/50 text-zinc-300 border-zinc-800 hover:border-amber-500/50 hover:bg-zinc-800'
                      }`}
                    >
                      <span className="text-center truncate w-full px-1">{servico.nome}</span>
                      <span className={isSelected ? 'text-zinc-800 text-[11px]' : 'text-amber-500/80 text-[11px]'}>{servico.preco}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 relative z-10">
              <div>
                <label className="block text-sm font-bold text-zinc-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                  <User size={16} className="text-amber-500" /> Seu Nome
                </label>
                <input
                  type="text"
                  placeholder="Ex: João Silva"
                  value={agendamento.cliente_nome}
                  onChange={(e) => setAgendamento({ ...agendamento, cliente_nome: e.target.value })}
                  className="w-full bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl text-white outline-none focus:border-amber-500 transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-zinc-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                  <Phone size={16} className="text-amber-500" /> WhatsApp
                </label>
                <input
                  type="tel"
                  placeholder="(00) 00000-0000"
                  value={agendamento.cliente_telefone}
                  onChange={(e) => setAgendamento({ ...agendamento, cliente_telefone: e.target.value })}
                  className="w-full bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl text-white outline-none focus:border-amber-500 transition-all font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 relative z-10">
              <div>
                <label className="block text-sm font-bold text-zinc-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                  <Calendar size={16} className="text-amber-500" /> Data
                </label>
                <input
                  type="date"
                  value={agendamento.data}
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setAgendamento({ ...agendamento, data: e.target.value })}
                  className="w-full bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl text-white outline-none focus:border-amber-500 transition-all font-medium color-scheme-dark"
                  style={{ colorScheme: 'dark' }}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-zinc-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                  <Clock size={16} className="text-amber-500" /> Horário
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                  {agendamento.data ? (
                    horariosDisponiveis.length > 0 ? (
                      horariosDisponiveis.map((hora) => {
                        const isOcupado = horariosOcupados.includes(hora);
                        return (
                          <button
                            key={hora}
                            disabled={isOcupado}
                            onClick={() => setAgendamento({ ...agendamento, hora })}
                            className={`p-2 rounded-xl text-sm font-bold border transition-all ${
                              isOcupado
                                ? 'bg-red-500/10 text-red-500/50 border-red-500/20 cursor-not-allowed'
                                : agendamento.hora === hora
                                ? 'bg-amber-500 text-zinc-950 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.4)]'
                                : 'bg-zinc-900/50 text-zinc-300 border-zinc-800 hover:border-amber-500/50 hover:bg-zinc-800'
                            }`}
                          >
                            {hora}
                          </button>
                        );
                      })
                    ) : (
                      <div className="col-span-2 text-center py-4 text-zinc-500 text-sm font-bold bg-zinc-900/30 rounded-xl border border-zinc-800">
                        Fechado neste dia.
                      </div>
                    )
                  ) : (
                    <div className="col-span-2 text-center py-4 text-zinc-500 text-sm bg-zinc-900/30 rounded-xl border border-zinc-800 flex items-center justify-center">
                      Escolha uma data
                    </div>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={handleAgendar}
              disabled={loadingAgendamento || sucesso}
              className={`w-full py-5 rounded-2xl font-black text-lg transition-all relative overflow-hidden group ${
                sucesso ? 'bg-green-500 text-white shadow-[0_0_30px_rgba(34,197,94,0.4)]' : 'bg-amber-500 text-zinc-950 hover:bg-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.3)] hover:shadow-[0_0_40px_rgba(245,158,11,0.5)] hover:-translate-y-1'
              }`}
            >
              {sucesso ? (
                <span className="flex items-center justify-center gap-2">
                  <ShieldCheck size={24} /> Agendado com Sucesso!
                </span>
              ) : (
                <span className="flex items-center justify-center gap-2">
                  {loadingAgendamento ? 'Salvando...' : 'Confirmar Agendamento'}
                </span>
              )}
            </button>
          </div>
        </div>
      </main>
      
      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(245,158,11,0.2); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(245,158,11,0.5); }
      `}} />
    </div>
  );
}
