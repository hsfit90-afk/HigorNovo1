'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useRouter } from 'next/navigation';
import { Calendar, Clock, User, Phone, Scissors, Trash2, Home, BarChart3, TrendingUp, Megaphone, Send, Users, Crown, Gem } from 'lucide-react';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function AdminPage() {
  const router = useRouter();
  const [agendamentos, setAgendamentos] = useState<any[]>([]);
  const [historico, setHistorico] = useState<any[]>([]);
  const [todos, setTodos] = useState<any[]>([]);
  const [abaAtiva, setAbaAtiva] = useState<'proximos' | 'historico' | 'estatisticas' | 'avisos' | 'assinantes'>('proximos');
  const [loading, setLoading] = useState(true);
  const [mensagemAviso, setMensagemAviso] = useState('');
  const [assinantes, setAssinantes] = useState<any[]>([]);
  const [subAbaPlano, setSubAbaPlano] = useState<'ouro' | 'diamante'>('ouro');
  const [novoAssinanteNome, setNovoAssinanteNome] = useState('');
  const [novoAssinanteTelefone, setNovoAssinanteTelefone] = useState('');

  useEffect(() => {
    const checkUser = async () => {
      // Atalho SÓ para "npm run dev" local: acesse http://localhost:3000/admin?admin_preview=1
      // para ver o painel sem depender do Supabase. Eliminado do bundle em produção,
      // pois process.env.NODE_ENV nunca é 'development' num build de produção.
      if (
        process.env.NODE_ENV === 'development' &&
        new URLSearchParams(window.location.search).get('admin_preview') === '1'
      ) {
        buscarAgendamentos();
        buscarAssinantes();
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      const adminEmails = ['souza.higor@gmail.com', 'pietro.radical.black@gmail.com'];
      if (!session || !session.user.email || !adminEmails.includes(session.user.email)) {
        router.push('/');
        return;
      }
      buscarAgendamentos();
      buscarAssinantes();
    };
    checkUser();
  }, []);

  const buscarAssinantes = async () => {
    const { data } = await supabase.from('assinantes').select('*').order('cliente_nome');
    if (data) setAssinantes(data);
  };

  const buscarAgendamentos = async () => {
    setLoading(true);

    const agora = new Date();
    const dataAtual = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(agora);
    const horaAtual = new Intl.DateTimeFormat('pt-BR', { timeZone: 'America/Sao_Paulo', hour: '2-digit', minute: '2-digit' }).format(agora);

    const { data } = await supabase
      .from('agendamentos')
      .select('*')
      .order('data', { ascending: false })
      .order('hora', { ascending: false });
      
    if (data) {
      const agendamentosPendentes = data.filter(ag => {
        if (ag.data > dataAtual) return true;
        if (ag.data === dataAtual && ag.hora >= horaAtual) return true;
        return false;
      }).sort((a, b) => {
        if (a.data !== b.data) return a.data.localeCompare(b.data);
        return a.hora.localeCompare(b.hora);
      });

      const agendamentosPassados = data.filter(ag => {
        if (ag.data < dataAtual) return true;
        if (ag.data === dataAtual && ag.hora < horaAtual) return true;
        return false;
      });

      setAgendamentos(agendamentosPendentes);
      setHistorico(agendamentosPassados);
      setTodos(data);
    }
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

  // Clientes únicos com agendamento futuro, para o aviso em massa (deduplica por telefone)
  const clientesParaAvisar = Array.from(
    new Map(
      agendamentos
        .filter(ag => ag.cliente_telefone && ag.servico !== 'LOJA_FECHADA')
        .map(ag => [ag.cliente_telefone, ag])
    ).values()
  );

  const linkWhatsAppAviso = (telefone: string) =>
    `https://wa.me/55${telefone.replace(/\D/g, '')}?text=${encodeURIComponent(mensagemAviso)}`;

  // Conta quantos cortes esse telefone já usou no mês corrente (mês calendário,
  // não semana corrida) — os 4 cortes do plano contam desde o dia 1 do mês,
  // OU desde a data em que a pessoa virou assinante, o que for mais tarde.
  // Isso evita contar cortes pagos avulsos feitos antes da assinatura.
  const contarCortesDoMes = (assinante: any) => {
    const telefoneNormalizado = assinante.cliente_telefone.replace(/\D/g, '');
    const anoMesAtual = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit' }).format(new Date());
    const primeiroDiaMes = `${anoMesAtual}-01`;
    const dataAssinatura = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Sao_Paulo', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(assinante.criado_em));
    const dataInicioContagem = dataAssinatura > primeiroDiaMes ? dataAssinatura : primeiroDiaMes;

    return todos.filter(ag =>
      ag.cliente_telefone &&
      ag.servico !== 'LOJA_FECHADA' &&
      ag.cliente_telefone.replace(/\D/g, '') === telefoneNormalizado &&
      ag.data?.startsWith(anoMesAtual) &&
      ag.data >= dataInicioContagem
    ).length;
  };

  const adicionarAssinante = async () => {
    if (!novoAssinanteNome.trim() || !novoAssinanteTelefone.trim()) {
      alert('Preencha nome e telefone do assinante.');
      return;
    }
    const { error } = await supabase.from('assinantes').insert([{
      cliente_nome: novoAssinanteNome.trim(),
      cliente_telefone: novoAssinanteTelefone.replace(/\D/g, ''),
      plano: subAbaPlano,
    }]);

    if (error) {
      if (error.code === '23505') {
        alert('Já existe um assinante cadastrado com esse telefone.');
      } else {
        alert('Erro ao cadastrar assinante: ' + error.message);
      }
      return;
    }
    setNovoAssinanteNome('');
    setNovoAssinanteTelefone('');
    buscarAssinantes();
  };

  const removerAssinante = async (id: number) => {
    if (window.confirm('Remover esse assinante? Ele deixa de ter os cortes do plano cobertos.')) {
      await supabase.from('assinantes').delete().eq('id', id);
      buscarAssinantes();
    }
  };

  const assinantesDoPlano = assinantes.filter(a => a.plano === subAbaPlano);

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 p-6 md:p-12 font-sans selection:bg-blue-600 selection:text-zinc-950">
      
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-5">
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-white flex items-center gap-3">
              <div className="w-2 h-6 md:h-8 bg-blue-600 rounded-full"></div>
              Painel de Agendamentos
            </h1>
            <p className="text-sm md:text-base text-zinc-400 mt-1 md:mt-2">Área restrita para administradores da barbearia.</p>
          </div>
          
          <button 
            onClick={() => router.push('/')}
            className="w-full md:w-auto flex items-center justify-center gap-2 bg-zinc-900 border border-zinc-800 px-4 py-3 md:py-2 rounded-xl text-zinc-300 hover:text-blue-600 hover:border-blue-600/50 transition-all font-semibold"
          >
            <Home size={18} />
            Voltar para o Site
          </button>
        </div>

        <div className="flex overflow-x-auto gap-3 mb-6 pb-2 custom-scrollbar">
          <button 
            onClick={() => setAbaAtiva('proximos')}
            className={`whitespace-nowrap flex-shrink-0 px-5 py-2.5 md:px-6 md:py-2 rounded-xl font-bold transition-all ${abaAtiva === 'proximos' ? 'bg-blue-600 text-white' : 'bg-zinc-900 text-zinc-400 hover:text-white'}`}
          >
            Próximos Agendamentos
          </button>
          <button 
            onClick={() => setAbaAtiva('historico')}
            className={`whitespace-nowrap flex-shrink-0 px-5 py-2.5 md:px-6 md:py-2 rounded-xl font-bold transition-all ${abaAtiva === 'historico' ? 'bg-blue-600 text-white' : 'bg-zinc-900 text-zinc-400 hover:text-white'}`}
          >
            Histórico de Atendimentos
          </button>
          <button
            onClick={() => setAbaAtiva('estatisticas')}
            className={`whitespace-nowrap flex-shrink-0 px-5 py-2.5 md:px-6 md:py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${abaAtiva === 'estatisticas' ? 'bg-blue-600 text-white' : 'bg-zinc-900 text-zinc-400 hover:text-white'}`}
          >
            <BarChart3 size={18} />
            Estatísticas
          </button>
          <button
            onClick={() => setAbaAtiva('avisos')}
            className={`whitespace-nowrap flex-shrink-0 px-5 py-2.5 md:px-6 md:py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${abaAtiva === 'avisos' ? 'bg-blue-600 text-white' : 'bg-zinc-900 text-zinc-400 hover:text-white'}`}
          >
            <Megaphone size={18} />
            Avisar Clientes
          </button>
          <button
            onClick={() => setAbaAtiva('assinantes')}
            className={`whitespace-nowrap flex-shrink-0 px-5 py-2.5 md:px-6 md:py-2 rounded-xl font-bold transition-all flex items-center gap-2 ${abaAtiva === 'assinantes' ? 'bg-blue-600 text-white' : 'bg-zinc-900 text-zinc-400 hover:text-white'}`}
          >
            <Users size={18} />
            Assinantes
          </button>
        </div>

        {abaAtiva === 'estatisticas' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
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
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {Object.entries(
                  todos.reduce((acc, curr) => {
                    const serv = curr.servico || 'Outros';
                    acc[serv] = (acc[serv] || 0) + 1;
                    return acc;
                  }, {} as Record<string, number>)
                )
                  .sort((a, b) => (b[1] as number) - (a[1] as number))
                  .map(([servico, qtd]) => (
                    <div key={servico} className="flex items-center justify-between bg-zinc-950/50 py-2 px-3 rounded-xl border border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-blue-600"></div>
                        <span className="text-zinc-200 font-bold text-sm">{servico}</span>
                      </div>
                      <span className="bg-blue-600/20 text-blue-400 px-2.5 py-1 rounded-lg text-xs font-black border border-blue-500/20">
                        {qtd as number}x
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        ) : abaAtiva === 'assinantes' ? (
          <div className="bg-zinc-900/40 border border-white/5 rounded-3xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <Users size={20} className="text-blue-500" />
              Clientes Assinantes
            </h3>
            <p className="text-zinc-400 text-sm mb-5">
              Assinantes não pagam o sinal de R$10 nos primeiros 4 cortes do mês. Cadastre aqui depois de confirmar o pagamento do plano no InfinitePay.
            </p>

            <div className="flex gap-3 mb-6">
              <button
                onClick={() => setSubAbaPlano('ouro')}
                className={`flex items-center gap-2 px-5 py-2 rounded-xl font-bold transition-all ${subAbaPlano === 'ouro' ? 'bg-blue-600 text-white' : 'bg-zinc-900 text-zinc-400 hover:text-white'}`}
              >
                <Crown size={16} />
                Plano Ouro
              </button>
              <button
                onClick={() => setSubAbaPlano('diamante')}
                className={`flex items-center gap-2 px-5 py-2 rounded-xl font-bold transition-all ${subAbaPlano === 'diamante' ? 'bg-blue-600 text-white' : 'bg-zinc-900 text-zinc-400 hover:text-white'}`}
              >
                <Gem size={16} />
                Plano Diamante
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
              <input
                value={novoAssinanteNome}
                onChange={(e) => setNovoAssinanteNome(e.target.value)}
                placeholder="Nome do cliente"
                className="bg-zinc-950/50 border border-zinc-800 p-3 rounded-xl text-white outline-none focus:border-blue-600 transition-all"
              />
              <div className="flex gap-2">
                <input
                  value={novoAssinanteTelefone}
                  onChange={(e) => setNovoAssinanteTelefone(e.target.value)}
                  placeholder="WhatsApp"
                  className="flex-1 min-w-0 bg-zinc-950/50 border border-zinc-800 p-3 rounded-xl text-white outline-none focus:border-blue-600 transition-all"
                />
                <button
                  onClick={adicionarAssinante}
                  className="flex-shrink-0 bg-blue-600 hover:bg-blue-500 text-zinc-950 font-bold px-5 rounded-xl transition-all"
                >
                  Adicionar
                </button>
              </div>
            </div>

            {assinantesDoPlano.length === 0 ? (
              <div className="text-center py-10 text-zinc-500 font-bold flex flex-col items-center gap-3">
                {subAbaPlano === 'ouro' ? <Crown size={40} className="text-zinc-800" /> : <Gem size={40} className="text-zinc-800" />}
                Nenhum assinante do Plano {subAbaPlano === 'ouro' ? 'Ouro' : 'Diamante'} cadastrado.
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                {assinantesDoPlano.map((assinante) => {
                  const cortes = contarCortesDoMes(assinante);
                  return (
                    <div
                      key={assinante.id}
                      className="flex items-center justify-between gap-3 bg-zinc-950/50 border border-white/5 p-3 rounded-xl"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <User size={16} className="text-zinc-500 flex-shrink-0" />
                        <div className="min-w-0">
                          <p className="text-white font-semibold text-sm truncate">{assinante.cliente_nome}</p>
                          <p className="text-zinc-500 text-xs">{assinante.cliente_telefone}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className={`px-3 py-1.5 rounded-lg text-xs font-black border whitespace-nowrap ${cortes >= 4 ? 'bg-red-500/10 text-red-500 border-red-500/20' : 'bg-blue-600/10 text-blue-400 border-blue-500/20'}`}>
                          {cortes}/4 cortes este mês
                        </span>
                        <button
                          onClick={() => removerAssinante(assinante.id)}
                          className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all"
                          title="Remover assinante"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : abaAtiva === 'avisos' ? (
          <div className="bg-zinc-900/40 border border-white/5 rounded-3xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <Megaphone size={20} className="text-blue-500" />
              Aviso rápido aos clientes
            </h3>
            <p className="text-zinc-400 text-sm mb-5">
              Escreva o aviso (ex: fechamento antecipado hoje) e clique em "Enviar" ao lado de cada cliente com agendamento futuro — isso abre o WhatsApp já com a mensagem pronta, você só confirma o envio.
            </p>

            <textarea
              value={mensagemAviso}
              onChange={(e) => setMensagemAviso(e.target.value)}
              placeholder="Ex: Olá! Hoje vamos fechar mais cedo, às 18h. Se seu horário for depois disso, por favor entre em contato para reagendar. Obrigado!"
              rows={4}
              className="w-full bg-zinc-950/50 border border-zinc-800 p-4 rounded-xl text-white outline-none focus:border-blue-600 transition-all font-medium resize-none mb-6"
            />

            {clientesParaAvisar.length === 0 ? (
              <div className="text-center py-10 text-zinc-500 font-bold flex flex-col items-center gap-3">
                <Megaphone size={40} className="text-zinc-800" />
                Nenhum cliente com agendamento futuro para avisar.
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-wider mb-2">
                  {clientesParaAvisar.length} cliente{clientesParaAvisar.length > 1 ? 's' : ''} com horário marcado
                </p>
                {clientesParaAvisar.map((cliente) => (
                  <div
                    key={cliente.cliente_telefone}
                    className="flex items-center justify-between gap-3 bg-zinc-950/50 border border-white/5 p-3 rounded-xl"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <User size={16} className="text-zinc-500 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="text-white font-semibold text-sm truncate">{cliente.cliente_nome || 'Cliente não informou o nome'}</p>
                        <p className="text-zinc-500 text-xs">{cliente.cliente_telefone}</p>
                      </div>
                    </div>
                    {mensagemAviso.trim() ? (
                      <a
                        href={linkWhatsAppAviso(cliente.cliente_telefone)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-shrink-0 flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-zinc-950 font-bold text-sm px-4 py-2 rounded-lg transition-all"
                      >
                        <Send size={14} />
                        Enviar
                      </a>
                    ) : (
                      <span className="flex-shrink-0 text-zinc-600 text-xs font-semibold px-4 py-2">
                        Escreva a mensagem
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
        <div className="bg-zinc-900/40 border border-white/5 rounded-3xl p-1 overflow-hidden shadow-2xl">
          <div className="overflow-x-auto overflow-y-auto max-h-[600px] custom-scrollbar">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="sticky top-0 z-10 shadow-sm">
                <tr className="bg-zinc-900 text-zinc-400 text-sm uppercase tracking-wider border-b border-zinc-800">
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
                      {agendamento.cliente_telefone ? (
                        <a 
                          href={`https://wa.me/55${agendamento.cliente_telefone.replace(/\D/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-zinc-400 hover:text-green-500 transition-colors whitespace-nowrap cursor-pointer"
                          title="Chamar no WhatsApp"
                        >
                          <Phone size={16} className="text-zinc-500" /> 
                          {agendamento.cliente_telefone}
                        </a>
                      ) : (
                        <div className="flex items-center gap-2 text-zinc-400 whitespace-nowrap">
                          <Phone size={16} className="text-zinc-500" /> 
                          -
                        </div>
                      )}
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
