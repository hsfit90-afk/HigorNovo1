import './globals.css';

export const metadata = {
  title: 'Barbearia Novo de Novo',
  description: 'O seu estilo, nossa especialidade.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="pt-BR">
      <head>
        <script src="https://cdn.tailwindcss.com"></script>
      </head>
      <body className="bg-zinc-950">{children}</body>
    </html>
  );
}
