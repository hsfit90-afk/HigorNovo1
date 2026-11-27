// Aviso ao barbeiro pelo WhatsApp do cliente.
//
// Não existe um caminho único que funcione em todo celular, então são dois,
// em sequência:
//
//   1. whatsapp://  - o celular entrega direto ao aplicativo instalado. É o
//      único que não trava quando o site está rodando como app instalado
//      (standalone), onde o wa.me fica carregando para sempre tentando
//      repassar para o aplicativo. Só que nem todo aparelho atende esse
//      atalho - depende de qual WhatsApp está instalado e da versão. Quando
//      não atende, NADA acontece: sem erro, sem aviso, e o barbeiro nunca
//      recebe. Era o que acontecia com quem não tinha o WhatsApp Business.
//
//   2. wa.me - link universal, funciona em qualquer WhatsApp. Entra como
//      plano B quando o atalho acima não foi atendido.
//
// Mesmo com os dois, quem aperta enviar é sempre o cliente. Por isso as
// telas também mostram um botão de reserva com montarLinkWhatsApp: toque
// direto em link é o caminho mais confiável que existe, nenhum celular
// bloqueia. O painel do admin continua sendo a fonte da verdade.

export const NUMERO_BARBEIRO = '5511953676910';

// Espera antes de concluir que nenhum aplicativo assumiu o atalho. Curto o
// bastante para não parecer travado, longo o bastante para caber a janela de
// confirmação que alguns celulares mostram antes de abrir o aplicativo.
const ESPERA_APP_ASSUMIR_MS = 1500;

export function montarLinkWhatsApp(texto: string, numero: string = NUMERO_BARBEIRO): string {
  return `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
}

export function abrirWhatsAppNoCelular(texto: string, numero: string = NUMERO_BARBEIRO): void {
  const linkWeb = montarLinkWhatsApp(texto, numero);
  const linkApp = `whatsapp://send?phone=${numero}&text=${encodeURIComponent(texto)}`;

  let timer = 0;
  let encerrado = false;

  const encerrar = () => {
    if (encerrado) return;
    encerrado = true;
    window.clearTimeout(timer);
    document.removeEventListener('visibilitychange', aoTrocarVisibilidade);
    window.removeEventListener('pagehide', encerrar);
  };

  // Página escondida significa que o WhatsApp assumiu a tela: o plano B
  // deixa de ser necessário e abri-lo só atrapalharia na volta.
  const aoTrocarVisibilidade = () => {
    if (document.visibilityState === 'hidden') encerrar();
  };

  timer = window.setTimeout(() => {
    const aindaNaTela = document.visibilityState === 'visible';
    encerrar();
    if (aindaNaTela) window.location.href = linkWeb;
  }, ESPERA_APP_ASSUMIR_MS);

  document.addEventListener('visibilitychange', aoTrocarVisibilidade);
  window.addEventListener('pagehide', encerrar);

  window.location.href = linkApp;
}
