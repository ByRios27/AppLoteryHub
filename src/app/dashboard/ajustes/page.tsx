'use client';

import { Wrench } from 'lucide-react';
import DashboardHeader from '@/components/ui/DashboardHeader';

export default function AjustesPage() {
  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
        <DashboardHeader title="Ajustes" />
        <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
            <div className="flex flex-col items-center gap-1 text-center">
                <Wrench className="h-16 w-16 text-muted-foreground" />
                <h3 className="text-2xl font-bold tracking-tight mt-4">
                    En Construcción
                </h3>
                <p className="text-sm text-muted-foreground">
                    La página de Ajustes está en construcción.
                </p>
            </div>
        </div>
    </main>
  );
}
