import type { Metadata, Viewport } from 'next';
import '@fontsource/fraunces/600.css';
import '@fontsource/fraunces/700.css';
import '@fontsource/fraunces/800.css';
import '@fontsource/fraunces/600-italic.css';
import '@fontsource/fraunces/700-italic.css';
import '@fontsource/manrope/400.css';
import '@fontsource/manrope/500.css';
import '@fontsource/manrope/600.css';
import '@fontsource/manrope/700.css';
import '@fontsource/manrope/800.css';
import './globals.css';
import { evento } from '@/lib/evento';

export const metadata: Metadata = {
  metadataBase: new URL(evento.siteUrl),
  title: { default: `${evento.nome} – ${evento.cidade}`, template: `%s | ${evento.nome}` },
  description: `${evento.chamada} ${evento.data}, ${evento.horario}, ${evento.local}.`,
  openGraph: {
    title: `${evento.nome} – ${evento.cidade}`,
    description: `${evento.dataCurta}, ${evento.horario}, ${evento.local}. Faça sua inscrição.`,
    images: ['/convite.jpg'],
    locale: 'pt_BR',
    type: 'website',
  },
  appleWebApp: { title: 'Violeiros', statusBarStyle: 'default' },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#f3e8d2',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
