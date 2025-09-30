''''use client';

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LogOut,
  PanelLeft,
  LayoutGrid,
  Trophy,
  Settings,
  QrCode,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { Header } from "@/components/ui/header"; // Importar el nuevo Header

const NAV_ITEMS = [
  { href: "/dashboard/lotteries", label: "Loterías", icon: LayoutGrid },
  { href: "/dashboard/results", label: "Resultados", icon: Trophy },
  { href: "/dashboard/verify", label: "Verificar", icon: QrCode },
  { href: "/dashboard/settings", label: "Ajustes", icon: Settings },
];

function NavLink({ href, label, icon: Icon, isActive }: { href: string; label: string; icon: React.ElementType; isActive: boolean; }) {
  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-muted-foreground transition-all hover:text-primary",
        isActive && "bg-muted text-primary"
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isActive = (path: string) => pathname.startsWith(path);

  const desktopNav = (
    <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
      {NAV_ITEMS.map((item) => (
        <NavLink key={item.href} {...item} isActive={isActive(item.href)} />
      ))}
    </nav>
  );

  const mobileNav = (
    <nav className="grid gap-2 text-lg font-medium mt-6">
      {NAV_ITEMS.map((item) => (
        <NavLink key={item.href} {...item} isActive={isActive(item.href)} />
      ))}
    </nav>
  );

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      {/* Barra lateral para escritorio */}
      <div className="hidden border-r bg-muted/40 md:block">
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center border-b px-4 lg:h-[60px] lg:px-6">
            {/* El logo ahora está en el Header global */}
          </div>
          <div className="flex-1">
            {desktopNav}
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="flex flex-col">
        <header className="flex h-14 items-center gap-4 border-b bg-muted/40 px-4 lg:h-[60px] lg:px-6">
          {/* Botón de menú para móvil */}
          <Sheet>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="shrink-0 md:hidden"
              >
                <PanelLeft className="h-5 w-5" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="flex flex-col">
              <Header /> 
              {mobileNav}
            </SheetContent>
          </Sheet>
          
          {/* Header con logo (visible en móvil, centrado en desktop) */}
          <div className="w-full flex-1">
            <div className="md:hidden">
                <Header/>
            </div>
             <div className="hidden md:flex justify-center">
                <Header/>
            </div>
          </div>

          {/* Menú de usuario */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="secondary" size="icon" className="rounded-full">
                <Avatar className="h-8 w-8">
                  <AvatarImage src="https://i.pravatar.cc/150?u=admin" alt="@admin" />
                  <AvatarFallback>A</AvatarFallback>
                </Avatar>
                <span className="sr-only">Toggle user menu</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Mi Cuenta</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/settings">Ajustes</Link>
              </DropdownMenuItem>
              <DropdownMenuItem>Soporte</DropdownMenuItem>
              <DropdownMenuSeparator />
               <DropdownMenuItem asChild>
                  <Link href="/">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Cerrar Sesión</span>
                  </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </header>

        <main className="flex flex-1 flex-col gap-4 p-4 lg:gap-6 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
'''