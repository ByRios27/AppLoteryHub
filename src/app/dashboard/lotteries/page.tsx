'use client';

import { useStateContext } from '@/context/StateContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { iconMap } from '@/lib/icon-map';

export default function LotteriesPage() {
  const { lotteries } = useStateContext();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {lotteries.map((lottery) => {
        const Icon = lottery.icon.startsWith('data:image') ? null : iconMap[lottery.icon as keyof typeof iconMap] || iconMap.Ticket;
        return (
          <Card key={lottery.id}>
            <CardHeader className="items-center text-center">
              {Icon ? (
                <Icon className="w-16 h-16 text-primary mb-2" />
              ) : (
                <img src={lottery.icon} alt={lottery.name} className="w-16 h-16 rounded-full object-cover mb-2" />
              )}
              <CardTitle>{lottery.name}</CardTitle>
              <CardDescription>Sorteos: {lottery.drawTimes.join(', ')}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-center">Juega tus números de {lottery.numberOfDigits} cifras y gana.</p>
            </CardContent>
            <CardFooter>
              <Link href={`/dashboard/lotteries/${lottery.id}`} passHref className="w-full">
                <Button className="w-full">
                  Realizar Venta
                  <ArrowRight className="ml-2" />
                </Button>
              </Link>
            </CardFooter>
          </Card>
        );
      })}
    </div>
  );
}
