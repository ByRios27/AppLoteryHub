'use client';

import { ReactNode } from 'react';
import { StateContextProvider } from '@/context/StateContext';
import { Header } from '@/components/ui/header';

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className="dark">
      <body className="font-body antialiased">
        <StateContextProvider>
          <Header />
          <main>{children}</main>
        </StateContextProvider>
      </body>
    </html>
  );
}
