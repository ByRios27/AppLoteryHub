'''import { ReactNode } from 'react';
import { Header } from '@/components/ui/header';

// Este es un layout aislado para la página de verificación.
// Incluye la cabecera de la marca para consistencia visual, pero no ofrece
// navegación adicional, manteniendo al usuario en esta página.
export default function VerifyLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>
        <Header />
        {children}
      </body>
    </html>
  );
}
'''