'use client';

import Link from 'next/link';
import Image from 'next/image';
import { BarChart, LogOut, Settings, Ticket, Award, Wrench } from 'lucide-react';

const menuItems = [
  { href: '/dashboard/sorteos', label: 'Sorteos', icon: Ticket },
  { href: '/dashboard/results', label: 'Resultados', icon: Award },
  { href: '/dashboard/settings', label: 'Ajustes de Negocio', icon: Wrench },
  { href: '/dashboard/app-settings', label: 'Ajustes', icon: Settings },
  { href: '/dashboard/estadisticas', label: 'Estadísticas', icon: BarChart },
  { href: '/', label: 'Salir', icon: LogOut },
];

export default function DashboardPage() {
  return (
    <div className="flex flex-col items-center justify-start min-h-screen">
      <div className="text-center mt-0 mb-4">
        <Image src="/logo.svg" alt="FinalLoto Logo" width={120} height={120} className="mx-auto mb-4" />
        <h1 className="text-5xl font-headline font-bold text-primary">FinalLoto</h1>
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
