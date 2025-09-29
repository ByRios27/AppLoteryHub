'use client';

import { useMemo } from 'react';
import { useStateContext } from '@/context/StateContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { iconMap } from '@/lib/icon-map';

export default function LotteriesPage() {
  const { lotteries, specialPlays } = useStateContext();

  const displayItems = useMemo(() => {
    const lotteryItems = lotteries.map(lottery => ({
      id: lottery.id,
      name: lottery.name,
      description: `Sorteos: ${lottery.drawTimes.join(', ')}`,
      icon: lottery.icon,
      numberOfDigits: lottery.numberOfDigits,
      link: `/dashboard/lotteries/${lottery.id}`,
      isSpecial: false,
    }));

    const specialPlayItems = specialPlays.map(play => {
        const applicableLotteries = lotteries.filter(l => play.appliesTo.some(a => a.lotteryId === l.id));
        const lotteryNames = applicableLotteries.map(l => l.name).join(', ');
        return {
            id: play.id,
            name: play.name,
            description: `Aplica a: ${lotteryNames || 'Ningún sorteo'}`,
            icon: play.icon,
            numberOfDigits: play.numberOfDigits,
            link: `/dashboard/lotteries/${play.id}?special=true`,
            isSpecial: true,
        };
    });

    return [...lotteryItems, ...specialPlayItems];
  }, [lotteries, specialPlays]);

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {displayItems.map((item) => {
          const Icon = item.icon.startsWith('data:image') ? null : iconMap[item.icon as keyof typeof iconMap] || iconMap.Ticket;
          return (
            <Card key={item.id}>
              <CardHeader className="items-center text-center">
                {Icon ? (
                  <Icon className="w-16 h-16 text-primary mb-2" />
                ) : (
                  <img src={item.icon} alt={item.name} className="w-16 h-16 rounded-full object-cover mb-2" />
                )}
                <CardTitle className="font-headline">{item.name}</CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-center text-sm text-muted-foreground">Juega tus números de {item.numberOfDigits} cifras y gana.</p>
              </CardContent>
              <CardFooter>
                <Link href={item.link} passHref className="w-full">
                  <Button className="w-full">
                    Realizar Venta
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </main>
  );
}
