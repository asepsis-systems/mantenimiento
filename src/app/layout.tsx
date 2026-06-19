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
    <html lang="es" className="h-full">
      <body className="h-full min-h-screen">
        {children}
      </body>
    </html>
  );
}
