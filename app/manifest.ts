import { MetadataRoute } from 'next'
 
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Barbearia Novo de Novo',
    short_name: 'Novo de Novo',
    description: 'Agende seu horário com os melhores profissionais.',
    start_url: '/',
    // Deixa explícito o que faz parte do app. Sem isso, qualquer mudança de
    // domínio faz o celular achar que o cliente saiu do app instalado - foi o
    // que aconteceu com quem instalou pelo domínio antigo (higor-novo1).
    id: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#09090b',
    theme_color: '#f59e0b',
    icons: [
      {
        src: '/icon.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
