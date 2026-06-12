'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { LogOut, Calendar, Clock, User, Scissors } from 'lucide-react';

// Ligando o motor do banco de dados (Supabase)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  // Falsos agendamentos apenas para você ver o design do painel
  const agendamentos = [
    { id: 1, cliente: 'João Silva', servico: 'Corte + Barba', data: '12/06/2026', hora: '14:00', status: 'Confirmado' },
    { id: 2, cliente: 'Marcos Paulo', servico: 'Corte Social', data: '12/06/2026', hora: '15:30', status: 'Confirmado' },
    { id: 3, cliente: 'Fernando', servico: 'Barba', data: '12/06/2026', hora: '16:00', status: 'Pendente' },
  ];

  useEffect(() => {
    // Verifica se tem alguém logado (segurança)
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // Ocultamos a trava de segurança só para você conseguir ver a tela agora!
      // se (!session) router.push('/login');
      
      setLoading(false);
    };
    checkUser();
  }, [router]);

  const handleSair = async () => {
    await supabase.auth.signOut();
    router.push('/login'); // Volta pro login ao sair
  };

  if (loading) {
    return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-amber-500 font-bold">Carregando painel...</div>;
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans p-6 md:p-12">
      
      {/* Cabecalho do Admin */}
      <header className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12 bg-zinc-900/50 p-6 rounded-3xl border border-zinc-800/60 shadow-xl">
        <div>
          <h1 className="text-3xl font-bold text-amber-500">Painel do Administrador</h1>
          <p className="text-zinc-400 mt-1">Gerencie seus agendamentos e clientes.</p>
        </div>
        <button 
          onClick={handleSair}
          className="flex items-center gap-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 px-6 py-3 rounded-xl font-bold transition-all"
        >
          <LogOut size={20} />
          Sair da Conta
        </button>
      </header>

      {/* Tabela de Agendamentos */}
      <div className="bg-zinc-900/30 rounded-3xl border border-zinc-800/60 p-6 md:p-8 shadow-2xl">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
          <Calendar className="text-amber-500" /> 
          Agendamentos de Hoje
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400">
                <th className="p-4 font-semibold">Cliente</th>
                <th className="p-4 font-semibold">Serviço</th>
                <th className="p-4 font-semibold">Horário</th>
                <th className="p-4 font-semibold">Status</th>
              </tr>
            </thead>
            <tbody>
              {agendamentos.map((agendamento) => (
                <tr key={agendamento.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-all">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-amber-500">
                        <User size={18} />
                      </div>
                      <span className="font-semibold">{agendamento.cliente}</span>
                    </div>
                  </td>
                  <td className="p-4 text-zinc-300">
                    <div className="flex items-center gap-2">
                      <Scissors size={16} className="text-zinc-500" />
                      {agendamento.servico}
                    </div>
                  </td>
                  <td className="p-4 text-zinc-300">
                    <div className="flex items-center gap-2">
                      <Clock size={16} className="text-zinc-500" />
                      {agendamento.hora}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                      agendamento.status === 'Confirmado' 
                        ? 'bg-green-500/10 text-green-500 border border-green-500/20' 
                        : 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20'
                    }`}>
                      {agendamento.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
