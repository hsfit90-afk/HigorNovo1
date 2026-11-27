'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Calendar, Clock, Scissors, Loader2, AlertTriangle, ArrowLeft, X, CalendarCheck, CheckCircle2, Phone } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { STATUS_QUE_NAO_OCUPAM } from '../../lib/pagamento';
import { ehMadrugada, diaSeguinteFormatado, hojeEmSaoPaulo } from '../../lib/horarios';
import { abrirWhatsAppNoCelular, montarLinkWhatsApp } from '../../lib/whatsapp';

type Agendamento = {
  // uuid: a chave da tabela agendamentos é uuid, não número.
  id: string;
  servico: string;
  data: string;
  hora: string;
  status: string;
};

type Estado = 'carregando' | 'pronto' | 'erro';

// 'YYYY-MM-DD' -> 'DD/MM/AAAA'
function formatarData(data: string): string {
  return data.split('-').reverse().join('/');
}

export default function MeusAgendamentos() {
  const router = useRouter();
  const [estado, setEstado] = useState<Estado>('carregando');
  const [agendamentos, setAgendamentos] = useState<Agendamento[]>([]);
  const [cancelandoId, setCancelandoId] = useState<string | null>(null);
  const [erro, setErro] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  // Texto do aviso de cancelamento, mantido na tela como botão de reserva
  // caso a abertura automática do WhatsApp não funcione no aparelho.
  const [avisoWhatsApp, setAvisoWhatsApp] = useState<string | null>(null);

  useEffect(() => {
    setIsMobile(/Android|iPhone|iPad|iPod/i.test(navigator.userAgent));
  }, []);

  const carregar = useCallback(async () => {
    setEstado('carregando');
    setErro('');

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      router.push('/login');
      return;
    }

    // O RLS já limita a leitura aos agendamentos do próprio cliente
    // (ver supabase/protecao_dados.sql). O filtro por user_id aqui é só
    // para não trazer linha à toa, não é a trava de segurança.
    const { data, error } = await supabase
      .from('agendamentos')
      .select('id, servico, data, hora, status')
      .eq('user_id', session.user.id)
      .gte('data', hojeEmSaoPaulo())
      .order('data', { ascending: true })
      .order('hora', { ascending: true });

    if (error) {
      setErro('Não foi possível carregar seus agendamentos. Tente de novo.');
      setEstado('erro');
      return;
    }

    // Reserva de checkout aberto e pagamento sem horário não são
    // agendamento de verdade, então não entram na lista.
    setAgendamentos((data || []).filter(a => !STATUS_QUE_NAO_OCUPAM.includes(a.status)));
    setEstado('pronto');
  }, [router]);

  useEffect(() => {
    carregar();
  }, [carregar]);

  const avisarBarbeiro = (ag: Agendamento) => {
    const texto =
      `❌ *AGENDAMENTO CANCELADO PELO CLIENTE* ❌\n\n` +
      `✂️ *Serviço:* ${ag.servico}\n` +
      `📅 *Data:* ${formatarData(ag.data)}\n` +
      `⏰ *Horário:* ${ag.hora}${ehMadrugada(ag.hora) ? ` (madrugada de ${diaSeguinteFormatado(ag.data)})` : ''}\n\n` +
      `O horário já foi liberado na agenda.`;

    // Fica na tela como botão de reserva: a abertura automática falha em
    // parte dos aparelhos, e falha em silêncio (ver lib/whatsapp.ts).
    setAvisoWhatsApp(texto);

    if (isMobile) {
      abrirWhatsAppNoCelular(texto);
    } else {
      window.open(montarLinkWhatsApp(texto), '_blank');
    }
  };

  const cancelar = async (ag: Agendamento) => {
    const confirmou = window.confirm(
      `Cancelar o agendamento de ${ag.servico} em ${formatarData(ag.data)} às ${ag.hora}?\n\n` +
      `O horário será liberado para outra pessoa.`
    );
    if (!confirmou) return;

    setCancelandoId(ag.id);
    setErro('');

    // Quem apaga é a função do banco, que confere se o agendamento é mesmo
    // deste cliente (ver supabase/cancelamento_pelo_cliente.sql). O cliente
    // não tem permissão de apagar a linha direto.
    const { error } = await supabase.rpc('cancelar_meu_agendamento', { p_id: ag.id });

    if (error) {
      setErro(error.message || 'Não foi possível cancelar. Tente de novo.');
      setCancelandoId(null);
      return;
    }

    setAgendamentos(prev => prev.filter(a => a.id !== ag.id));
    setCancelandoId(null);
    avisarBarbeiro(ag);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 selection:bg-blue-600 selection:text-zinc-950">
      <nav className="flex items-center gap-3 p-4 md:px-12 bg-zinc-950/40 backdrop-blur-2xl sticky top-0 z-50 border-b border-white/5">
        <Link
          href="/"
          className="flex items-center justify-center w-10 h-10 rounded-full bg-white/5 text-zinc-300 hover:bg-blue-600 hover:text-zinc-950 transition-all flex-shrink-0"
          aria-label="Voltar para a página inicial"
        >
          <ArrowLeft size={18} />
        </Link>
        <h1 className="text-lg md:text-xl font-black tracking-tight flex items-center gap-2">
          <CalendarCheck size={20} className="text-blue-600" />
          Meus agendamentos
        </h1>
      </nav>

      <main className="max-w-2xl mx-auto px-6 py-10">
        {erro && (
          <div
            role="alert"
            className="mb-6 flex items-start gap-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-4 text-sm font-medium"
          >
            <AlertTriangle size={18} className="flex-shrink-0 mt-0.5" />
            <span>{erro}</span>
          </div>
        )}

        {estado === 'carregando' && (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-400 gap-3">
            <Loader2 size={32} className="animate-spin text-blue-600" />
            <p className="font-bold">Carregando seus agendamentos...</p>
          </div>
        )}

        {estado === 'erro' && (
          <div className="text-center py-16">
            <button
              onClick={carregar}
              className="px-6 py-3 bg-blue-600 text-zinc-950 rounded-full font-bold hover:bg-blue-500 transition-all"
            >
              Tentar de novo
            </button>
          </div>
        )}

        {estado === 'pronto' && agendamentos.length === 0 && (
          <div className="text-center py-16 px-6 bg-zinc-900/30 border border-zinc-800 rounded-[2rem]">
            <Calendar size={40} className="mx-auto text-zinc-700 mb-4" />
            <p className="text-zinc-300 font-bold mb-2">Você não tem agendamentos marcados.</p>
            <p className="text-zinc-500 text-sm mb-6">Que tal marcar o próximo corte?</p>
            <Link
              href="/"
              className="inline-flex px-6 py-3 bg-blue-600 text-zinc-950 rounded-full font-bold hover:bg-blue-500 transition-all"
            >
              Agendar horário
            </Link>
          </div>
        )}

        {estado === 'pronto' && agendamentos.length > 0 && (
          <ul className="flex flex-col gap-4">
            {agendamentos.map(ag => (
              <li
                key={ag.id}
                className="bg-zinc-900/50 border border-zinc-800 rounded-[1.5rem] p-5 flex flex-col sm:flex-row sm:items-center gap-4"
              >
                <div className="flex-1 min-w-0 space-y-2">
                  <p className="font-black text-zinc-100 flex items-center gap-2 break-words">
                    <Scissors size={16} className="text-blue-600 flex-shrink-0" />
                    {ag.servico}
                  </p>
                  <p className="text-sm text-zinc-400 font-medium flex items-center gap-2">
                    <Calendar size={14} className="text-zinc-500 flex-shrink-0" />
                    {formatarData(ag.data)}
                  </p>
                  <p className="text-sm text-zinc-400 font-medium flex items-center gap-2">
                    <Clock size={14} className="text-zinc-500 flex-shrink-0" />
                    {ag.hora}
                    {ehMadrugada(ag.hora) && (
                      <span className="text-[10px] uppercase text-blue-600/70 font-bold">
                        madrugada de {diaSeguinteFormatado(ag.data)}
                      </span>
                    )}
                  </p>
                </div>

                <button
                  onClick={() => cancelar(ag)}
                  disabled={cancelandoId === ag.id}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-full font-bold text-sm border transition-all flex-shrink-0 bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500 hover:text-white disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-red-500/10 disabled:hover:text-red-400"
                >
                  {cancelandoId === ag.id ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Cancelando...
                    </>
                  ) : (
                    <>
                      <X size={16} />
                      Cancelar
                    </>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}

        {estado === 'pronto' && (
          <p className="mt-8 text-center text-xs text-zinc-600 font-medium">
            Agendamentos marcados pela barbearia não aparecem aqui. Para cancelá-los, fale direto com o barbeiro.
          </p>
        )}
      </main>

      {/* AVISO AO BARBEIRO - rede de segurança.
          A abertura automática do WhatsApp falha em parte dos aparelhos, e
          falha em silêncio (ver lib/whatsapp.ts). Este cartão fica na tela
          até o cliente fechar, pra que sempre exista um toque que funciona. */}
      {avisoWhatsApp && (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 pointer-events-none">
          <div className="max-w-md mx-auto bg-zinc-900 border border-green-500/30 rounded-[1.5rem] p-5 shadow-2xl pointer-events-auto">
            <div className="flex items-start gap-3 mb-4">
              <CheckCircle2 size={20} className="text-green-500 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="font-black text-zinc-100 text-sm">Agendamento cancelado!</p>
                <p className="text-zinc-400 text-xs font-medium mt-1">
                  Se o WhatsApp não abriu sozinho, avise o barbeiro por aqui.
                </p>
              </div>
              <button
                onClick={() => setAvisoWhatsApp(null)}
                className="text-zinc-500 hover:text-white transition-colors flex-shrink-0"
                aria-label="Fechar aviso"
              >
                <X size={18} />
              </button>
            </div>
            <a
              href={montarLinkWhatsApp(avisoWhatsApp)}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setAvisoWhatsApp(null)}
              className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-green-500 text-zinc-950 rounded-full font-bold hover:bg-green-400 transition-all"
            >
              <Phone size={18} />
              Avisar no WhatsApp
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
