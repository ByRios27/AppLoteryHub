'use client';

import Link from "next/link";
import { useState, useEffect } from "react";
import { useStateContext } from "@/context/StateContext";
import BackArrow from '@/components/BackArrow'; 
import { usePathname } from 'next/navigation'; 

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { businessSettings } = useStateContext();
  const pathname = usePathname(); 
  const isDashboardHome = pathname === '/dashboard';
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div className="flex min-h-screen w-full flex-col">
        <header className="sticky top-0 grid h-16 grid-cols-3 items-center border-b bg-background px-4 md:px-6 z-10">
            {/* Left Column */}
            <div className="flex justify-start">
                {isClient && (
                    isDashboardHome ? (
                        <Link href="/dashboard" passHref>
                            <div className="flex items-center gap-2 cursor-pointer">
                                {businessSettings?.logo && <img src={businessSettings.logo} alt={businessSettings.name || 'Logo'} className="h-8 w-8 rounded-full object-cover"/>}
                                {businessSettings?.name && <span className="font-bold text-lg">{businessSettings.name}</span>}
                            </div>
                        </Link>
                    ) : (
                        <BackArrow />
                    )
                )}
            </div>

            {/* Center Column */}
            <div className="flex justify-center">
                {isClient && !isDashboardHome && (
                    <div className="flex items-center gap-2">
                        {businessSettings?.logo && <img src={businessSettings.logo} alt={businessSettings.name || 'Logo'} className="h-6 w-6 rounded-full object-cover"/>}
                        {businessSettings?.name && <span className="font-semibold text-md">{businessSettings.name}</span>}
                    </div>
                )}
            </div>

            {/* Right Column (empty placeholder) */}
            <div></div>
        </header>
      <main className="flex flex-1 flex-col">
        {children}
      </main>
    </div>
  );
}
