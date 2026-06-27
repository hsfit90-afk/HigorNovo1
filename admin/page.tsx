'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, User, Phone, Scissors, Trash2, Home } from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function AdminPage() {
  const router = useRouter();
  const [agendamentos, setAgendamentos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      // === ATUALIZAÇÃO: LIBERANDO A ENTRADA DOS DOIS DONOS ===
      const adminEmails = ['souza.higor@gmail.com', 'pietro.radical.black@gmail.com'];
      
      if (!session || !session.user.email || !adminEmails.includes(session.user.email)) {
        router.push('/');
        return;
      }
      buscarAgendamentos();
    };
    checkUser();
  }, []);

  const buscarAgendamentos = async () => {
    setLoading(true);

    const agora = new Date();
    const dataAtual = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(agora);
    const horaAtual = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' }).format(agora);

    const { data } = await supabase
      .from('agendamentos')
      .select('*')
      .gte('data', dataAtual)
      .order('data', { ascending: true })
      .order('hora', { ascending: true });
      
    if (data) {
      const agendamentosPendentes = data.filter(ag => {
        if (ag.data > dataAtual) return true;
        if (ag.data === dataAtual && ag.hora >= horaAtual) return true;
        return false;
      });
      setAgendamentos(agendamentosPendentes);
    }
    setLoading(false);
  };

  const deletarAgendamento = async (id: number) => {
    if (window.confirm('Tem certeza que deseja cancelar e apagar este agendamento?')) {
      await supabase.from('agendamentos').delete().eq('id', id);
      buscarAgendamentos(); // atualiza a lista automaticamente
    }
  };

  const formatarData = (dataStr: string) => {
    if (!dataStr) return '';
    const partes = dataStr.split('-');
    if(partes.length !== 3) return dataStr;
    return `${partes[2]}/${partes[1]}/${partes[0]}`;
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 p-6 md:p-12 font-sans selection:bg-blue-600 selection:text-zinc-950">
      
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-4">
          <div>
            <h1 className="text-3xl font-black text-white flex items-center gap-3">
              <div className="w-2 h-8 bg-blue-600 rounded-full"></div>
              Painel de Agendamentos
            </h1>
            <p className="text-zinc-400 mt-2">Área restrita para administradores da barbearia.</p>
          </div>
          
          <button 
            onClick={() => router.push('/')}
            className="flex items-center gap-2 bg-zinc-900 border border-zinc-800 px-4 py-2 rounded-xl text-zinc-300 hover:text-blue-600 hover:border-blue-600/50 transition-all font-semibold"
          >
            <Home size={18} />
            Voltar para o Site
          </button>
        </div>

        <div className="bg-zinc-900/40 border border-white/5 rounded-3xl p-1 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-zinc-900/80 text-zinc-400 text-sm uppercase tracking-wider border-b border-zinc-800">
                  <th className="p-4 font-bold rounded-tl-2xl">Data</th>
                  <th className="p-4 font-bold">Hora</th>
                  <th className="p-4 font-bold">Cliente</th>
                  <th className="p-4 font-bold">WhatsApp</th>
                  <th className="p-4 font-bold">Serviço(s)</th>
                  <th className="p-4 font-bold text-center rounded-tr-2xl">Ação</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-zinc-500 font-bold">Carregando agenda...</td>
                  </tr>
                ) : agendamentos.map((agendamento) => (
                  <tr key={agendamento.id} className="hover:bg-zinc-800/20 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-zinc-300 font-semibold whitespace-nowrap">
                        <Calendar size={16} className="text-blue-600/70" /> 
                        {formatarData(agendamento.data)}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-zinc-300 font-bold bg-zinc-900/50 w-fit px-3 py-1 rounded-lg border border-zinc-800">
                        <Clock size={16} className="text-blue-600" /> 
                        {agendamento.hora}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-white font-semibold">
                        <User size={16} className="text-zinc-500" /> 
                        {agendamento.cliente_nome || 'Cliente não informou o nome'}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-zinc-400 whitespace-nowrap">
                        <Phone size={16} className="text-zinc-500" /> 
                        {agendamento.cliente_telefone || '-'}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-blue-600/90 font-medium max-w-xs break-words">
                        <Scissors size={16} className="text-blue-600/50 flex-shrink-0" /> 
                        {agendamento.servico}
                      </div>
                    </td>
                    <td className="p-4 text-center">
                      <button 
                        onClick={() => deletarAgendamento(agendamento.id)}
                        className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all opacity-50 group-hover:opacity-100"
                        title="Cancelar/Excluir Agendamento"
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!loading && agendamentos.length === 0 && (
            <div className="text-center py-16 text-zinc-500 font-bold flex flex-col items-center gap-3">
              <Calendar size={48} className="text-zinc-800" />
              Nenhum agendamento marcado ainda.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
