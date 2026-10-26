import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Integrado de Gestión - Konecta',
  description: 'Plataforma Operativa de Control y Gestión - Konecta BPO',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className="antialiased selection:bg-konecta-blue selection:text-white">
        {children}
      </body>
    </html>
  );
}
