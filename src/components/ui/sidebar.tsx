'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Settings, Package, ShoppingCart, BarChart2, CheckSquare, LogOut } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';

const navLinks = [
  { href: '/dashboard', icon: Home, label: 'Inicio' },
  {
    label: 'Sorteos',
    icon: Package,
    subLinks: [
      { href: '/dashboard/sorteos', label: 'Disponibles' },
      { href: '/dashboard/results', label: 'Resultados' },
    ],
  },
  { href: '/dashboard/verificacion', icon: CheckSquare, label: 'Verificación' },
  { href: '/dashboard/estadisticas', icon: BarChart2, label: 'Estadísticas' },
  { href: '/dashboard/settings', icon: Settings, label: 'Ajustes de Negocio' },
  { href: '/dashboard/ajustes', icon: Settings, label: 'Ajustes' },
];

export function Sidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => pathname === href;
  const isPartiallyActive = (basePath: string) => pathname.startsWith(basePath);

  return (
    <aside className="fixed inset-y-0 left-0 z-10 hidden w-14 flex-col border-r bg-background sm:flex">
      <nav className="flex flex-col items-center gap-4 px-2 sm:py-5">
        <Link href="/dashboard" className="group flex h-9 w-9 shrink-0 items-center justify-center gap-2 rounded-full bg-primary text-lg font-semibold text-primary-foreground md:h-8 md:w-8 md:text-base">
          <ShoppingCart className="h-4 w-4 transition-all group-hover:scale-110" />
          <span className="sr-only">Lotto Seller</span>
        </Link>
        <TooltipProvider>
          {navLinks.map((link) =>
            link.subLinks ? (
              <Accordion type="single" collapsible className="w-full" key={link.label}>
                <AccordionItem value="item-1" className="border-none">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <AccordionTrigger className={`flex h-9 w-9 items-center justify-center rounded-lg ${isPartiallyActive('/dashboard/sorteos') || isPartiallyActive('/dashboard/results') ? 'text-accent-foreground bg-accent' : 'text-muted-foreground'} transition-colors hover:text-foreground md:h-8 md:w-8`}>
                        <link.icon className="h-5 w-5" />
                        <span className="sr-only">{link.label}</span>
                      </AccordionTrigger>
                    </TooltipTrigger>
                    <TooltipContent side="right">{link.label}</TooltipContent>
                  </Tooltip>
                  <AccordionContent className="absolute left-14 mt-2 w-40 rounded-md border bg-popover p-2 shadow-md">
                    {link.subLinks.map((subLink) => (
                      <Link key={subLink.href} href={subLink.href} className={`block px-3 py-2 text-sm rounded-md ${isActive(subLink.href) ? 'bg-accent' : ''} hover:bg-accent`}>
                        {subLink.label}
                      </Link>
                    ))}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            ) : (
              <Tooltip key={link.href}>
                <TooltipTrigger asChild>
                  <Link href={link.href} className={`flex h-9 w-9 items-center justify-center rounded-lg ${isActive(link.href) ? 'text-accent-foreground bg-accent' : 'text-muted-foreground'} transition-colors hover:text-foreground md:h-8 md:w-8`}>
                    <link.icon className="h-5 w-5" />
                    <span className="sr-only">{link.label}</span>
                  </Link>
                </TooltipTrigger>
                <TooltipContent side="right">{link.label}</TooltipContent>
              </Tooltip>
            )
          )}
        </TooltipProvider>
      </nav>
      <nav className="mt-auto flex flex-col items-center gap-4 px-2 sm:py-5">
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                <Link
                    href="/"
                    className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:text-foreground md:h-8 md:w-8"
                >
                    <LogOut className="h-5 w-5" />
                    <span className="sr-only">Cerrar Sesión</span>
                </Link>
                </TooltipTrigger>
                <TooltipContent side="right">Cerrar Sesión</TooltipContent>
            </Tooltip>
        </TooltipProvider>
      </nav>
    </aside>
  );
}
