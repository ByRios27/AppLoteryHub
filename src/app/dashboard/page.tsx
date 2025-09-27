"use client";

import { useState } from 'react';
import Link from 'next/link';
import { lotteries as initialLotteries, type Lottery } from '@/lib/data';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowRight } from 'lucide-react';

export default function DashboardPage() {
  const [lotteries, setLotteries] = useState<Lottery[]>(initialLotteries);

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center">
        <h1 className="text-3xl font-bold font-headline">Lottery Selection</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {lotteries.map((lottery) => (
          <Link href={`/dashboard/lottery/${lottery.id}`} key={lottery.id} className="group">
            <Card className="hover:bg-card/80 hover:border-primary transition-colors h-full flex flex-col">
              <CardHeader className="flex-1">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-4">
                     <lottery.Icon className="h-10 w-10 text-primary" />
                     <div>
                       <CardTitle className="font-headline text-xl">{lottery.name}</CardTitle>
                       <CardDescription>{lottery.drawTimes.length > 1 ? `${lottery.drawTimes.length} draws today` : lottery.drawTimes[0]}</CardDescription>
                     </div>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </div>
              </CardHeader>
            </Card>
          </Link>
        ))}
      </div>
    </main>
  );
}
