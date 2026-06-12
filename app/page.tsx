'use client';

import React, { useState, useEffect } from 'react';
import { Scissors, Calendar, Clock, User, Phone, CheckCircle2, Instagram, Facebook, Star, MessageSquare, Lock, DollarSign, PlusCircle, ArrowUpCircle, ArrowDownCircle, LogOut, ArrowLeft } from 'lucide-react';

// Conexão com o Supabase
import { supabase } from '../lib/supabase';

import logoImg from './logo.jpeg';
import donoImg from './dono.jpeg';

interface FinancasEntry {
  id: number;
  tipo: string;
  valor: number;
  descricao: string;
  created_at: string;
}

export default function BarbeariaPage() {
  // Estados do Agendamento do Cliente
  const [selectedService, setSelectedService] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [selectedTime, setSelectedTime] = useState('');
  const [selectedBarber] = useState('pietro');
  const [name, setName] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  
  // NOVO: Estado para guardar os horários já ocupados
  const [bookedTimes, setBookedTimes] = useState<string[]>([]);
  const [isBooking, setIsBooking] = useState(false);

  // Estados do Painel de Administração
  const [isAdminView, setIsAdminView] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  
  // Estados de Finanças
  const [financeType, setFinanceType] = useState('ganho');
  const [financeValue, setFinanceValue] = useState('');
  const [financeDescription, setFinanceDescription] = useState('');
  const [financeEntries, setFinanceEntries] = useState<FinancasEntry[]>([]);
  const [loadingFinance, setLoadingFinance] = useState(false);

  const owner = { id: 'pietro', name: 'Pietro', avatar: donoImg.src };

  const reviews = [
    { id: 1, name: 'Carlos Alves', text: 'Melhor corte da região, barba impecável sempre!', rating: 5, avatar: 'https://picsum.photos/seed/carlos/100/100' },
    { id: 2, name: 'Fernando Costa', text: 'Ambiente sensacional, o Pietro manda muito bem.', rating: 5, avatar: 'https://picsum.photos/seed/fernando/100/100' },
    { id: 3, name: 'Lucas Martins', text: 'Atendimento nota 10, virei cliente fiel.', rating: 5, avatar: 'https://picsum.photos/seed/lucas/100/100' },
  ];

  const services = [
    { id: 'corte', title: 'Corte Clássico', duration: '45 min', price: 'R$ 50' },
    { id: 'barba', title: 'Barba Completa', duration: '30 min', price: 'R$ 35' },
    { id: 'completo', title: 'Combo Premium', duration: '75 min', price: 'R$ 75' },
  ];

  const timeslots = [
    '09:00', '10:00', '11:00', '12:00', 
    '14:30', '15:30', '16:30', '17:00'
  ];

  // NOVO: Efeito que busca os horários ocupados sempre que a data muda
  useEffect(() => {
    if (selectedDate) {
      fetchBookedTimes(selectedDate);
      setSelectedTime(''); // Limpa o horário se o cliente mudar de dia
    } else {
      setBookedTimes([]);
    }
  }, [selectedDate]);

  const fetchBookedTimes = async (date: string) => {
    const { data, error } = await supabase
      .from('agendamentos')
      .select('horario')
      .eq('data', date);

    if (!error && data) {
      // Extrai apenas a lista de horários (ex: ['09:00', '10:00'])
      const ocupados = data.map(agendamento => agendamento.horario);
      setBookedTimes(ocupados);
    }
  };

  useEffect(() => {
    if (isLoggedIn) fetchFinancas();
  }, [isLoggedIn]);

  const fetchFinancas = async () => {
    setLoadingFinance(true);
    const { data, error } = await supabase
      .from('financas')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error && data) setFinanceEntries(data);
    setLoadingFinance(false);
  };

  // NOVO: Função de agendamento atualizada com gravação no banco
  const handleClientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !selectedDate || !selectedTime || !name || !whatsapp) return;

    setIsBooking(true);

    // 1. Grava no Supabase
    const { error } = await supabase
      .from('agendamentos')
      .insert([
        {
          data: selectedDate,
          horario: selectedTime,
          cliente_nome: name,
          cliente_whatsapp: whatsapp,
          servico: selectedService
        }
      ]);

    setIsBooking(false);

    if (error) {
      alert("Ocorreu um erro ao agendar. Por favor, tente novamente.");
      return;
    }

    // 2. Prepara mensagem do WhatsApp
    const serviceName = services.find(s => s.id === selectedService)?.title || 'Serviço';
    const dataPartes = selectedDate.split('-');
    const dataFormatada = `${dataPartes[2]}/${dataPartes[1]}/${dataPartes[0]}`;
    
    const numeroBarbearia = "5511999999999"; // Lembre-se de colocar o seu número aqui
    
    const mensagem = `Olá, Pietro! Acabei de agendar pelo aplicativo.\n\n` +
                     `✂️ *Serviço:* ${serviceName}\n` +
                     `📅 *Data:* ${dataFormatada}\n` +
                     `⏰ *Horário:* ${selectedTime}\n` +
                     `👤 *Nome:* ${name}`;

    const urlWhatsapp = `https://wa.me/${numeroBarbearia}?text=${encodeURIComponent(mensagem)}`;
    window.open(urlWhatsapp, '_blank');

    // 3. Atualiza os botões bloqueados, mostra sucesso e limpa form
    fetchBookedTimes(selectedDate);
    setShowSuccess(true);
    setSelectedService('');
    setSelectedDate('');
    setSelectedTime('');
    setName('');
    setWhatsapp('');
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'pietro123') {
      setIsLoggedIn(true);
      setLoginError('');
    } else {
      setLoginError('Senha incorreta!');
    }
  };

  const handleAddFinanceEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!financeValue || !financeDescription) return;

    const { error } = await supabase
      .from('financas')
      .insert([{ tipo: financeType, valor: parseFloat(financeValue), descricao: financeDescription }]);

    if (!error) {
      setFinanceValue('');
      setFinanceDescription('');
      fetchFinancas();
    }
  };

  const totalGanhos = financeEntries.filter(e => e.tipo === 'ganho').reduce((acc, curr) => acc + curr.valor, 0);
  const totalDespesas = financeEntries.filter(e => e.tipo === 'despesa').reduce((acc, curr) => acc + curr.valor, 0);
  const saldoTotal = totalGanhos - totalDespesas;
  const isFormComplete = selectedService && selectedDate && selectedTime && name && whatsapp;

  // TELA DE ADMIN LOGADO
  if (isAdminView && isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#0F1115] text-[#EAEAEA] font-sans p-4 md:p-8">
        <main className="max-w-5xl w-full mx-auto flex flex-col gap-6">
          <div className="flex justify-between items-center border-b border-[#00A8E8]/30 pb-4">
            <div className="flex items-center gap-3">
              <DollarSign className="w-8 h-8 text-[#00A8E8]" />
              <h1 className="text-2xl md:text-3xl font-serif font-bold text-white uppercase tracking-tight">Contabilidade - Pietro</h1>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setIsAdminView(false)} className="flex items-center gap-2 bg-[#252A32] text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-xl border border-white/5 hover:border-[#00A8E8] transition-colors">
                <ArrowLeft className="w-4 h-4" /> Voltar ao App
              </button>
              <button onClick={() => { setIsLoggedIn(false); setPassword(''); }} className="flex items-center gap-2 bg-red-600/20 text-red-400 text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-xl hover:bg-red-600 hover:text-white transition-colors">
                <LogOut className="w-4 h-4" /> Sair
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-[#1A1D23] p-5 rounded-xl border border-white/5 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase text-gray-500 font-bold tracking-wider">Total de Ganhos</p>
                <p className="text-2xl font-bold text-green-400 mt-1">R$ {totalGanhos.toFixed(2)}</p>
              </div>
              <ArrowUpCircle className="w-8 h-8 text-green-400" />
            </div>
            <div className="bg-[#1A1D23] p-5 rounded-xl border border-white/5 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase text-gray-500 font-bold tracking-wider">Total de Despesas</p>
                <p className="text-2xl font-bold text-red-400 mt-1">R$ {totalDespesas.toFixed(2)}</p>
              </div>
              <ArrowDownCircle className="w-8 h-8 text-red-400" />
            </div>
            <div className="bg-[#1A1D23] p-5 rounded-xl border-2 border-[#00A8E8]/30 flex items-center justify-between">
              <div>
                <p className="text-xs uppercase text-gray-500 font-bold tracking-wider">Saldo Líquido</p>
                <p className={`text-2xl font-bold mt-1 ${saldoTotal >= 0 ? 'text-[#00A8E8]' : 'text-red-500'}`}>
                  R$ {saldoTotal.toFixed(2)}
                </p>
              </div>
              <DollarSign className="w-8 h-8 text-[#00A8E8]" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <form onSubmit={handleAddFinanceEntry} className="col-span-1 md:col-span-4 bg-[#1A1D23] rounded-xl border border-white/5 p-6 flex flex-col gap-4">
              <h3 className="text-[#00A8E8] uppercase text-xs font-bold tracking-widest flex items-center gap-2 mb-2">
                <PlusCircle className="w-4 h-4" /> Novo Lançamento
              </h3>
              <div className="flex gap-2">
                <button type="button" onClick={() => setFinanceType('ganho')} className={`flex-1 py-2 rounded-lg font-bold text-xs uppercase border transition-all ${financeType === 'ganho' ? 'bg-green-500 text-[#0F1115] border-green-500' : 'bg-[#252A32] text-gray-400 border-transparent'}`}>Ganho</button>
                <button type="button" onClick={() => setFinanceType('despesa')} className={`flex-1 py-2 rounded-lg font-bold text-xs uppercase border transition-all ${financeType === 'despesa' ? 'bg-red-500 text-white border-red-500' : 'bg-[#252A32] text-gray-400 border-transparent'}`}>Despesa</button>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase text-gray-500 font-bold">Valor (R$)</label>
                <input type="number" step="0.01" required placeholder="0.00" value={financeValue} onChange={(e) => setFinanceValue(e.target.value)} className="w-full bg-[#252A32] border border-white/10 rounded-lg p-3 text-[#EAEAEA] outline-none focus:border-[#00A8E8]" />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] uppercase text-gray-500 font-bold">Descrição / Motivo</label>
                <input type="text" required placeholder="Ex: Corte do João ou Conta de Luz" value={financeDescription} onChange={(e) => setFinanceDescription(e.target.value)} className="w-full bg-[#252A32] border border-white/10 rounded-lg p-3 text-[#EAEAEA] outline-none focus:border-[#00A8E8]" />
              </div>
              <button type="submit" className="w-full py-3 bg-[#00A8E8] text-[#0F1115] font-bold uppercase tracking-wider rounded-lg text-xs hover:bg-[#008CBA] mt-2">Salvar no Banco</button>
            </form>

            <div className="col-span-1 md:col-span-8 bg-[#1A1D23] rounded-xl border border-white/5 p-6 flex flex-col">
              <h3 className="text-[#00A8E8] uppercase text-xs font-bold tracking-widest mb-4">Histórico de Fluxo de Caixa</h3>
              {loadingFinance ? (
                <p className="text-gray-500 text-sm italic">A carregar os dados do Supabase...</p>
              ) : financeEntries.length === 0 ? (
                <p className="text-gray-500 text-sm italic">Nenhum registo financeiro encontrado.</p>
              ) : (
                <div className="overflow-y-auto max-h-80 space-y-2 pr-2">
                  {financeEntries.map((entry) => (
                    <div key={entry.id} className="bg-[#252A32] p-3 rounded-lg flex justify-between items-center border border-white/5">
                      <div className="text-left">
                        <p className="font-bold text-sm text-white">{entry.descricao}</p>
                        <p className="text-[10px] text-gray-500">{new Date(entry.created_at).toLocaleDateString('pt-BR')}</p>
                      </div>
                      <p className={`font-bold text-sm ${entry.tipo === 'ganho' ? 'text-green-400' : 'text-red-400'}`}>
                        {entry.tipo === 'ganho' ? '+' : '-'} R$ {entry.valor.toFixed(2)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    );
  }

  // TELA DE LOGIN ADMIN
  if (isAdminView && !isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#0F1115] text-[#EAEAEA] font-sans flex items-center justify-center p-4">
        <div className="bg-[#1A1D23] border border-white/10 p-8 rounded-2xl max-w-sm w-full text-center shadow-2xl relative">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-[#00A8E8]/20 rounded-full flex items-center justify-center border border-[#00A8E8]/30">
              <Lock className="w-5 h-5 text-[#00A8E8]" />
            </div>
          </div>
          <h2 className="text-xl font-bold uppercase tracking-tight text-white mb-2 font-serif">Acesso do Administrador</h2>
          <p className="text-gray-400 text-xs mb-6">Insira a senha do Pietro para ver a contabilidade da barbearia.</p>
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <input type="password" required placeholder="Digite a senha de admin" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full bg-[#252A32] border border-white/10 rounded-xl p-4 text-center text-[#EAEAEA] outline-none focus:border-[#00A8E8] tracking-widest text-sm" />
            {loginError && <p className="text-red-500 text-xs font-bold">{loginError}</p>}
            <button type="submit" className="w-full py-3 bg-[#00A8E8] text-[#0F1115] font-bold uppercase tracking-wider rounded-xl text-sm hover:bg-[#008CBA]">Entrar no Painel</button>
          </form>
          <button onClick={() => setIsAdminView(false)} className="mt-4 text-xs text-gray-500 hover:text-white uppercase tracking-wider">Voltar para o Agendamento</button>
        </div>
      </div>
    );
  }

  // VISÃO DO CLIENTE
  return (
    <div className="min-h-screen bg-[#0F1115] text-[#EAEAEA] font-sans flex flex-col p-4 md:p-8 selection:bg-[#00A8E8] selection:text-[#0F1115] overflow-y-auto">
      <main className="max-w-5xl w-full mx-auto flex flex-col flex-grow">
        <header className="flex flex-col md:flex-row md:justify-between items-start md:items-end mb-8 border-b border-[#00A8E8]/30 pb-6 gap-4">
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border-2 border-[#00A8E8] shadow-lg shadow-[#00A8E8]/20 flex-shrink-0 bg-white">
              <img src={logoImg.src} alt="Logo da Barbearia" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-4xl md:text-5xl font-serif tracking-tighter text-[#00A8E8] mb-1 uppercase font-bold">Barbearia Novo de Novo</h1>
              <p className="text-gray-400 italic font-light">Onde a tradição encontra o estilo moderno.</p>
            </div>
          </div>
          <div className="text-left md:text-right mt-4 md:mt-0">
            <span className="text-xs uppercase tracking-widest text-gray-500">Status do Dia</span>
            <div className="flex items-center md:justify-end space-x-2 mt-1">
              <span className="h-2 w-2 rounded-full bg-green-500"></span>
              <p className="text-sm font-medium">Aberta para agendamentos</p>
            </div>
          </div>
        </header>

        <form onSubmit={handleClientSubmit} className="grid grid-cols-1 md:grid-cols-12 gap-4 flex-grow">
          <section className="col-span-1 md:col-span-12 bg-[#1A1D23] rounded-2xl border border-white/5 overflow-hidden relative shadow-xl h-72 md:h-96">
            <div className="w-full h-full relative">
              <img src={owner.avatar} alt={owner.name} className="w-full h-full object-cover object-top" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#0F1115] via-[#0F1115]/50 to-transparent"></div>
              <div className="absolute bottom-6 left-6 md:bottom-8 md:left-8 z-10 pr-6">
                <span className="text-[#00A8E8] text-xs md:text-sm font-bold uppercase tracking-widest flex items-center gap-1 mb-2 bg-black/40 w-fit px-2 py-1 rounded backdrop-blur-sm">
                  <Star className="w-4 h-4 fill-current" /> Especialista da Casa
                </span>
                <h2 className="text-4xl md:text-6xl font-serif font-bold text-white uppercase tracking-tighter drop-shadow-lg">{owner.name}</h2>
                <p className="text-gray-300 text-sm md:text-base mt-2 max-w-md">Agende seu horário com exclusividade e garanta o melhor visual diretamente com o proprietário.</p>
              </div>
            </div>
          </section>

          <section className="col-span-1 md:col-span-4 bg-[#1A1D23] rounded-2xl border border-white/5 p-6 flex flex-col">
            <h3 className="text-[#00A8E8] uppercase text-xs font-bold tracking-widest mb-4 flex items-center gap-2">
              <Scissors className="w-4 h-4" /> Escolha o Serviço
            </h3>
            <div className="space-y-3 flex-grow">
              {services.map((service) => (
                <button
                  type="button"
                  key={service.id}
                  onClick={() => setSelectedService(service.id)}
                  className={`w-full group cursor-pointer p-4 rounded-xl transition-all border flex justify-between items-center text-left ${
                    selectedService === service.id
                      ? 'bg-[#00A8E8] text-[#0F1115] border-[#00A8E8] ring-2 ring-[#00A8E8] ring-offset-4 ring-offset-[#0F1115]'
                      : 'bg-[#252A32] hover:bg-[#00A8E8] hover:text-[#0F1115] text-[#EAEAEA] border-white/5'
                  }`}
                >
                  <div>
                    <p className="font-bold uppercase">{service.title}</p>
                    <p className={`text-xs ${selectedService === service.id ? 'font-medium opacity-80' : 'opacity-70'}`}>Duração aprox. {service.duration}</p>
                  </div>
                  <p className="font-serif font-bold">{service.price}</p>
                </button>
              ))}
            </div>
          </section>

          <div className="col-span-1 md:col-span-8 flex flex-col gap-4">
            <section className="bg-[#1A1D23] rounded-2xl border border-white/5 p-6">
              <h3 className="text-[#00A8E8] uppercase text-xs font-bold tracking-widest mb-4 flex items-center gap-2">
                <Calendar className="w-4 h-4" /> Selecione a Data
              </h3>
              <input
                type="date"
                required
                min={new Date().toISOString().split('T')[0]}
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full bg-[#252A32] border border-white/10 rounded-xl p-4 text-[#EAEAEA] focus:ring-1 focus:ring-[#00A8E8] outline-none cursor-pointer"
                style={{ colorScheme: 'dark' }}
              />
            </section>

            <section className="bg-[#1A1D23] rounded-2xl border border-white/5 p-6 flex-grow">
              <h3 className="text-[#00A8E8] uppercase text-xs font-bold tracking-widest mb-4 flex items-center gap-2">
                <Clock className="w-4 h-4" /> Horários Disponíveis
              </h3>
              
              {!selectedDate ? (
                <div className="flex-grow flex items-center justify-center bg-[#252A32]/50 border border-white/5 rounded-xl border-dashed">
                  <p className="text-gray-500 text-sm font-medium">Selecione uma data primeiro.</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {timeslots.map((time) => {
                    // NOVO: Verifica se o horário atual está na lista de horários ocupados do banco
                    const isBooked = bookedTimes.includes(time);

                    return (
                      <button
                        type="button"
                        key={time}
                        disabled={isBooked}
                        onClick={() => setSelectedTime(time)}
                        className={`py-3 rounded-lg border transition-all flex items-center justify-center ${
                          isBooked 
                            ? 'bg-red-900/10 text-red-500/40 border-red-900/20 cursor-not-allowed line-through' 
                            : selectedTime === time
                              ? 'bg-[#00A8E8] text-[#0F1115] border-[#00A8E8] font-bold shadow-lg shadow-[#00A8E8]/20'
                              : 'bg-[#252A32] border-white/5 hover:border-[#00A8E8] text-[#EAEAEA]'
                        }`}
                      >
                        {time}
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          <section className="col-span-1 md:col-span-12 bg-[#1A1D23] rounded-2xl border border-[#00A8E8]/20 p-6 md:p-8 flex flex-col md:flex-row items-stretch md:items-center gap-8 shadow-xl shadow-black/50 mt-2">
            <div className="flex-grow grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest text-gray-500 font-bold flex items-center gap-2"><User className="w-3 h-3" /> Nome Completo</label>
                <input type="text" required placeholder="Ex: João Silva" value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-[#252A32] border border-white/10 rounded-lg p-4 text-[#EAEAEA] outline-none focus:border-[#00A8E8]" />
              </div>
              <div className="space-y-2">
                <label className="text-xs uppercase tracking-widest text-gray-500 font-bold flex items-center gap-2"><Phone className="w-3 h-3" /> Seu WhatsApp</label>
                <input type="tel" required placeholder="(11) 99999-9999" value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className="w-full bg-[#252A32] border border-white/10 rounded-lg p-4 text-[#EAEAEA] outline-none focus:border-[#00A8E8]" />
              </div>
            </div>
            <button
              type="submit"
              disabled={!isFormComplete || isBooking}
              className={`md:h-full py-4 md:py-0 px-12 rounded-xl font-bold uppercase tracking-tighter text-xl transition-all shadow-lg min-h-[4rem] ${
                isFormComplete && !isBooking
                  ? 'bg-[#00A8E8] text-[#0F1115] hover:bg-[#008CBA] shadow-[#00A8E8]/20 active:scale-[0.98]'
                  : 'bg-[#252A32] text-gray-500 cursor-not-allowed border border-white/5'
              }`}
            >
              {isBooking ? 'Agendando...' : <>Confirmar<br className="hidden md:block" /> Agendamento</>}
            </button>
          </section>

          <section className="col-span-1 md:col-span-12 bg-[#1A1D23] rounded-2xl border border-white/5 p-6 flex flex-col mt-2">
            <h3 className="text-[#00A8E8] uppercase text-xs font-bold tracking-widest mb-4 flex items-center gap-2"><MessageSquare className="w-4 h-4" /> Avaliações de Clientes</h3>
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide snap-x">
              {reviews.map((review) => (
                <div key={review.id} className="bg-[#252A32] border border-white/5 rounded-xl p-5 min-w-[280px] sm:min-w-[320px] flex gap-4 snap-start shrink-0 hover:border-[#00A8E8]/40 transition-colors">
                  <div className="w-12 h-12 rounded-full overflow-hidden flex-shrink-0 bg-white/10 ring-2 ring-[#00A8E8]/20">
                    <img src={review.avatar} alt={review.name} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex flex-col gap-2 w-full text-left">
                    <div className="flex justify-between items-start">
                      <span className="font-bold text-sm tracking-tight text-[#EAEAEA]">{review.name}</span>
                      <div className="flex gap-0.5">{[...Array(review.rating)].map((_, i) => <Star key={i} className="w-3 h-3 text-[#00A8E8] fill-[#00A8E8]" />)}</div>
                    </div>
                    <p className="text-gray-400 text-xs sm:text-sm italic leading-relaxed">"{review.text}"</p>
                  </div>
                </div>
              ))}
            </div>
          </section>

        </form>

        <footer className="mt-8 flex flex-col md:flex-row justify-between items-center text-[10px] text-gray-600 uppercase tracking-widest gap-4">
          <div className="flex flex-col md:flex-row items-center gap-2 md:gap-4 flex-1">
            <p>© 2026 Barbearia Novo de Novo - Todos os direitos reservados</p>
            <span className="hidden md:block">•</span>
            <p>Rua dos Barbeiros, 123 - Centro</p>
          </div>
          <div>
            <button onClick={() => setIsAdminView(true)} className="text-gray-600 hover:text-[#00A8E8] transition-colors flex items-center gap-1 font-bold">
              <Lock className="w-3 h-3" /> Acesso Restrito
            </button>
          </div>
        </footer>
      </main>

      {showSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#0F1115]/90 backdrop-blur-md animate-in fade-in duration-200">
          <div className="bg-[#1A1D23] border border-white/10 p-8 rounded-2xl max-w-sm w-full text-center shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[#00A8E8] to-transparent"></div>
            <div className="flex justify-center mb-5">
              <div className="w-16 h-16 bg-[#00A8E8]/20 rounded-full flex items-center justify-center border border-[#00A8E8]/30 shadow-[0_0_20px_rgba(0,168,232,0.2)]">
                <CheckCircle2 className="w-8 h-8 text-[#00A8E8]" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-[#EAEAEA] mb-2 font-serif uppercase tracking-tight">Agendamento Realizado!</h3>
            <p className="text-gray-400 mb-8 text-sm">
              Tudo certo! O horário foi guardado no sistema e enviámos os detalhes para o WhatsApp.
            </p>
            <button onClick={() => setShowSuccess(false)} className="w-full py-3 bg-[#252A32] text-[#EAEAEA] rounded-xl font-bold uppercase tracking-wider text-sm hover:border-[#00A8E8] hover:text-[#00A8E8] border border-white/10 transition-colors">
              Concluir
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
