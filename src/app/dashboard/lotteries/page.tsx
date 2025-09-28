'use client';

import { useStateContext } from '@/context/StateContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function LotteriesPage() {
  const { lotteries } = useStateContext();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {lotteries.map((lottery) => (
        <Card key={lottery.id}>
          <CardHeader>
            <CardTitle>{lottery.name}</CardTitle>
            <CardDescription>Sorteos: {lottery.drawTimes.join(', ')}</CardDescription>
          </CardHeader>
          <CardContent>
            <p>Juega tus números de {lottery.numberOfDigits} cifras y gana.</p>
          </CardContent>
          <CardFooter>
            <Link href={`/dashboard/sales?lotteryId=${lottery.id}`} passHref>
              <Button className="w-full">
                Realizar Venta
                <ArrowRight className="ml-2" />
              </Button>
            </Link>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}
