'use client';

import { useState, useEffect } from "react";
import { useStateContext } from "@/context/StateContext";
import BackArrow from '@/components/BackArrow'; 
import { usePathname, useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { businessSettings } = useStateContext();
  const pathname = usePathname(); 
  const router = useRouter();
  const isDashboardHome = pathname === '/dashboard';
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleLogout = () => {
    router.push('/');
  };

  return (
    <div className="flex min-h-screen w-full flex-col">
      {isClient && !isDashboardHome && (
        <header className="sticky top-0 grid h-16 grid-cols-3 items-center border-b bg-background px-4 md:px-6 z-10">
            <div className="flex justify-start">
                <BackArrow />
            </div>

            <div className="flex justify-center">
                <div className="flex items-center gap-2">
                    {businessSettings?.logo && <img src={businessSettings.logo} alt={businessSettings.name || 'Logo'} className="h-6 w-6 rounded-full object-cover"/>}
                    {businessSettings?.name && <span className="font-semibold text-md">{businessSettings.name}</span>}
                </div>
            </div>

            <div className="flex justify-end">
                <button onClick={handleLogout} className="p-2" aria-label="Log out">
                    <LogOut className="h-6 w-6" />
                </button>
            </div>
        </header>
      )}
      <main className="flex flex-1 flex-col">
        {children}
      </main>
    </div>
  );
}
