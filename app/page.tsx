'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { createClient } from '@supabase/supabase-js';
import { Calendar, Clock, User, Phone, Scissors, ShieldCheck, LogOut, Droplet, Download, X, Copy, Check, Crown, Gem, ArrowRight } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { QRCodeSVG } from 'qrcode.react';
import logoImg from './logo.jpeg';
import donoImg from './dono.jpeg';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Pix estático (InfinitePay) - sinal fixo para garantir o agendamento
const PIX_PAYLOAD = "00020101021226620014BR.GOV.BCB.PIX0114474953780001770222Pagamento pietro_augus520400005303986540510.005802BR5925PIETRO AUGUSTO DA SILVA P6015TABOAO DA SERRA62290525QRCCxNN20cBOVj3DfEd3WXpAx63045C38";
const VALOR_SINAL = "R$ 10,00";

const planos = [
  {
    nome: 'Plano Ouro',
    descricao: '4 cortes de cabelo por mês. Uso exclusivo para assinantes. Válido durante o ciclo mensal.',
    precoOriginal: 'R$ 140,00',
    preco: 'R$ 110,00',
    economia: 'R$ 30,00',
    precoPorCorte: 'R$ 27,50 por corte',
    destaque: false,
    link: 'https://invoice.infinitepay.io/plans/pietro_augusto/3zkBH7mg9P',
    icone: Crown,
  },
  {
    nome: 'Plano Diamante',
    descricao: '4 atendimentos por mês incluindo cabelo, barba e sobrancelha. Válido durante o ciclo mensal.',
    precoOriginal: 'R$ 280,00',
    preco: 'R$ 210,00',
    economia: 'R$ 70,00',
    precoPorCorte: 'R$ 52,50 por atendimento',
    destaque: true,
    link: 'https://invoice.infinitepay.io/plans/pietro_augusto/HZsHBKXlUK',
    icone: Gem,
  },
];

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
  const [isLojaFechada, setIsLojaFechada] = useState(false);
  const [mostrarModalSinal, setMostrarModalSinal] = useState(false);
  const [pixCopiado, setPixCopiado] = useState(false);

  useEffect(() => {
    const checkStatusLoja = async () => {
      const { data } = await supabase
        .from('agendamentos')
        .select('id')
        .eq('servico', 'LOJA_FECHADA')
        .limit(1);
      if (data && data.length > 0) {
        setIsLojaFechada(true);
      }
    };
    checkStatusLoja();
  }, []);

  // === SISTEMA DA BARREIRA DE INSTALAÇÃO ===
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    const isAppStandalone = window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone === true;
    setIsStandalone(isAppStandalone);

    const userAgent = window.navigator.userAgent.toLowerCase();
    const mobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);
    setIsMobile(mobile);

    const iphone = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(iphone);

    setHasChecked(true);

    if (!isAppStandalone && mobile) {
      const handleBeforeInstallPrompt = (e: any) => {
        e.preventDefault();
        setDeferredPrompt(e);
      };
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    }
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsStandalone(true);
      }
      setDeferredPrompt(null);
    } else {
      alert("Para instalar no Android, clique nos 3 pontinhos do navegador e escolha 'Instalar Aplicativo' ou 'Adicionar à Tela Inicial'.");
    }
  };
  // ==========================================

  // Atalho SÓ para "npm run dev" local: acesse http://localhost:3000/?admin_preview=1
  // para ver os botões de admin sem depender do Supabase. Em produção (npm run build/start)
  // process.env.NODE_ENV nunca é 'development', então este bloco é eliminado do bundle.
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') return;
    const params = new URLSearchParams(window.location.search);

    if (params.get('admin_preview') === '1') {
      setIsUserLoggedIn(true);
      setIsAdmin(true);
    }

    // Acesse http://localhost:3000/?debug=sinal para abrir o modal do sinal Pix
    // direto, sem precisar logar nem ter o Supabase no ar.
    if (params.get('debug') === 'sinal') {
      setMostrarModalSinal(true);
    }
  }, []);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsUserLoggedIn(true);
        if (session.user.email === 'souza.higor@gmail.com' || session.user.email === 'pietro.radical.black@gmail.com') {
          setIsAdmin(true);
        }

        // Busca o último agendamento do usuário para preencher nome e telefone
        const { data: ultimoAgendamento } = await supabase
          .from('agendamentos')
          .select('cliente_nome, cliente_telefone')
          .eq('user_id', session.user.id)
          .order('id', { ascending: false })
          .limit(1)
          .maybeSingle();

        if (ultimoAgendamento) {
          setAgendamento(prev => ({
            ...prev,
            cliente_nome: ultimoAgendamento.cliente_nome || '',
            cliente_telefone: ultimoAgendamento.cliente_telefone || ''
          }));
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
      else if (dayOfWeek === 3) { startHour = 9; endHour = 20; } 
      else if (dayOfWeek === 4) { startHour = 9; endHour = 18; } 

      const slots: string[] = [];
      for (let h = startHour; h < endHour; h++) {
        slots.push(`${h.toString().padStart(2, '0')}:00`);
      }
      setHorariosDisponiveis(slots);
      setAgendamento(prev => ({ ...prev, hora: '' })); 
    }
  }, [agendamento.data]);

  const buscarHorariosOcupados = async (data: string) => {
    const { data: agendamentos } = await supabase
      .from('agendamentos')
      .select('hora')
      .eq('data', data);
    
    if (agendamentos) {
      setHorariosOcupados(agendamentos.map(a => a.hora));
    }
  };

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

  // Assinante do plano com corte disponível no mês não paga o sinal do Pix.
  const verificarAssinaturaAtiva = async (telefone: string): Promise<boolean> => {
    const telefoneNormalizado = telefone.replace(/\D/g, '');
    if (!telefoneNormalizado) return false;

    const { data: assinante } = await supabase
      .from('assinantes')
      .select('id')
      .eq('cliente_telefone', telefoneNormalizado)
      .eq('ativo', true)
      .maybeSingle();

    if (!assinante) return false;

    const anoMesAtual = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit' }).format(new Date());
    const [ano, mes] = anoMesAtual.split('-').map(Number);
    const proximoMes = mes === 12 ? `${ano + 1}-01` : `${ano}-${String(mes + 1).padStart(2, '0')}`;

    const { data: agendamentosDoMes } = await supabase
      .from('agendamentos')
      .select('cliente_telefone')
      .gte('data', `${anoMesAtual}-01`)
      .lt('data', `${proximoMes}-01`);

    const cortesUsados = (agendamentosDoMes || []).filter(
      (ag) => ag.cliente_telefone && ag.cliente_telefone.replace(/\D/g, '') === telefoneNormalizado
    ).length;

    return cortesUsados < 4;
  };

  const iniciarAgendamento = async () => {
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
    const temCorteDoPlanoDisponivel = await verificarAssinaturaAtiva(agendamento.cliente_telefone);

    if (temCorteDoPlanoDisponivel) {
      finalizarAgendamento();
    } else {
      setLoadingAgendamento(false);
      setMostrarModalSinal(true);
    }
  };

  const confirmarComSinalPago = () => {
    setMostrarModalSinal(false);
    finalizarAgendamento();
  };

  const copiarCodigoPix = async () => {
    try {
      await navigator.clipboard.writeText(PIX_PAYLOAD);
      setPixCopiado(true);
      setTimeout(() => setPixCopiado(false), 2000);
    } catch {
      alert('Não foi possível copiar automaticamente. Selecione o código Pix manualmente.');
    }
  };

  const finalizarAgendamento = async () => {
    setLoadingAgendamento(true);

    const { data: { session } } = await supabase.auth.getSession();
    const userId = session?.user?.id;

    // Verifica se já existe um agendamento para este dia e horário antes de inserir
    const { data: checkData, error: checkError } = await supabase
      .from('agendamentos')
      .select('id')
      .eq('data', agendamento.data)
      .eq('hora', agendamento.hora);

    if (checkData && checkData.length > 0) {
      alert('Desculpe, este horário acabou de ser reservado. Por favor, escolha outro.');
      setLoadingAgendamento(false);
      buscarHorariosOcupados(agendamento.data); // Atualiza os horários ocupados
      return;
    }

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
          status: 'Pendente'
        }
      ]);

    if (!error) {
      const numeroBarbeiro = "5511953676910";
      const dataFormatada = agendamento.data.split('-').reverse().join('/');
      
      const texto = `💈 *NOVO AGENDAMENTO NO SITE!* 💈%0A%0A👤 *Cliente:* ${agendamento.cliente_nome}%0A📱 *WhatsApp:* ${agendamento.cliente_telefone}%0A✂️ *Serviço:* ${servicosFormatados}%0A📅 *Data:* ${dataFormatada}%0A⏰ *Horário:* ${agendamento.hora}%0A%0A⚠️ *Aviso:* Ciente da tolerância máxima de 10 minutos.`;
      
      window.open(`https://wa.me/${numeroBarbeiro}?text=${texto}`, '_blank');

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
    } else if (error.code === '23505') {
      // Trava definitiva contra corrida: o banco rejeitou por já existir alguém nesse horário
      alert('Desculpe, este horário acabou de ser reservado por outra pessoa. Por favor, escolha outro.');
      buscarHorariosOcupados(agendamento.data);
    } else {
      alert('Erro ao agendar: ' + error.message);
    }
    setLoadingAgendamento(false);
  };

  const toggleStatusLoja = async () => {
    if (isLojaFechada) {
      await supabase.from('agendamentos').delete().eq('servico', 'LOJA_FECHADA');
      setIsLojaFechada(false);
      alert('Barbearia ABERTA para novos agendamentos!');
    } else {
      await supabase.from('agendamentos').insert([{ 
        servico: 'LOJA_FECHADA', 
        data: '2099-12-31', 
        hora: '00:00', 
        cliente_nome: 'Sistema', 
        status: 'Fechado' 
      }]);
      setIsLojaFechada(true);
      alert('Barbearia FECHADA! Ninguém poderá agendar a partir de agora.');
    }
  };

  const handleSair = async () => {
    await supabase.auth.signOut();
    setIsUserLoggedIn(false);
    setIsAdmin(false);
  };

  // TELA DE BLOQUEIO (APARECE SE NÃO TIVER INSTALADO NO CELULAR)
  if (hasChecked && !isStandalone && isMobile) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-50 flex flex-col items-center justify-center p-8 text-center selection:bg-blue-600 selection:text-zinc-950 relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none"></div>
        
        <div className="w-32 h-32 bg-zinc-900 rounded-[2rem] p-2 mb-8 border border-blue-600/30 shadow-[0_0_50px_rgba(37,99,235,0.2)] relative z-10">
            <Image src={logoImg} alt="Logo" className="w-full h-full object-cover rounded-[1.5rem]" />
        </div>
        
        <h1 className="text-3xl md:text-4xl font-black mb-4 relative z-10">
          Obrigatório <br/> <span className="text-blue-600">Instalar o App</span>
        </h1>
        
        <p className="text-zinc-400 mb-10 max-w-sm text-lg font-medium relative z-10">
          Para agendar seu horário, é necessário instalar nosso aplicativo oficial no seu celular.
        </p>

        <div className="relative z-10 w-full max-w-sm">
          {isIOS ? (
            <div className="bg-zinc-900/80 backdrop-blur-md p-6 rounded-3xl border border-zinc-800 text-left w-full shadow-2xl">
              <div className="flex items-center justify-center gap-2 mb-6 bg-zinc-950 py-2 rounded-xl border border-zinc-800">
                <span className="text-xl">🍎</span>
                <p className="font-black text-white">Instalação no iPhone</p>
              </div>
              <ol className="text-sm text-zinc-300 space-y-5 font-medium">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-600/10 text-blue-600 flex items-center justify-center flex-shrink-0 font-bold">1</div>
                  <p>Toque no ícone de <span className="text-white font-bold bg-zinc-800 px-2 py-0.5 rounded ml-1">Compartilhar</span> <br/><span className="text-xs text-zinc-500">(O quadrado com uma seta para cima na barra inferior).</span></p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-600/10 text-blue-600 flex items-center justify-center flex-shrink-0 font-bold">2</div>
                  <p>Role para baixo e escolha <span className="text-white font-bold bg-zinc-800 px-2 py-0.5 rounded ml-1">Adicionar à Tela de Início</span>.</p>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 rounded-full bg-blue-600/10 text-blue-600 flex items-center justify-center flex-shrink-0 font-bold">3</div>
                  <p>Confirme clicando em <span className="text-white font-bold">Adicionar</span> e abra pela sua tela inicial!</p>
                </li>
              </ol>
            </div>
          ) : (
            <button 
              onClick={handleInstallClick}
              className="w-full flex items-center justify-center gap-3 bg-blue-600 text-zinc-950 px-8 py-5 rounded-2xl font-black text-lg hover:bg-blue-500 transition-all shadow-[0_0_30px_rgba(37,99,235,0.3)] hover:shadow-[0_0_50px_rgba(37,99,235,0.5)] hover:-translate-y-1"
            >
              <Download size={24} />
              Instalar Aplicativo Agora
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-blue-600 selection:text-zinc-950 relative overflow-hidden pb-20">
      
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-600/10 blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[120px] pointer-events-none"></div>

      <nav className="flex justify-between items-center p-4 md:px-12 bg-zinc-950/40 backdrop-blur-2xl sticky top-0 z-50 border-b border-white/5">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="w-[45px] h-[45px] md:w-[60px] md:h-[60px] min-w-[45px] md:min-w-[60px] flex-shrink-0 rounded-full overflow-hidden border border-blue-600/50 shadow-[0_0_20px_rgba(37,99,235,0.2)] bg-white flex items-center justify-center">
            <Image src={logoImg} alt="Logo" className="w-full h-full object-contain" />
          </div>
          <div className="flex flex-col items-center justify-center -space-y-1">
            <span className="text-base md:text-xl font-black tracking-widest text-zinc-100 drop-shadow-md leading-none">NOVO</span>
            <span className="text-[8px] md:text-[10px] font-black tracking-widest text-blue-500 drop-shadow-md leading-none">DE</span>
            <span className="text-base md:text-xl font-black tracking-widest text-zinc-100 drop-shadow-md leading-none">NOVO</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 md:gap-3">
          <a
            href="#planos"
            className="hidden sm:flex items-center px-4 py-2 text-zinc-300 hover:text-blue-600 font-bold transition-all flex-shrink-0"
          >
            Planos
          </a>
          {isAdmin && (
            <>
              <button
                onClick={toggleStatusLoja}
                className={`flex items-center justify-center gap-2 w-10 h-10 md:w-auto md:h-auto md:px-4 md:py-2 rounded-full font-bold transition-all border flex-shrink-0 ${
                  isLojaFechada 
                    ? 'bg-red-500/10 text-red-500 border-red-500/30 hover:bg-red-500 hover:text-white'
                    : 'bg-green-500/10 text-green-500 border-green-500/30 hover:bg-green-500 hover:text-white'
                }`}
                title={isLojaFechada ? 'Abrir Barbearia' : 'Fechar Barbearia'}
              >
                <span className="w-2 h-2 rounded-full bg-current animate-pulse flex-shrink-0"></span>
                <span className="text-sm hidden md:inline">{isLojaFechada ? 'Sistema Fechado' : 'Sistema Aberto'}</span>
              </button>
              <button onClick={() => router.push('/admin')} className="flex items-center justify-center gap-2 w-10 h-10 md:w-auto md:h-auto md:px-4 md:py-2 bg-blue-600/10 text-blue-600 rounded-full hover:bg-blue-600 hover:text-zinc-950 font-bold transition-all border border-blue-600/30 flex-shrink-0">
                <ShieldCheck size={18} />
                <span className="text-sm hidden md:inline">Painel do Admin</span>
              </button>
            </>
          )}

          {isUserLoggedIn ? (
            <button onClick={handleSair} className="flex items-center justify-center gap-2 w-10 h-10 md:w-auto md:h-auto md:px-4 md:py-2 bg-white/5 text-zinc-300 rounded-full hover:bg-red-500 hover:text-white transition-all font-bold flex-shrink-0">
              <LogOut size={18} />
              <span className="text-sm hidden md:inline">Sair</span>
            </button>
          ) : (
            <button onClick={() => router.push('/login')} className="flex items-center justify-center gap-2 px-5 py-2.5 md:px-6 md:py-2 bg-blue-600 text-zinc-950 rounded-full hover:bg-blue-500 font-bold transition-all shadow-[0_0_15px_rgba(37,99,235,0.3)] flex-shrink-0">
              <User size={18} className="md:hidden" />
              <User size={16} className="hidden md:block" />
              <span className="text-sm hidden md:inline">Fazer Login</span>
            </button>
          )}
        </div>
      </nav>

      <main className="relative z-10">
      <section className="max-w-7xl mx-auto px-6 md:px-12 pt-10 pb-6 relative z-10">
        <div className="w-full max-w-2xl flex flex-col gap-8 relative z-10">
          <div className="inline-block px-4 py-1.5 rounded-full border border-blue-600/30 bg-blue-600/10 text-blue-600 text-xs font-black tracking-widest w-fit shadow-[0_0_20px_rgba(37,99,235,0.1)]">
            EXCELÊNCIA EM BARBEARIA
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black leading-[1.1] tracking-tight text-white drop-shadow-sm">
            O seu estilo, <br/>
            nossa obra de arte.
          </h1>
          
          <p className="text-zinc-400 text-lg md:text-xl max-w-md leading-relaxed font-medium">
            Uma experiência que combina a tradição clássica com as tendências modernas. Agende agora e eleve o seu visual com os melhores profissionais.
          </p>

          <div className="relative h-[300px] md:h-[450px] w-full max-w-xl rounded-[2rem] overflow-hidden border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] group mt-4">
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-transparent z-10 opacity-60"></div>
            <Image src={donoImg} alt="Barbeiro" fill className="object-cover transition-transform duration-1000 group-hover:scale-110" />
            <div className="absolute bottom-6 left-6 z-20 flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-blue-600 flex items-center justify-center shadow-[0_0_20px_rgba(37,99,235,0.5)]">
                <Scissors className="text-zinc-950" />
              </div>
              <div>
                <p className="text-white font-bold text-lg leading-tight">Cortes Premium</p>
                <p className="text-zinc-300 text-sm font-semibold">Técnicas Exclusivas</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PLANOS DE MENSALIDADE */}
      <section id="planos" className="max-w-7xl mx-auto px-6 md:px-12 py-14 relative z-10 scroll-mt-24">
        <div className="text-center mb-14">
          <div className="inline-block px-4 py-1.5 rounded-full border border-blue-600/30 bg-blue-600/10 text-blue-600 text-xs font-black tracking-widest w-fit mb-5 shadow-[0_0_20px_rgba(37,99,235,0.1)]">
            ASSINATURA MENSAL
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-white">
            Planos de Mensalidade
          </h2>
          <p className="text-zinc-400 text-lg mt-4 max-w-xl mx-auto">
            Garanta seus cortes do mês por um preço fixo — sem pagar sinal a cada agendamento.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto items-stretch">
          {planos.map((plano) => {
            const Icone = plano.icone;
            return (
              <div
                key={plano.nome}
                className={`group relative rounded-[2rem] p-[1.5px] h-full transition-all duration-500 ${
                  plano.destaque
                    ? 'bg-gradient-to-b from-blue-500 via-blue-600/60 to-transparent shadow-[0_0_40px_rgba(37,99,235,0.3)]'
                    : 'bg-gradient-to-b from-blue-600/50 via-blue-600/10 to-transparent hover:from-blue-500 hover:via-blue-600/40'
                }`}
              >
                {plano.destaque && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20 bg-blue-600 text-zinc-950 text-xs font-black tracking-wider px-4 py-1.5 rounded-full shadow-[0_0_20px_rgba(37,99,235,0.5)] whitespace-nowrap">
                    MAIS ESCOLHIDO
                  </div>
                )}

                <div className="bg-zinc-950 rounded-[calc(2rem-1.5px)] p-8 h-full flex flex-col items-center text-center gap-4 relative overflow-hidden transition-transform duration-500 group-hover:-translate-y-2">

                  <div className="absolute top-[-30%] right-[-20%] w-48 h-48 bg-blue-600/20 blur-[70px] rounded-full transition-all duration-500 group-hover:bg-blue-500/30"></div>
                  <div className="absolute bottom-[-30%] left-[-20%] w-40 h-40 bg-blue-600/10 blur-[60px] rounded-full"></div>

                  <div className="relative z-10 w-20 h-20 rounded-full bg-blue-600/10 flex items-center justify-center border border-blue-600/30 shadow-[0_0_30px_rgba(37,99,235,0.25)] transition-all duration-500 group-hover:scale-110 group-hover:shadow-[0_0_45px_rgba(37,99,235,0.5)]">
                    <Icone className="text-blue-500" size={36} />
                  </div>

                  <h3 className="text-2xl font-black text-white relative z-10">{plano.nome}</h3>
                  <p className="text-zinc-400 text-sm relative z-10 max-w-[240px]">
                    {plano.descricao}
                  </p>

                  <div className="relative z-10 flex flex-col items-center mt-1">
                    <span className="text-zinc-500 line-through text-sm font-bold">{plano.precoOriginal}</span>
                    <p className="text-3xl font-black text-white leading-tight">
                      {plano.preco}
                      <span className="text-blue-500 text-sm font-bold">/mensal</span>
                    </p>
                    <p className="text-zinc-500 text-xs font-semibold mt-1">{plano.precoPorCorte}</p>
                    <span className="mt-3 bg-green-500/10 text-green-500 border border-green-500/20 px-3 py-1 rounded-lg text-xs font-black">
                      Economize {plano.economia}/mês
                    </span>
                  </div>

                  <a
                    href={plano.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative z-10 w-full flex items-center justify-center gap-2 py-3.5 mt-auto bg-blue-600 text-zinc-950 font-black rounded-xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:bg-blue-500 hover:shadow-[0_0_35px_rgba(37,99,235,0.55)] hover:-translate-y-0.5"
                  >
                    Assinar Agora
                    <ArrowRight size={18} className="transition-transform group-hover:translate-x-1" />
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* AGENDAMENTO */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 pt-6 pb-16 relative z-10">
        <div className="w-full max-w-lg mx-auto relative z-10">
          <div className="bg-zinc-900/40 backdrop-blur-3xl p-8 md:p-10 rounded-[2.5rem] border border-white/10 shadow-2xl relative overflow-hidden">

            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 blur-[50px]"></div>

            <h2 className="text-3xl font-black mb-8 flex items-center gap-3 relative z-10">
              <div className="w-2 h-8 bg-blue-600 rounded-full"></div>
              Agende seu Horário
            </h2>

            {isLojaFechada ? (
              <div className="relative z-10 bg-red-500/10 border border-red-500/30 p-8 rounded-2xl text-center flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center">
                  <span className="text-2xl">🔒</span>
                </div>
                <h3 className="text-2xl font-black text-red-500">Estamos Fechados</h3>
                <p className="text-zinc-300 font-medium">
                  Nossa agenda está temporariamente fechada para novos horários. Por favor, tente novamente mais tarde!
                </p>
              </div>
            ) : (
              <>

            <div className="mb-6 relative z-10">
              <label className="block text-sm font-bold text-zinc-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                <Scissors size={16} className="text-blue-600" /> 1. Cortes e Barba
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {servicos.filter(s => s.categoria === 'Básico').map((servico) => {
                  const isSelected = agendamento.servicosSelecionados.includes(servico.nome);
                  return (
                    <button
                      key={servico.nome}
                      onClick={() => toggleServico(servico.nome)}
                      className={`p-2 rounded-xl text-sm font-semibold border transition-all flex flex-col items-center justify-center gap-1 min-h-[64px] ${
                        isSelected
                          ? 'bg-blue-600 text-zinc-950 border-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.4)]'
                          : 'bg-zinc-900/50 text-zinc-300 border-zinc-800 hover:border-blue-600/50 hover:bg-zinc-800'
                      }`}
                    >
                      <span className="text-center w-full px-1 leading-tight">{servico.nome}</span>
                      <span className={isSelected ? 'text-zinc-800 text-[11px]' : 'text-blue-600/80 text-[11px]'}>{servico.preco}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mb-8 relative z-10">
              <label className="block text-sm font-bold text-zinc-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                <Droplet size={16} className="text-blue-600" /> 2. Químicas e Tratamentos
              </label>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                {servicos.filter(s => s.categoria === 'Químicas').map((servico) => {
                  const isSelected = agendamento.servicosSelecionados.includes(servico.nome);
                  return (
                    <button
                      key={servico.nome}
                      onClick={() => toggleServico(servico.nome)}
                      className={`p-2 rounded-xl text-sm font-semibold border transition-all flex flex-col items-center justify-center gap-1 min-h-[64px] ${
                        isSelected
                          ? 'bg-blue-600 text-zinc-950 border-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.4)]'
                          : 'bg-zinc-900/50 text-zinc-300 border-zinc-800 hover:border-blue-600/50 hover:bg-zinc-800'
                      }`}
                    >
                      <span className="text-center w-full px-1 leading-tight">{servico.nome}</span>
                      <span className={isSelected ? 'text-zinc-800 text-[11px]' : 'text-blue-600/80 text-[11px]'}>{servico.preco}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 relative z-10">
              <div>
                <label className="block text-sm font-bold text-zinc-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                  <User size={16} className="text-blue-600" /> Seu Nome
                </label>
                <input
                  type="text"
                  placeholder="Ex: João Silva"
                  value={agendamento.cliente_nome}
                  onChange={(e) => setAgendamento({ ...agendamento, cliente_nome: e.target.value })}
                  className="w-full bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl text-white outline-none focus:border-blue-600 transition-all font-medium"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-zinc-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                  <Phone size={16} className="text-blue-600" /> WhatsApp
                </label>
                <input
                  type="tel"
                  placeholder="(00) 00000-0000"
                  value={agendamento.cliente_telefone}
                  onChange={(e) => setAgendamento({ ...agendamento, cliente_telefone: e.target.value })}
                  className="w-full bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl text-white outline-none focus:border-blue-600 transition-all font-medium"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8 relative z-10">
              <div>
                <label className="block text-sm font-bold text-zinc-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                  <Calendar size={16} className="text-blue-600" /> Data
                </label>
                <input
                  type="date"
                  value={agendamento.data}
                  min={new Date().toISOString().split('T')[0]}
                  // === NOVA REGRA DE TRAVAMENTO PARA 2 MESES ===
                  max={(() => {
                    const d = new Date();
                    d.setMonth(d.getMonth() + 2);
                    return d.toISOString().split('T')[0];
                  })()}
                  onChange={(e) => setAgendamento({ ...agendamento, data: e.target.value })}
                  className="w-full bg-zinc-900/50 border border-zinc-800 p-4 rounded-xl text-white outline-none focus:border-blue-600 transition-all font-medium color-scheme-dark"
                  style={{ colorScheme: 'dark' }}
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-zinc-400 mb-3 uppercase tracking-wider flex items-center gap-2">
                  <Clock size={16} className="text-blue-600" /> Horário
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                  {agendamento.data ? (
                    horariosDisponiveis.length > 0 ? (
                      horariosDisponiveis.map((hora) => {
                        const isOcupado = horariosOcupados.includes(hora);
                        
                        const isAlmoco = hora.startsWith('13:') || hora.startsWith('14:');

                        if (isAlmoco) {
                          return (
                            <button
                              key={hora}
                              disabled
                              className="p-1 rounded-xl text-sm font-bold border transition-all bg-zinc-900/20 text-zinc-600 border-zinc-800/50 cursor-not-allowed flex flex-col items-center justify-center gap-0.5"
                            >
                              <span className="line-through">{hora}</span>
                              <span className="text-[10px] uppercase text-blue-600/50">Almoço</span>
                            </button>
                          );
                        }

                        return (
                          <button
                            key={hora}
                            disabled={isOcupado}
                            onClick={() => setAgendamento({ ...agendamento, hora })}
                            className={`p-2 rounded-xl text-sm font-bold border transition-all ${
                              isOcupado
                                ? 'bg-red-500/10 text-red-500/50 border-red-500/20 cursor-not-allowed'
                                : agendamento.hora === hora
                                ? 'bg-blue-600 text-zinc-950 border-blue-600 shadow-[0_0_15px_rgba(37,99,235,0.4)]'
                                : 'bg-zinc-900/50 text-zinc-300 border-zinc-800 hover:border-blue-600/50 hover:bg-zinc-800'
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
            
            {/* AVISO DE TOLERÂNCIA */}
            <div className="mb-6 relative z-10 bg-yellow-500/10 border border-yellow-500/30 p-4 rounded-xl flex items-start gap-3">
              <div className="mt-0.5 text-yellow-500">
                <Clock size={20} />
              </div>
              <div>
                 <p className="text-yellow-500 font-bold text-sm uppercase tracking-wider mb-1">Atenção ao Horário</p>
                <p className="text-zinc-400 text-sm font-medium">Temos uma tolerância máxima de <strong>10 minutos</strong> de atraso. Após esse período, o agendamento poderá ser cancelado.</p>
              </div>
            </div>

            <button
              onClick={iniciarAgendamento}
              disabled={loadingAgendamento || sucesso}
              className={`w-full py-5 rounded-2xl font-black text-lg transition-all relative overflow-hidden group ${
                sucesso ? 'bg-green-500 text-white shadow-[0_0_30px_rgba(34,197,94,0.4)]' : 'bg-blue-600 text-zinc-950 hover:bg-blue-500 shadow-[0_0_30px_rgba(37,99,235,0.3)] hover:shadow-[0_0_40px_rgba(37,99,235,0.5)] hover:-translate-y-1'
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
              </>
            )}
          </div>
        </div>
      </section>
      </main>

      {/* MODAL DO SINAL VIA PIX - obrigatório antes de gravar o agendamento */}
      {mostrarModalSinal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-zinc-900 border border-white/10 rounded-[2rem] p-6 md:p-8 max-w-sm w-full shadow-2xl relative">
            <button
              onClick={() => setMostrarModalSinal(false)}
              className="absolute top-4 right-4 text-zinc-500 hover:text-white transition-colors"
              aria-label="Fechar"
            >
              <X size={22} />
            </button>

            <h3 className="text-xl font-black text-white text-center mb-2 pr-6">Pague o sinal para confirmar</h3>
            <p className="text-zinc-400 text-sm text-center mb-6">
              Para garantir seu horário, é necessário pagar um sinal de <span className="text-blue-500 font-bold">{VALOR_SINAL}</span> via Pix.
            </p>

            <div className="bg-white rounded-2xl p-4 flex flex-col items-center gap-3 mb-5">
              <QRCodeSVG value={PIX_PAYLOAD} size={200} bgColor="#ffffff" fgColor="#09090b" />
              <p className="text-zinc-900 font-bold text-sm text-center leading-tight">PIETRO AUGUSTO DA SILVA PIRES</p>
              <p className="text-zinc-500 text-xs">Pix • {VALOR_SINAL}</p>
            </div>

            <button
              onClick={copiarCodigoPix}
              className="w-full flex items-center justify-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 py-3 rounded-xl font-bold text-sm mb-5 transition-all"
            >
              {pixCopiado ? <Check size={18} className="text-green-500" /> : <Copy size={18} />}
              {pixCopiado ? 'Código copiado!' : 'Copiar código Pix'}
            </button>

            <button
              onClick={confirmarComSinalPago}
              disabled={loadingAgendamento}
              className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-zinc-950 font-black rounded-xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] disabled:opacity-50 mb-3"
            >
              {loadingAgendamento ? 'Salvando...' : 'Já paguei, confirmar agendamento'}
            </button>

            <button
              onClick={() => setMostrarModalSinal(false)}
              className="w-full py-2 text-zinc-500 hover:text-zinc-300 text-sm font-medium transition-all"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* HISTÓRIA SECTION */}
      <section className="max-w-7xl mx-auto px-6 md:px-12 py-20 relative z-10">
        <div className="flex flex-col md:flex-row gap-12 items-center">
          <div className="w-full md:w-1/2 flex flex-col gap-6">
            <h2 className="text-4xl md:text-5xl font-black text-white flex items-center gap-4">
              <span className="w-12 h-2 bg-blue-600 rounded-full inline-block"></span>
              Mais que um corte de cabelo.
            </h2>
            <p className="text-zinc-400 text-lg leading-relaxed">
              Desde 2018, a Barbearia Novo de Novo vem ajudando homens a renovarem sua autoestima, estilo e confiança.
            </p>
            <p className="text-zinc-400 text-lg leading-relaxed">
              Com atendimento personalizado e horário marcado, oferecemos uma experiência tranquila, profissional e pensada para valorizar o seu tempo.
            </p>
            <p className="text-blue-500 font-bold text-xl mt-4">
              Agende seu horário e saia Novo de Novo.
            </p>
          </div>

          <div className="w-full md:w-1/2 bg-zinc-900/40 backdrop-blur-3xl p-8 md:p-10 rounded-[2.5rem] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative">
            <div className="absolute top-[-20px] right-[-20px] w-24 h-24 bg-blue-600/20 blur-[30px] rounded-full"></div>
            <p className="text-zinc-300 text-lg leading-relaxed mb-6 font-medium italic">
              "A Barbearia Novo de Novo nasceu da paixão pela profissão e do compromisso com cada cliente."
            </p>
            <p className="text-zinc-400 text-md leading-relaxed mb-6">
              Localizada no Jardim Clementino, atendemos desde 2018 com foco em qualidade, respeito e atenção aos detalhes.
            </p>
            <p className="text-zinc-400 text-md leading-relaxed">
              Aqui, cada atendimento é realizado com horário marcado, proporcionando mais conforto, organização e dedicação para que você tenha a melhor experiência possível.
            </p>
          </div>
        </div>
      </section>

      <style dangerouslySetInnerHTML={{__html: `
        .custom-scrollbar::-webkit-scrollbar { width: 6px; height: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: rgba(255,255,255,0.02); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(37,99,235,0.2); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(37,99,235,0.5); }
      `}} />
    </div>
  );
}
