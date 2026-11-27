// Grade de atendimento da barbearia - FONTE ÚNICA DA VERDADE.
//
// Tanto a tela do cliente (app/page.tsx) quanto a validação no servidor
// (app/api/pagamento/criar) leem daqui. Isso é de propósito: se a grade
// existisse em dois lugares, um dia eles divergiriam e o cliente conseguiria
// agendar num horário que o barbeiro não atende.
//
// São duas camadas:
//   1. GRADE_SEMANAL - o expediente normal, por dia da semana.
//   2. EXCECOES      - datas específicas definidas à mão pelo barbeiro.
//                      Uma data listada em EXCECOES IGNORA a grade semanal,
//                      inclusive quando a lista está vazia (= fechado).

// Almoço: aparece na tela riscado, nunca é agendável.
export const ALMOCO = ['13:00', '14:00'];

// Horário anterior a este é "madrugada": pertence à virada para o dia
// seguinte. Ex.: o 00:00 do dia 23/12 é a madrugada que entra no dia 24.
const LIMITE_MADRUGADA = '06:00';

type FaixaDia = { inicio: number; fim: number } | null;

// null = fechado. 'fim' é EXCLUSIVO: { inicio: 9, fim: 21 } atende 09:00 → 20:00.
// Esta é exatamente a grade que já estava no código antes desta alteração.
export const GRADE_SEMANAL: Record<number, FaixaDia> = {
  0: null,                     // domingo  - fechado
  1: { inicio: 15, fim: 21 },  // segunda  - 15:00 → 20:00
  2: { inicio: 9, fim: 21 },   // terça    - 09:00 → 20:00
  3: { inicio: 9, fim: 20 },   // quarta   - 09:00 → 19:00
  4: { inicio: 9, fim: 18 },   // quinta   - 09:00 → 17:00
  5: { inicio: 9, fim: 21 },   // sexta    - 09:00 → 20:00
  6: { inicio: 9, fim: 21 },   // sábado   - 09:00 → 20:00
};

// Datas com expediente próprio, na ordem do calendário.
// Lista vazia ([]) = barbeiro não atende nesse dia.
//
// Dezembro/2026 e a folga de início de janeiro/2027, conforme definido pelo
// barbeiro. Os dias 1 a 20 de dezembro não estão aqui: seguem a grade semanal
// normal. O almoço (13:00/14:00) é inserido automaticamente nos dias que têm
// atendimento antes das 13:00 e depois das 15:00 - não precisa ser listado.
export const EXCECOES: Record<string, string[]> = {
  // Segunda, 21/12 - dia cheio
  '2026-12-21': ['08:00', '09:00', '10:00', '11:00', '12:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00'],

  // Terça, 22/12
  '2026-12-22': ['09:00', '10:00', '11:00', '12:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'],

  // Quarta, 23/12 - véspera de Natal, atende até virar o dia.
  // O '00:00' no fim da lista é a madrugada do dia 24 (ver LIMITE_MADRUGADA).
  '2026-12-23': ['08:00', '09:00', '10:00', '11:00', '12:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00', '21:00', '22:00', '23:00', '00:00'],

  // Quinta, 24/12 - Natal, meio período
  '2026-12-24': ['10:00', '11:00', '12:00', '15:00', '16:00', '17:00', '18:00', '19:00'],

  // 25, 26 e 27/12 - barbeiro não trabalha
  '2026-12-25': [],
  '2026-12-26': [],
  '2026-12-27': [],

  // 28, 29 e 30/12 - mesmo expediente nos três dias
  '2026-12-28': ['09:00', '10:00', '11:00', '12:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'],
  '2026-12-29': ['09:00', '10:00', '11:00', '12:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'],
  '2026-12-30': ['09:00', '10:00', '11:00', '12:00', '15:00', '16:00', '17:00', '18:00', '19:00', '20:00'],

  // Quinta, 31/12 - véspera de Ano Novo, fecha mais cedo
  '2026-12-31': ['10:00', '11:00', '12:00', '15:00', '16:00', '17:00'],

  // 1 a 5 de janeiro/2027 - folga
  '2027-01-01': [],
  '2027-01-02': [],
  '2027-01-03': [],
  '2027-01-04': [],
  '2027-01-05': [],
};

// Horário que pertence à virada do dia (ex.: 00:00). Precisa de tratamento
// separado porque, por texto, '00:00' é menor que qualquer outro horário -
// sem isso ele seria ordenado em primeiro e descartado como "já passou".
export function ehMadrugada(hora: string): boolean {
  // Sem esta guarda, string vazia seria "madrugada" (qualquer texto é menor
  // que '06:00' na comparação) e a tela mostraria o rótulo da virada em
  // cima de um horário que nem existe.
  if (!hora) return false;
  return hora < LIMITE_MADRUGADA;
}

export function ehAlmoco(hora: string): boolean {
  return ALMOCO.includes(hora);
}

const FORMATO_DATA = /^\d{4}-\d{2}-\d{2}$/;
const FORMATO_HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

