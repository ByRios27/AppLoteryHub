"use client";

import Link from 'next/link';
import { lotteries } from '@/lib/data';
import { iconMap } from '@/lib/icon-map';
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function DashboardPage() {
  return (
    <main className="flex flex-1 flex-col gap-8 p-4 md:p-8">
      <div className="flex items-center">
        <h1 className="text-3xl font-bold font-headline">Panel Principal</h1>
      </div>
      <p className="text-muted-foreground">
        Selecciona una lotería para empezar a vender boletos.
      </p>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {lotteries.map((lottery) => {
          const Icon = iconMap[lottery.icon] || iconMap.Ticket;
          return (
            <Link href={`/dashboard/lottery/${lottery.id}`} key={lottery.id} className="group">
                 <Card className="h-full flex flex-col justify-center items-center text-center p-6 transition-all hover:bg-muted/50 hover:shadow-lg">
                  <div className="flex items-center justify-center h-20 w-20 rounded-full bg-primary/10 group-hover:scale-105 transition-transform mb-4">
                    <Icon className="h-10 w-10 text-primary" />
                  </div>
                  <CardHeader className="p-0 flex flex-col items-center">
                    <CardTitle className="font-headline text-xl">{lottery.name}</CardTitle>
                    <CardDescription>{lottery.drawTimes.join(', ')}</CardDescription>
                  </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
