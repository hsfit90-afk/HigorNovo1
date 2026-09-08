// Lista de serviços e preço, compartilhada entre a página de agendamento
// (app/page.tsx) e a página de retorno do pagamento do sinal
// (app/agendamento/retorno), pra manter os dois em sincronia.
export const servicos = [
  { nome: 'Pezinho', preco: 'R$ 15', categoria: 'Básico' },
  { nome: 'Sobrancelha', preco: 'R$ 10', categoria: 'Básico' },
  { nome: 'Bigode', preco: 'R$ 10', categoria: 'Básico' },
  { nome: 'Sobrancelha e Bigode', preco: 'R$ 15', categoria: 'Básico' },
  { nome: 'Barba', preco: 'R$ 25', categoria: 'Básico' },
  { nome: 'Cabelo', preco: 'R$ 35', categoria: 'Básico' },
  { nome: 'Cabelo e Barba', preco: 'R$ 50', categoria: 'Básico' },
  { nome: 'Platinado', preco: 'R$ 100', categoria: 'Químicas' },
  { nome: 'Luzes', preco: 'R$ 70', categoria: 'Químicas' },
  { nome: 'Alisante', preco: 'R$ 40', categoria: 'Químicas' },
  { nome: 'Hidratação', preco: 'R$ 30', categoria: 'Químicas' },
  { nome: 'Pigmentação', preco: 'R$ 20', categoria: 'Químicas' },
];

export const VALOR_SINAL_REAIS = 10;

// "R$ 35" -> 35
function parsePreco(preco: string): number {
  const numero = Number(preco.replace(/[^\d,.-]/g, '').replace(',', '.'));
  return Number.isFinite(numero) ? numero : 0;
}

// Soma o preço dos serviços pelo nome. Aceita tanto um array de nomes
// (["Cabelo", "Barba"]) quanto a string já formatada ("Cabelo + Barba").
export function calcularTotalServicos(servicosSelecionados: string[] | string): number {
  const nomes = Array.isArray(servicosSelecionados)
    ? servicosSelecionados
    : servicosSelecionados.split(' + ');

  return nomes.reduce((total, nome) => {
    const encontrado = servicos.find(s => s.nome === nome.trim());
    return total + (encontrado ? parsePreco(encontrado.preco) : 0);
  }, 0);
}

export function formatarReais(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
}
