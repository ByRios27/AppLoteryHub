import { ReactNode } from 'react';

// Este es un layout aislado para la página de verificación.
// No incluye ninguna navegación del dashboard, asegurando que los usuarios
// que accedan a través del enlace de verificación no puedan navegar a otras partes del sitio.
export default function VerifyLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="es">
      <body>
        {children}
      </body>
    </html>
  );
}
