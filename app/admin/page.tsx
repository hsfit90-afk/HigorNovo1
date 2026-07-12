'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, User, Phone, Scissors, Trash2, Home, BarChart3, TrendingUp } from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function AdminPage() {
  const router = useRouter();
  const [agendamentos, setAgendamentos] = useState<any[]>([]);
  const [historico, setHistorico] = useState<any[]>([]);
  const [todos, setTodos] = useState<any[]>([]);
  const [abaAtiva, setAbaAtiva] = useState<'proximos' | 'historico' | 'estatisticas'>('proximos');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUser = async () => {
      // A BARREIRA DO LOGIN ESTÁ QUEBRADA PARA VISUALIZAÇÃO:
      /*
      const { data: { session } } = await supabase.auth.getSession();
      const adminEmails = ['souza.higor@gmail.com', 'pietro.radical.black@gmail.com'];
      if (!session || !session.user.email || !adminEmails.includes(session.user.email)) {
        router.push('/');
        return;
      }
      */
      buscarAgendamentos();
    };
    checkUser();
  }, []);

  const buscarAgendamentos = async () => {
    setLoading(true);

    const agora = new Date();
    const dataAtual = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(agora);
    const horaAtual = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' }).format(agora);

    // MOCK DATA PARA VISUALIZAR O PAINEL ENQUANTO O SUPABASE ESTÁ PAUSADO
    const mockData = [
      { id: 1, data: '2027-01-01', hora: '15:00', cliente_nome: 'João (Agendamento Futuro)', cliente_telefone: '11999999999', servico: 'Corte + Barba' },
      { id: 2, data: '2023-05-10', hora: '10:00', cliente_nome: 'Carlos (Agendamento Passado)', cliente_telefone: '11888888888', servico: 'Corte' },
      { id: 3, data: '2023-05-11', hora: '14:00', cliente_nome: 'Marcos', cliente_telefone: '11777777777', servico: 'Corte' },
      { id: 4, data: '2023-05-12', hora: '11:00', cliente_nome: 'Felipe', cliente_telefone: '11666666666', servico: 'Barba' },
      { id: 5, data: '2023-05-13', hora: '16:00', cliente_nome: 'Lucas', cliente_telefone: '11555555555', servico: 'Corte + Barba' },
      { id: 6, data: '2023-05-14', hora: '09:00', cliente_nome: 'Pedro', cliente_telefone: '11444444444', servico: 'Sobrancelha' },
    ];
      
    const agendamentosPendentes = mockData.filter(ag => {
      if (ag.data > dataAtual) return true;
      if (ag.data === dataAtual && ag.hora >= horaAtual) return true;
      return false;
    }).sort((a, b) => {
      if (a.data !== b.data) return a.data.localeCompare(b.data);
      return a.hora.localeCompare(b.hora);
    });

    const agendamentosPassados = mockData.filter(ag => {
      if (ag.data < dataAtual) return true;
      if (ag.data === dataAtual && ag.hora < horaAtual) return true;
      return false;
    });

    setAgendamentos(agendamentosPendentes);
    setHistorico(agendamentosPassados);
    setTodos(mockData);
    setLoading(false);
  };

  const deletarAgendamento = async (id: number) => {
    if (window.confirm(abaAtiva === 'proximos' ? 'Tem certeza que deseja cancelar e apagar este agendamento?' : 'Tem certeza que deseja apagar do histórico?')) {
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

        <div className="flex flex-wrap gap-4 mb-6">
          <button 
            onClick={() => setAbaAtiva('proximos')}
            className={`px-6 py-2 rounded-xl font-bold transition-all ${abaAtiva === 'proximos' ? 'bg-blue-600 text-white' : 'bg-zinc-900 text-zinc-400 hover:text-white'}`}
          >
            Próximos Agendamentos
          </button>
          <button 
            onClick={() => setAbaAtiva('historico')}
            className={`px-6 py-2 rounded-xl font-bold transition-all ${abaAtiva === 'historico' ? 'bg-blue-600 text-white' : 'bg-zinc-900 text-zinc-400 hover:text-white'}`}
          >
            Histórico de Atendimentos
          </button>
          <button 
            onClick={() => setAbaAtiva('estatisticas')}
            className={`px-6 py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${abaAtiva === 'estatisticas' ? 'bg-blue-600 text-white' : 'bg-zinc-900 text-zinc-400 hover:text-white'}`}
          >
            <BarChart3 size={18} />
            Estatísticas
          </button>
        </div>

        {abaAtiva === 'estatisticas' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-zinc-900/40 border border-white/5 rounded-3xl p-6 shadow-2xl flex flex-col justify-center">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold text-zinc-300">Total de Atendimentos</h3>
                <div className="w-12 h-12 bg-blue-600/10 text-blue-500 rounded-2xl flex items-center justify-center border border-blue-500/20">
                  <TrendingUp size={24} />
                </div>
              </div>
              <p className="text-6xl font-black text-white">{todos.length}</p>
              <p className="text-zinc-500 mt-2 text-sm font-medium">Desde o início do sistema</p>
            </div>

            <div className="bg-zinc-900/40 border border-white/5 rounded-3xl p-6 shadow-2xl">
              <h3 className="text-lg font-bold text-zinc-300 mb-6 flex items-center gap-2">
                <Scissors size={20} className="text-blue-500" />
                Serviços Mais Solicitados
              </h3>
              <div className="space-y-4">
                {Object.entries(
                  todos.reduce((acc, curr) => {
                    const serv = curr.servico || 'Outros';
                    acc[serv] = (acc[serv] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>)
                )
                  .sort((a, b) => (b[1] as number) - (a[1] as number))
                  .map(([servico, qtd]) => (
                    <div key={servico} className="flex items-center justify-between bg-zinc-950/50 p-3 rounded-xl border border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                        <span className="text-zinc-200 font-bold">{servico}</span>
                      </div>
                      <span className="bg-blue-600/20 text-blue-400 px-3 py-1.5 rounded-lg text-sm font-black border border-blue-500/20">
                        {qtd as number}x
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        ) : (
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
                ) : (abaAtiva === 'proximos' ? agendamentos : historico).map((agendamento) => (
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
                        title={abaAtiva === 'proximos' ? "Cancelar/Excluir Agendamento" : "Excluir do Histórico"}
                      >
                        <Trash2 size={18} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!loading && (abaAtiva === 'proximos' ? agendamentos : historico).length === 0 && (
            <div className="text-center py-16 text-zinc-500 font-bold flex flex-col items-center gap-3">
              <Calendar size={48} className="text-zinc-800" />
              {abaAtiva === 'proximos' ? 'Nenhum agendamento marcado ainda.' : 'Nenhum histórico encontrado.'}
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  );
}
