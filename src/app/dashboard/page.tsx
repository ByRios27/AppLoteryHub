'use client';

import { useStateContext } from '@/context/StateContext';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { iconMap } from '@/lib/icon-map';

export default function DashboardPage() {
  const { lotteries } = useStateContext();

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-6">Loterías Disponibles</h1>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {lotteries.map((lottery) => {
             const Icon = lottery.icon.startsWith('data:image') ? null : iconMap[lottery.icon as keyof typeof iconMap] || iconMap.Ticket;
             return (
                <Link href={`/dashboard/lotteries/${lottery.id}`} key={lottery.id} passHref>
                  <div className="flex flex-col items-center justify-center gap-3 transition-transform duration-300 ease-in-out hover:scale-105 cursor-pointer">
                    <Card className="w-28 h-28 sm:w-32 sm:h-32 rounded-full shadow-lg hover:shadow-xl flex items-center justify-center bg-card overflow-hidden">
                      <CardContent className="p-0 flex items-center justify-center">
                        {Icon ? (
                            <Icon className="w-16 h-16 text-primary" />
                        ) : (
                             <img src={lottery.icon} alt={lottery.name} className="w-full h-full object-cover" />
                        )}
                      </CardContent>
                    </Card>
                    <span className="font-semibold text-center text-foreground">{lottery.name}</span>
                  </div>
                </Link>
             )
          })}
        </div>
      </div>
    </div>
  );
}
