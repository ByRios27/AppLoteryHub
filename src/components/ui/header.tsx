'use client';

import Link from 'next/link';
import { Clover } from 'lucide-react';
import { useStateContext } from '@/context/StateContext';

export default function Header() {
  const { appCustomization } = useStateContext();

  return (
    <header className="flex justify-center items-center py-4 px-4 bg-background border-b">
      <Link href="/" className="flex items-center gap-2 font-semibold">
        {appCustomization.appLogo ? (
          <img src={appCustomization.appLogo} alt={appCustomization.appName} className="h-8 w-8" />
        ) : (
          <Clover className="h-8 w-8 text-primary" />
        )}
        <span className="font-headline text-xl">{appCustomization.appName}</span>
      </Link>
    </header>
  );
}
