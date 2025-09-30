'use client';

import { ReactNode } from 'react';
import { StateContextProvider } from '@/context/StateContext';
import { Header } from '@/components/ui/header';
import HeaderWrapper from '@/components/ui/HeaderWrapper';

interface RootLayoutProps {
  children: ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  return (
    <html lang="en" className="dark">
      <body className="font-body antialiased">
        <StateContextProvider>
          <HeaderWrapper>
            <Header />
          </HeaderWrapper>
          <main>{children}</main>
        </StateContextProvider>
      </body>
    </html>
  );
}
