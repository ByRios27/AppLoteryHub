import type { Metadata } from 'next';
import { Toaster } from "sonner";
import './globals.css';
import { cn } from '@/lib/utils';
import { StateContextProvider } from '@/context/StateContext';

export const metadata: Metadata = {
  title: 'Lotto Hub',
  description: 'Your central hub for lottery management.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;700&family=PT+Sans:wght@400;700&display=swap" rel="stylesheet" />
      </head>
      <body className={cn("font-body antialiased")}>
        <StateContextProvider>
          {children}
        </StateContextProvider>
        <Toaster richColors />
      </body>
    </html>
  );
}
