'use client';

import { useStateContext } from '@/context/StateContext';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from '@/components/ui/card';

export default function DashboardPage() {
  const { lotteries } = useStateContext();

  return (
    <div className="min-h-screen bg-teal-50/50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">Loterías Disponibles</h1>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
          {lotteries.map((lottery) => (
            <Link href={`/dashboard/sales?lotteryId=${lottery.id}`} key={lottery.id} passHref>
              <div className="flex flex-col items-center justify-center gap-3 transition-transform duration-300 ease-in-out hover:scale-105 cursor-pointer">
                <Card className="w-28 h-28 sm:w-32 sm:h-32 rounded-full shadow-lg hover:shadow-xl flex items-center justify-center bg-white overflow-hidden">
                  <CardContent className="p-0">
                    {lottery.logo ? (
                      <Image
                        src={lottery.logo}
                        alt={`${lottery.name} Logo`}
                        width={128}
                        height={128}
                        className="object-cover w-full h-full"
                      />
                    ) : (
                      <span className="text-lg font-bold text-gray-600">{lottery.name.charAt(0)}</span>
                    )}
                  </CardContent>
                </Card>
                <span className="font-semibold text-center text-gray-700">{lottery.name}</span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
