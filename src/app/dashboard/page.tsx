'use client';

import Link from 'next/link';
import Image from 'next/image';
import { BarChart, LogOut, Settings, Ticket, Award, Store } from 'lucide-react';
import { useStateContext } from '@/context/StateContext';
import { useEffect, useState } from 'react';

const menuItems = [
  { href: '/dashboard/sorteos', label: 'Sorteos', icon: Ticket },
  { href: '/dashboard/results', label: 'Resultados', icon: Award },
  { href: '/dashboard/settings', label: 'Ajustes de Negocio', icon: Store },
  { href: '/dashboard/app-settings', label: 'Ajustes', icon: Settings },
  { href: '/dashboard/estadisticas', label: 'Estadísticas', icon: BarChart },
  { href: '/', label: 'Salir', icon: LogOut },
];

export default function DashboardPage() {
  const { businessSettings } = useStateContext();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div className="flex flex-col items-center justify-start min-h-screen">
      <div className="text-center mt-0 mb-4">
        {isClient ? (
          <Image src={businessSettings.logo || "/logo.svg"} alt="Logo" width={120} height={120} className="mx-auto mb-4" />
        ) : (
          <div className="w-[120px] h-[120px] mx-auto mb-4 bg-gray-200 animate-pulse" />
        )}
        <h1 className="text-5xl font-headline font-bold text-primary">{isClient ? businessSettings.name : "FinalLoto"}</h1>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-12 p-4">
        {menuItems.map(({ href, label, icon: Icon }) => (
          <Link href={href} key={href}>
            <div className="flex flex-col items-center justify-center text-center w-32">
              <Icon className="h-16 w-16 mb-2 text-primary" strokeWidth={1.5} />
              <span className="text-center text-base font-medium text-primary">{label}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
