'use client';

// Tela mostrada quando algo quebra durante a renderização. Sem este arquivo,
// qualquer erro derruba a árvore inteira e o cliente vê uma tela BRANCA - que
// no app instalado é pior ainda, porque lá não existe barra de endereço nem
// botão de recarregar para ele se virar.

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RotateCcw, Home } from 'lucide-react';

export default function Erro({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // A mensagem técnica fica no console do navegador, nunca na tela: ela
    // pode conter detalhe interno que não interessa (nem deve chegar) ao
    // cliente. Na tela mostramos só o 'digest', um código opaco que o Next
    // gera e que serve pra achar o erro no log da Vercel.
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 flex items-center justify-center p-6 selection:bg-blue-600 selection:text-zinc-950">
      <div className="max-w-sm w-full bg-zinc-900 border border-white/10 rounded-[2rem] p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-red-500/10 border border-red-500/30 flex items-center justify-center">
          <AlertTriangle size={28} className="text-red-400" />
        </div>

        <h1 className="text-xl font-black tracking-tight mb-2">
          Algo deu errado
        </h1>
        <p className="text-zinc-400 text-sm font-medium mb-8">
          Não conseguimos carregar esta tela. Tente de novo — se continuar,
          chame a barbearia pelo WhatsApp que a gente resolve seu horário.
        </p>

        <div className="flex flex-col gap-3">
          <button
            onClick={reset}
            className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-blue-600 text-zinc-950 rounded-full font-bold hover:bg-blue-500 transition-all"
          >
            <RotateCcw size={18} />
            Tentar de novo
          </button>

          <Link
            href="/"
            className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-white/5 text-zinc-300 rounded-full font-bold hover:bg-white/10 transition-all"
          >
            <Home size={18} />
            Voltar ao início
          </Link>
        </div>

        {error.digest && (
          <p className="mt-6 text-[11px] text-zinc-600 font-mono">
            código: {error.digest}
          </p>
        )}
      </div>
    </div>
  );
}
