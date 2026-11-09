import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Reportes de Mantenimiento - Asepsis Systems',
  description: 'Sistema premium para la creación, edición, gestión y exportación de reportes semanales de mantenimiento.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className="h-full dark">
      <body className="h-full min-h-screen bg-[#080d1a] text-slate-100 antialiased selection:bg-cyan-500/30 selection:text-cyan-200">
        {children}
      </body>
    </html>
  );
}
