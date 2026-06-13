'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { LogOut, Calendar, Clock, User, Scissors, Trash2 } from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function AdminDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [agendamentos, setAgendamentos] = useState<any[]>([]);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      buscarAgendamentos();
    };
    checkUser();
  }, [router]);

  const buscarAgendamentos = async () => {
    const { data, error } = await supabase
      .from('agendamentos')
      .select('*')
      .eq('status', 'Confirmado')
      .order('data', { ascending: true })
      .order('hora', { ascending: true });
      
    if (data) {
      setAgendamentos(data);
    }
    setLoading(false);
  };

  const handleSair = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  const handleCancelar = async (id: string) => {
    const confirmar = confirm("Tem certeza que deseja cancelar e liberar este horário para outros clientes?");
    if (!confirmar) return;

    const { error } = await supabase.from('agendamentos').update({ status: 'Cancelado' }).eq('id', id);

    if (!error) {
      setAgendamentos(agendamentos.filter(a => a.id !== id));
      alert("Horário cancelado e liberado com sucesso!");
    } else {
      alert("Erro ao cancelar o horário.");
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-zinc-950 flex items-center justify-center text-amber-500 font-bold">Carregando painel...</div>;
  }

  const formatarData = (dataStr: string) => {
    if (!dataStr) return '';
    const partes = dataStr.split('-');
    if(partes.length !== 3) return dataStr;
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans p-6 md:p-12">
      <header className="flex flex-col md:flex-row items-center justify-between gap-6 mb-12 bg-zinc-900/50 p-6 rounded-3xl border border-zinc-800/60 shadow-xl">
        <div>
          <h1 className="text-3xl font-bold text-amber-500">Painel do Administrador</h1>
          <p className="text-zinc-400 mt-1">Controle seus agendamentos e clientes em tempo real.</p>
        </div>
        <button onClick={handleSair} className="flex items-center gap-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 px-6 py-3 rounded-xl font-bold transition-all">
          <LogOut size={20} /> Sair da Conta
        </button>
      </header>

      <div className="bg-zinc-900/30 rounded-3xl border border-zinc-800/60 p-6 md:p-8 shadow-2xl">
        <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><Calendar className="text-amber-500" /> Agendamentos Confirmados</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[700px]">
            <thead>
              <tr className="border-b border-zinc-800 text-zinc-400">
                <th className="p-4 font-semibold">Cliente</th>
                <th className="p-4 font-semibold">Serviço</th>
                <th className="p-4 font-semibold">Data e Hora</th>
                <th className="p-4 font-semibold">Status</th>
                <th className="p-4 font-semibold text-center">Ações</th>
              </tr>
            </thead>
            <tbody>
              {agendamentos.map((agendamento) => (
                <tr key={agendamento.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20 transition-all">
                  <td className="p-4"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center text-amber-500"><User size={18} /></div><span className="font-semibold">{agendamento.cliente_nome || 'Cliente'}</span></div></td>
                  <td className="p-4 text-zinc-300"><div className="flex items-center gap-2"><Scissors size={16} className="text-zinc-500" /> {agendamento.servico}</div></td>
                  <td className="p-4 text-zinc-300"><div className="flex items-center gap-2 text-amber-500 font-bold"><Calendar size={16} /> {formatarData(agendamento.data)} <Clock size={16} className="ml-2" /> {agendamento.hora}</div></td>
                  <td className="p-4"><span className="px-3 py-1 rounded-full text-xs font-bold bg-green-500/10 text-green-500 border border-green-500/20">{agendamento.status}</span></td>
                  <td className="p-4 text-center"><button onClick={() => handleCancelar(agendamento.id)} className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors"><Trash2 size={18} /></button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {agendamentos.length === 0 && <div className="text-center py-12 text-zinc-500 font-bold">Nenhum agendamento confirmado.</div>}
      </div>
    </div>
  );
}
