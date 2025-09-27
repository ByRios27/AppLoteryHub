"use client";

import { useState } from 'react';
import Link from 'next/link';
import { lotteries as initialLotteries, type Lottery } from '@/lib/data';
import { Card, CardContent } from '@/components/ui/card';
import { iconMap } from '@/lib/icon-map';

export default function DashboardPage() {
  const [lotteries, setLotteries] = useState<Lottery[]>(initialLotteries);

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center">
        <h1 className="text-3xl font-bold font-headline">Selección de Lotería</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {lotteries.map((lottery) => {
          const Icon = iconMap[lottery.icon] || iconMap.Ticket;
          return (
            <Link href={`/dashboard/lottery/${lottery.id}`} key={lottery.id} className="group">
              <Card className="hover:bg-primary/10 hover:border-primary transition-colors h-full flex flex-col justify-center items-center text-center p-6">
                <div className="flex items-center justify-center h-20 w-20 rounded-full bg-primary/20 group-hover:bg-primary/30 mb-4 transition-colors">
                  <Icon className="h-10 w-10 text-primary" />
                </div>
                <CardContent className="p-0 flex flex-col items-center">
                  <h3 className="font-headline text-xl font-semibold text-foreground">{lottery.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{lottery.drawTimes.length > 1 ? `${lottery.drawTimes.length} sorteos hoy` : lottery.drawTimes[0]}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </main>
  );
}
