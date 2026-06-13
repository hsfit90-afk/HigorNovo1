'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { Calendar, Clock, Scissors, User, LogOut, ChevronDown, CheckCircle2, ShieldCheck } from 'lucide-react';
import logoImg from './logo.jpeg';
import donoImg from './dono.jpeg';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const HORARIOS_PADRAO = ['09:00', '10:00', '11:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00'];

export default function Home() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);

  const [servico, setServico] = useState('');
  const [profissional, setProfissional] = useState('Qualquer profissional');
  const [data, setData] = useState('');
  const [hora, setHora] = useState('');
  
  const [horariosOcupados, setHorariosOcupados] = useState<string[]>([]);
  const [loadingAgendamento, setLoadingAgendamento] = useState(false);
  const [mensagem, setMensagem] = useState('');

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
      } else {
        setSession(session);
        setLoading(false);
      }
    };
    checkUser();
  }, [router]);

  useEffect(() => {
    const buscarHorarios = async () => {
      if (!data) return; 
      
      const { data: agendamentos, error } = await supabase
        .from('agendamentos')
        .select('hora')
        .eq('data', data)
        .eq('status', 'Confirmado');
      
      if (!error && agendamentos) {
        setHorariosOcupados(agendamentos.map(a => a.hora));
      }
    };
    
    buscarHorarios();
    setHora(''); 
  }, [data]); 

  const handleSair = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleAgendar = async () => {
    if (!servico || !data || !hora) {
      setMensagem('Por favor, escolha o serviço, a data e a hora!');
      return;
    }

    setLoadingAgendamento(true);
    setMensagem('');

    const { error } = await supabase.from('agendamentos').insert({
      user_id: session?.user?.id,
      cliente_nome: session?.user?.email, 
      servico,
      profissional,
      data,
      hora,
      status: 'Confirmado'
    });

    if (error) {
      setMensagem('Erro ao agendar. Tente novamente.');
    } else {
      setMensagem('Sucesso! Redirecionando para o WhatsApp...');
      setHorariosOcupados([...horariosOcupados, hora]);
      
      const partesData = data.split('-');
      const dataBr = `${partesData[2]}/${partesData[1]}/${partesData[0]}`; 
      
      const texto = `Olá! Acabei de agendar pelo aplicativo:%0A%0A✂️ *Serviço:* ${servico}%0A👤 *Profissional:* ${profissional}%0A📅 *Data:* ${dataBr}%0A⏰ *Horário:* ${hora}%0A%0ATe aguardo!`;
      
      const numeroBarbeiro = '5511947349200';
      
      window.open(`https://wa.me/${numeroBarbeiro}?text=${texto}`, '_blank');
      
      setHora(''); 
    }
    setLoadingAgendamento(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-amber-500 font-bold tracking-widest uppercase">Carregando...</p>
      </div>
    );
  }

  const horariosLivres = HORARIOS_PADRAO.filter(h => !horariosOcupados.includes(h));

  // LIBERA O BOTÃO DO ADMIN SE O EMAIL FOR O DO HIGOR
  const isAdmin = session?.user?.email === 'souza.higor@gmail.com';

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-amber-500 selection:text-zinc-950 relative overflow-hidden">
      
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-amber-600/20 blur-[120px] rounded-full pointer-events-none mix-blend-screen"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-amber-600/10 blur-[120px] rounded-full pointer-events-none mix-blend-screen"></div>

      <nav className="flex justify-between items-center p-6 md:px-12 bg-zinc-950/40 backdrop-blur-2xl sticky top-0 z-50 border-b border-white/5">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full overflow-hidden border border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.2)]">
            <Image src={logoImg} alt="Logo" className="w-full h-full object-cover" />
          </div>
          <span className="text-xl font-black tracking-widest text-zinc-100 drop-shadow-md">NOVO DE NOVO</span>
        </div>
        
        <div className="flex items-center gap-3">
          {/* BOTÃO VIP DO HIGOR (OS CLIENTES NÃO VÃO VER) */}
          {isAdmin && (
            <button 
              onClick={() => router.push('/admin')} 
              className="hidden md:flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-500 px-6 py-2.5 rounded-full font-bold hover:bg-amber-500 hover:text-zinc-950 transition-all duration-300 backdrop-blur-md"
            >
              <ShieldCheck size={16} />
              <span className="text-sm">Painel do Admin</span>
            </button>
          )}

          <button onClick={handleSair} className="flex items-center gap-2 bg-white/5 border border-white/10 text-zinc-300 px-6 py-2.5 rounded-full font-bold hover:bg-white/10 hover:text-white transition-all duration-300 backdrop-blur-md">
            <LogOut size={16} />
            <span className="text-sm">Sair</span>
          </button>
        </div>
      </nav>

      <main className="flex flex-col lg:flex-row items-center justify-between p-6 md:p-12 gap-16 max-w-7xl mx-auto mt-4 relative z-10">
        
        <div className="flex-1 space-y-10">
          <div className="space-y-4">
            <div className="inline-block px-4 py-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 text-amber-500 text-xs font-bold tracking-widest uppercase mb-2 shadow-[0_0_15px_rgba(245,158,11,0.2)]">
              Excelência em Barbearia
            </div>
            <h1 className="text-5xl md:text-7xl font-black leading-[1.1] tracking-tight">
              O seu estilo, <br />
              <span className="text-amber-500 drop-shadow-[0_0_30px_rgba(245,158,11,0.3)]">nossa obra de arte.</span>
            </h1>
            <p className="text-lg text-zinc-400 max-w-md leading-relaxed font-light">
              Uma experiência que combina a tradição clássica com as tendências modernas. Agende agora e eleve o seu visual com os melhores profissionais.
            </p>
          </div>

          <div className="relative h-[300px] md:h-[450px] w-full max-w-xl rounded-[2rem] overflow-hidden border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] group">
            <Image src={donoImg} alt="Barbeiro" fill className="object-cover transition-transform duration-1000 group-hover:scale-110" />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/20 to-transparent opacity-80"></div>
            <div className="absolute bottom-6 left-6 flex gap-3">
              <div className="bg-zinc-950/60 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 flex items-center gap-2 shadow-xl">
                <Scissors size={16} className="text-amber-500" />
                <span className="text-sm font-bold text-zinc-100">Cortes Premium</span>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full max-w-md bg-zinc-900/40 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-8 md:p-10 shadow-[0_0_50px_rgba(0,0,0,0.4)] relative">
          <div className="absolute -inset-0.5 bg-gradient-to-br from-amber-500/20 to-transparent rounded-[2.5rem] blur-xl opacity-50 -z-10"></div>

          <h2 className="text-2xl font-bold mb-8 flex items-center gap-3">
            <div className="w-1.5 h-8 bg-amber-500 rounded-full shadow-[0_0_10px_rgba(245,158,11,0.5)]"></div>
            Agende seu Horário
          </h2>

          <div className="space-y-7">
            
            <div className="space-y-4">
              <label className="text-xs font-bold text-zinc-400 tracking-widest uppercase flex items-center gap-2">
                <Scissors size={14} className="text-amber-500" /> 1. Serviço
              </label>
              <div className="grid grid-cols-2 gap-3">
                {['Corte Social', 'Barba', 'Corte + Barba', 'Sobrancelha'].map((op) => (
                  <button 
                    key={op}
                    onClick={() => setServico(op)}
                    className={`p-3.5 rounded-2xl border text-sm font-semibold text-center transition-all duration-300 ${
                      servico === op 
                      ? 'border-amber-500 bg-amber-500/10 text-amber-500' 
                      : 'border-white/5 bg-black/30 text-zinc-400 hover:border-white/20'
                    }`}
                  >
                    {op}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-4">
                <label className="text-xs font-bold text-zinc-400 tracking-widest uppercase flex items-center gap-2">
                  <User size={14} className="text-amber-500" /> Profissional
                </label>
                <div className="relative">
                  <select 
                    value={profissional}
                    onChange={(e) => setProfissional(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-zinc-100 focus:outline-none focus:border-amber-500/50 appearance-none transition-colors cursor-pointer text-sm"
                  >
                    <option className="bg-zinc-900 text-zinc-100">Qualquer um</option>
                    <option className="bg-zinc-900 text-zinc-100">Higor</option>
                  </select>
                  <ChevronDown size={18} className="absolute right-4 top-1/2 -translate-y-1/2 text-zinc-500 pointer-events-none" />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-xs font-bold text-zinc-400 tracking-widest uppercase flex items-center gap-2">
                  <Calendar size={14} className="text-amber-500" /> Data
                </label>
                <input 
                  type="date" 
                  value={data}
                  onChange={(e) => setData(e.target.value)}
                  min={new Date().toISOString().split('T')[0]} 
                  className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-zinc-100 focus:outline-none focus:border-amber-500/50 transition-colors [color-scheme:dark] text-sm" 
                />
              </div>
            </div>

            {data && (
              <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <label className="text-xs font-bold text-zinc-400 tracking-widest uppercase flex items-center gap-2">
                  <Clock size={14} className="text-amber-500" /> Horários Disponíveis
                </label>
                
                {horariosLivres.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2">
                    {horariosLivres.map((h) => (
                      <button 
                        key={h}
                        onClick={() => setHora(h)}
                        className={`py-2 rounded-xl border text-sm font-bold transition-all ${
                          hora === h 
                          ? 'bg-amber-500 text-zinc-950 border-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.3)]' 
                          : 'bg-black/30 text-zinc-300 border-white/5 hover:border-white/20 hover:bg-white/5'
                        }`}
                      >
                        {h}
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center font-semibold">
                    Esgotado para este dia!
                  </div>
                )}
              </div>
            )}

            {mensagem && (
              <div className={`p-4 rounded-xl text-sm font-semibold flex items-center justify-center gap-2 ${
                mensagem.includes('Sucesso') 
                ? 'bg-green-500/10 text-green-500 border border-green-500/20' 
                : 'bg-red-500/10 text-red-500 border border-red-500/20'
              }`}>
                {mensagem.includes('Sucesso') && <CheckCircle2 size={18} />}
                {mensagem}
              </div>
            )}

            <button 
              onClick={handleAgendar}
              disabled={loadingAgendamento || !data || !hora || !servico}
              className="w-full relative overflow-hidden group bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950 font-black text-lg py-5 rounded-2xl mt-6 transition-all duration-300 shadow-[0_0_30px_rgba(245,158,11,0.2)] hover:shadow-[0_0_40px_rgba(245,158,11,0.4)] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="absolute inset-0 w-full h-full bg-white/20 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] skew-x-12"></div>
              <span className="relative z-10 flex items-center justify-center gap-2">
                {loadingAgendamento ? 'Salvando...' : 'Confirmar Agendamento'}
              </span>
            </button>
          </div>
        </div>
      </main>
      
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes shimmer { 100% { transform: translateX(200%); } }
      `}} />
    </div>
  );
}
