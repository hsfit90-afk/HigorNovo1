'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, Loader2, AlertTriangle } from 'lucide-react';

const NUMERO_BARBEIRO = '5511953676910';
const MAX_TENTATIVAS = 10;
const INTERVALO_MS = 3000;

type Estado = 'verificando' | 'confirmado' | 'aguardando' | 'expirado' | 'erro';

function RetornoConteudo() {
  const searchParams = useSearchParams();
  const orderNsu = searchParams.get('order_nsu');
  const transactionNsu = searchParams.get('transaction_nsu');
  const slug = searchParams.get('slug');
  const receiptUrl = searchParams.get('receipt_url');

  const [estado, setEstado] = useState<Estado>('verificando');
  const [agendamento, setAgendamento] = useState<any>(null);

  useEffect(() => {
    if (!orderNsu) {
      setEstado('erro');
      return;
    }

    let cancelado = false;
    let tentativas = 0;

    const verificar = async () => {
      tentativas += 1;
      const params = new URLSearchParams({ order_nsu: orderNsu });
      if (transactionNsu) params.set('transaction_nsu', transactionNsu);
      if (slug) params.set('slug', slug);
      if (receiptUrl) params.set('receipt_url', receiptUrl);

      try {
        const resposta = await fetch(`/api/pagamento/status?${params.toString()}`);
        const resultado = await resposta.json();
        if (cancelado) return;

        if (resultado.status === 'confirmado') {
          setAgendamento(resultado.agendamento);
          setEstado('confirmado');
          return;
        }
        if (resultado.status === 'expirado') {
          setEstado('expirado');
          return;
        }
        if (tentativas >= MAX_TENTATIVAS) {
          setEstado('aguardando');
          return;
        }
        setTimeout(verificar, INTERVALO_MS);
      } catch {
        if (!cancelado) setEstado('erro');
      }
    };

    verificar();
    return () => { cancelado = true; };
  }, [orderNsu, transactionNsu, slug, receiptUrl]);

  const linkWhatsApp = () => {
    if (!agendamento) return '#';
    const dataFormatada = agendamento.data.split('-').reverse().join('/');
    const texto = `💈 *NOVO AGENDAMENTO NO SITE!* 💈%0A%0A👤 *Cliente:* ${agendamento.cliente_nome}%0A📱 *WhatsApp:* ${agendamento.cliente_telefone}%0A✂️ *Serviço:* ${agendamento.servico}%0A📅 *Data:* ${dataFormatada}%0A⏰ *Horário:* ${agendamento.hora}%0A💰 *Sinal:* Pago via InfinitePay%0A%0A⚠️ *Aviso:* Ciente da tolerância máxima de 10 minutos.`;
    return `https://wa.me/${NUMERO_BARBEIRO}?text=${texto}`;
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
      <div className="max-w-sm w-full bg-zinc-900 border border-white/10 rounded-[2rem] p-8 text-center">
        {estado === 'verificando' && (
          <>
            <Loader2 className="animate-spin mx-auto mb-4 text-blue-500" size={40} />
            <h1 className="text-white font-black text-xl mb-2">Confirmando seu pagamento…</h1>
            <p className="text-zinc-400 text-sm">Isso leva só alguns segundos. Não feche esta página.</p>
          </>
        )}

        {estado === 'confirmado' && agendamento && (
          <>
            <ShieldCheck className="mx-auto mb-4 text-green-500" size={40} />
            <h1 className="text-white font-black text-xl mb-2">Agendamento confirmado!</h1>
            <p className="text-zinc-400 text-sm mb-6">
              {agendamento.servico} — {agendamento.data.split('-').reverse().join('/')} às {agendamento.hora}
            </p>
            <a
              href={linkWhatsApp()}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full py-4 bg-green-600 hover:bg-green-500 text-white font-black rounded-xl transition-all mb-3"
            >
              Avisar o barbeiro no WhatsApp
            </a>
            <Link href="/" className="block text-zinc-500 hover:text-zinc-300 text-sm font-medium">
              Voltar para o início
            </Link>
          </>
        )}

        {estado === 'aguardando' && (
          <>
            <AlertTriangle className="mx-auto mb-4 text-yellow-500" size={40} />
            <h1 className="text-white font-black text-xl mb-2">Ainda não identificamos seu pagamento</h1>
            <p className="text-zinc-400 text-sm mb-6">
              Se você já pagou, aguarde alguns instantes e atualize a página. Se o problema continuar, fale com a gente.
            </p>
            <a
              href={`https://wa.me/${NUMERO_BARBEIRO}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full py-4 bg-blue-600 hover:bg-blue-500 text-zinc-950 font-black rounded-xl transition-all"
            >
              Falar no WhatsApp
            </a>
          </>
        )}

        {estado === 'expirado' && (
          <>
            <AlertTriangle className="mx-auto mb-4 text-red-500" size={40} />
            <h1 className="text-white font-black text-xl mb-2">Tempo para pagamento esgotado</h1>
            <p className="text-zinc-400 text-sm mb-6">O horário foi liberado. Volte ao site e agende novamente.</p>
            <Link href="/" className="block w-full py-4 bg-blue-600 hover:bg-blue-500 text-zinc-950 font-black rounded-xl transition-all">
              Voltar para o início
            </Link>
          </>
        )}

        {estado === 'erro' && (
          <>
            <AlertTriangle className="mx-auto mb-4 text-red-500" size={40} />
            <h1 className="text-white font-black text-xl mb-2">Algo deu errado</h1>
            <p className="text-zinc-400 text-sm mb-6">Fale com a gente pelo WhatsApp pra confirmarmos seu horário.</p>
            <a
              href={`https://wa.me/${NUMERO_BARBEIRO}`}
              target="_blank"
              rel="noopener noreferrer"
              className="block w-full py-4 bg-blue-600 hover:bg-blue-500 text-zinc-950 font-black rounded-xl transition-all"
            >
              Falar no WhatsApp
            </a>
          </>
        )}
      </div>
    </div>
  );
}

export default function RetornoPagamento() {
  return (
    <Suspense fallback={null}>
      <RetornoConteudo />
    </Suspense>
  );
}
