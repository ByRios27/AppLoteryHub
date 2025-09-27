"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Clover, LogOut, PanelLeft, LayoutGrid, Trophy, Settings } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
  SidebarInset,
  useSidebar,
} from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

function MainHeader() {
  const { toggleSidebar } = useSidebar();
  return (
    <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
      <Button
        variant="ghost"
        size="icon"
        className="md:hidden"
        onClick={toggleSidebar}
      >
        <PanelLeft />
        <span className="sr-only">Toggle Sidebar</span>
      </Button>
      <div className="flex w-full items-center justify-end gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-8 w-8 rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage src="https://i.pravatar.cc/150?u=admin" alt="@admin" />
                <AvatarFallback>A</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" forceMount>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">Admin</p>
                <p className="text-xs leading-none text-muted-foreground">
                  admin@lottohub.com
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Log out</span>
              </Link>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

function MainSidebar() {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <Sidebar>
      <SidebarHeader>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-10 w-10 text-primary">
            <Clover className="h-8 w-8" />
          </Button>
          <span className="truncate text-lg font-headline font-semibold">Lotto Hub</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          <SidebarMenuItem>
            <Link href="/dashboard" legacyBehavior passHref>
              <SidebarMenuButton isActive={isActive('/dashboard')}
                className={cn(isActive('/dashboard') && "bg-primary/20 text-primary hover:bg-primary/25 hover:text-primary")}
                >
                <LayoutGrid />
                Dashboard
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Link href="/dashboard/results" legacyBehavior passHref>
              <SidebarMenuButton isActive={isActive('/dashboard/results')}
                 className={cn(isActive('/dashboard/results') && "bg-primary/20 text-primary hover:bg-primary/25 hover:text-primary")}
                >
                <Trophy />
                Results
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <Link href="/dashboard/settings" legacyBehavior passHref>
              <SidebarMenuButton isActive={isActive('/dashboard/settings')}
                 className={cn(isActive('/dashboard/settings') && "bg-primary/20 text-primary hover:bg-primary/25 hover:text-primary")}
                >
                <Settings />
                Settings
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
         <div className="flex items-center gap-2 p-2">
             <Avatar className="h-8 w-8">
                <AvatarImage src="https://i.pravatar.cc/150?u=admin" alt="@admin" />
                <AvatarFallback>A</AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-sm font-medium">Admin</span>
                <span className="text-xs text-muted-foreground">admin</span>
              </div>
         </div>
      </SidebarFooter>
    </Sidebar>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full">
        <MainSidebar />
        <div className="flex-1 flex flex-col">
          <MainHeader />
          <SidebarInset>{children}</SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}
