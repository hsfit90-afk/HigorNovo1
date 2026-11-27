// Endereço que não existe. Sem este arquivo o cliente recebe a página 404
// crua do Next, em fundo branco e em inglês - que no app instalado parece o
// app ter quebrado.

import Link from 'next/link';
import { Compass, Home } from 'lucide-react';

export default function NaoEncontrado() {
  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 flex items-center justify-center p-6 selection:bg-blue-600 selection:text-zinc-950">
      <div className="max-w-sm w-full bg-zinc-900 border border-white/10 rounded-[2rem] p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-blue-600/10 border border-blue-600/30 flex items-center justify-center">
          <Compass size={28} className="text-blue-600" />
        </div>

        <h1 className="text-xl font-black tracking-tight mb-2">
          Página não encontrada
        </h1>
        <p className="text-zinc-400 text-sm font-medium mb-8">
          Esse endereço não existe. Pode ter sido um link antigo.
        </p>

        <Link
          href="/"
          className="flex items-center justify-center gap-2 w-full px-6 py-3 bg-blue-600 text-zinc-950 rounded-full font-bold hover:bg-blue-500 transition-all"
        >
          <Home size={18} />
          Ir para o agendamento
        </Link>
      </div>
    </div>
  );
}
