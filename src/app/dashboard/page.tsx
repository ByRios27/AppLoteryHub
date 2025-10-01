'use client';

import { useMemo } from 'react';
import { useStateContext } from '@/context/StateContext';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { iconMap } from '@/lib/icon-map';

export default function DashboardPage() {
  const { lotteries, specialPlays } = useStateContext();

  const combinedItems = useMemo(() => {
    const lotteryItems = lotteries.map(item => ({ 
        ...item, 
        link: `/dashboard/lotteries/${item.id}` 
    }));
    const specialPlayItems = specialPlays.map(item => ({ 
        ...item, 
        link: `/dashboard/lotteries/${item.id}?special=true`
    }));
    return [...lotteryItems, ...specialPlayItems];
  }, [lotteries, specialPlays]);

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-6">Sorteos Disponibles</h1>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {combinedItems.map((item) => {
             const Icon = item.icon && !item.icon.startsWith('data:image') 
                ? iconMap[item.icon as keyof typeof iconMap] || iconMap.ticket
                : null;
             return (
                <Link href={item.link} key={item.id} passHref>
                  <div className="flex flex-col items-center justify-center gap-3 transition-transform duration-300 ease-in-out hover:scale-105 cursor-pointer">
                    <Card className="w-28 h-28 sm:w-32 sm:h-32 rounded-full shadow-lg hover:shadow-xl flex items-center justify-center bg-card overflow-hidden">
                      <CardContent className="p-0 flex items-center justify-center">
                        {Icon ? (
                            <Icon className="w-16 h-16 text-primary" />
                        ) : (
                             <img src={item.icon || '/placeholder.svg'} alt={item.name} className="w-full h-full object-cover" />
                        )}
                      </CardContent>
                    </Card>
                    <span className="font-semibold text-center text-foreground">{item.name}</span>
                  </div>
                </Link>
             )
          })}
        </div>
      </div>
    </div>
  );
}
