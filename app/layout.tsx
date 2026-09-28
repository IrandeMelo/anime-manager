import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AnimeTrack',
  description: 'Gerencie seus animes, temporadas, episódios e status.'
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