// Data existe de verdade no calendário?
//
// Só conferir o formato não basta: '2026-13-99' passa no formato e o
// JavaScript aceita calado, transbordando para uma data válida qualquer
// ('2026-13-99' vira abril de 2027). Como EXCECOES é consultada pelo texto
// exato, uma data assim escapava da trava de dia de folga quando a rota de
// pagamento era chamada direto, sem passar pela tela. Por isso a conferência
// de ida e volta: a data remontada tem que ser idêntica à recebida.
function dataValida(data: string): boolean {
  if (typeof data !== 'string' || !FORMATO_DATA.test(data)) return false;
  const [ano, mes, dia] = data.split('-').map(Number);
  const d = new Date(ano, mes - 1, dia);
  return d.getFullYear() === ano && d.getMonth() === mes - 1 && d.getDate() === dia;
}

function horaValida(hora: string): boolean {
  return typeof hora === 'string' && FORMATO_HORA.test(hora);
}

// 'YYYY-MM-DD' -> 0 (domingo) a 6 (sábado). Monta a data em horário local,
// sem passar por UTC: new Date('2026-12-21') cairia no dia anterior.
function diaDaSemana(data: string): number {
  const [ano, mes, dia] = data.split('-');
  return new Date(Number(ano), Number(mes) - 1, Number(dia)).getDay();
}

// Todos os horários que a tela mostra para a data, já na ordem do expediente
// e incluindo o almoço (que vai riscado). Lista vazia = fechado nesse dia.
export function horariosDoDia(data: string): string[] {
  if (!dataValida(data)) return [];

  const excecao = EXCECOES[data];

  if (excecao) {
    if (excecao.length === 0) return [];

    const diurnos = excecao.filter(h => !ehMadrugada(h)).sort();
    const madrugada = excecao.filter(ehMadrugada).sort();

    // Só marca almoço se o dia realmente tem atendimento dos dois lados dele.
    const temAntes = diurnos.some(h => h < ALMOCO[0]);
    const temDepois = diurnos.some(h => h > ALMOCO[ALMOCO.length - 1]);
    const comAlmoco = temAntes && temDepois ? [...diurnos, ...ALMOCO].sort() : diurnos;

    return [...comAlmoco, ...madrugada];
  }

  const faixa = GRADE_SEMANAL[diaDaSemana(data)];
  if (!faixa) return [];

  const slots: string[] = [];
  for (let h = faixa.inicio; h < faixa.fim; h++) {
    slots.push(`${h.toString().padStart(2, '0')}:00`);
  }
  return slots;
}

// Só os horários que podem virar agendamento (sem o almoço).
export function horariosAgendaveis(data: string): string[] {
  return horariosDoDia(data).filter(h => !ehAlmoco(h));
}

// Usado como trava antes de gravar, na tela e no servidor. Qualquer data/hora
// fora da grade é recusada, mesmo que alguém monte a requisição na mão.
export function podeAgendar(data: string, hora: string): boolean {
  if (!dataValida(data) || !horaValida(hora)) return false;
  return horariosAgendaveis(data).includes(hora);
}

// Dia sem atendimento nenhum (domingo ou folga marcada em EXCECOES).
export function estaFechado(data: string): boolean {
  return horariosDoDia(data).length === 0;
}

// 'YYYY-MM-DD' -> 'DD/MM' do dia seguinte. Usado para rotular o horário de
// madrugada na tela: "00:00 - madrugada de 24/12" deixa claro que o cliente
// deve aparecer na virada da noite, e não no começo do dia que ele escolheu.
export function diaSeguinteFormatado(data: string): string {
  const [ano, mes, dia] = data.split('-');
  const seguinte = new Date(Number(ano), Number(mes) - 1, Number(dia) + 1);
  const d = seguinte.getDate().toString().padStart(2, '0');
  const m = (seguinte.getMonth() + 1).toString().padStart(2, '0');
  return `${d}/${m}`;
}

// Data de hoje em São Paulo, no mesmo formato gravado na coluna 'data'.
//
// Existe porque o caminho intuitivo está errado: new Date().toISOString()
// devolve a data em UTC, 3 horas à frente de Brasília. A partir das 21h o
// site passaria a achar que já é amanhã - e no dia 23/12, em que o
// atendimento vai até 00:00, isso tirava do ar justamente os horários da
// noite. O celular do cliente também pode estar em outro fuso, então o
// fuso é declarado explicitamente, nunca herdado do aparelho.
export function hojeEmSaoPaulo(): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
}

// Hora atual em São Paulo ('HH:MM'), para descartar horários que já passaram.
export function horaAgoraEmSaoPaulo(): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date());
}

// Último dia que o cliente pode escolher no calendário, contado a partir da
// data em São Paulo - e não da data em UTC, pelo mesmo motivo acima.
export function limiteDeAgendamento(mesesAFrente: number = 2): string {
  const [ano, mes, dia] = hojeEmSaoPaulo().split('-').map(Number);
  const limite = new Date(ano, mes - 1 + mesesAFrente, dia);
  const m = (limite.getMonth() + 1).toString().padStart(2, '0');
  const d = limite.getDate().toString().padStart(2, '0');
  return `${limite.getFullYear()}-${m}-${d}`;
}
