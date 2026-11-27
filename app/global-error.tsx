'use client';

// Última linha de defesa: usada quando o erro acontece no próprio layout
// raiz, caso em que o app/error.tsx nem chega a ser montado.
//
// Este arquivo SUBSTITUI o layout raiz, então precisa trazer as próprias
// tags <html> e <body>. Por isso tudo aqui é estilo embutido, e não Tailwind:
// o globals.css é importado pelo layout que acabou de falhar, então não há
// garantia nenhuma de que alguma classe CSS esteja disponível. Estilo
// embutido é o único que funciona em qualquer cenário - e justamente nesta
// tela não dá pra arriscar, porque a alternativa é a tela branca.

export default function ErroGlobal({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pt-BR">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          backgroundColor: '#09090b',
          color: '#fafafa',
          fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, sans-serif',
        }}
      >
        <div
          style={{
            maxWidth: '384px',
            width: '100%',
            backgroundColor: '#18181b',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '32px',
            padding: '32px',
            textAlign: 'center',
            boxSizing: 'border-box',
          }}
        >
          <h1 style={{ fontSize: '20px', fontWeight: 900, margin: '0 0 8px' }}>
            Algo deu errado
          </h1>
          <p style={{ fontSize: '14px', color: '#a1a1aa', margin: '0 0 32px', lineHeight: 1.5 }}>
            Não conseguimos carregar o aplicativo. Tente de novo — se continuar,
            chame a barbearia pelo WhatsApp que a gente resolve seu horário.
          </p>

          <button
            onClick={reset}
            style={{
              width: '100%',
              padding: '12px 24px',
              backgroundColor: '#2563eb',
              color: '#09090b',
              border: 'none',
              borderRadius: '9999px',
              fontWeight: 700,
              fontSize: '15px',
              cursor: 'pointer',
            }}
          >
            Tentar de novo
          </button>

          <a
            href="/"
            style={{
              display: 'block',
              marginTop: '12px',
              padding: '12px 24px',
              backgroundColor: 'rgba(255,255,255,0.05)',
              color: '#d4d4d8',
              borderRadius: '9999px',
              fontWeight: 700,
              fontSize: '15px',
              textDecoration: 'none',
            }}
          >
            Voltar ao início
          </a>

          {error.digest && (
            <p style={{ marginTop: '24px', fontSize: '11px', color: '#52525b', fontFamily: 'monospace' }}>
              código: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  );
}
