'use client';
import React, { useMemo } from 'react';
import { useStateContext } from '@/context/StateContext';
import HeaderWrapper from "@/components/ui/HeaderWrapper";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from 'next/link';
import { iconMap } from '@/lib/icon-map';

const LotteriesPage: React.FC = () => {
    const { lotteries, specialPlays } = useStateContext();

    const combinedItems = useMemo(() => {
        const lotteryItems = lotteries.map(lottery => ({
            id: lottery.id,
            name: lottery.name,
            description: `Sorteos: ${lottery.drawTimes.join(', ')}`,
            icon: lottery.icon,
            link: `/dashboard/lotteries/${lottery.id}`,
            isSpecial: false,
        }));

        const specialPlayItems = specialPlays.map(play => {
            const applicableLotteries = lotteries.filter(l =>
                (play.appliesTo || []).some(a => a.lotteryId === l.id)
            );
            const lotteryNames = applicableLotteries.map(l => l.name).join(', ');
            return {
                id: play.id,
                name: play.name,
                description: `Aplica a: ${lotteryNames || 'Ningún sorteo'}`,
                icon: play.icon,
                link: `/dashboard/lotteries/${play.id}?special=true`,
                isSpecial: true,
            };
        });

        return [...lotteryItems, ...specialPlayItems];
    }, [lotteries, specialPlays]);

    return (
        <HeaderWrapper title="Sorteos">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {combinedItems.map((item) => {
                    const Icon = iconMap[item.icon] || iconMap.ticket;
                    return (
                        <Link href={item.link} key={item.id} className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                            <div className="flex items-center space-x-4">
                                <Icon className="w-8 h-8 text-blue-500" />
                                <div>
                                    <h3 className="text-lg font-bold">{item.name}</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400">{item.description}</p>
                                </div>
                            </div>
                        </Link>
                    )
                })}
                <Link href="/dashboard/lotteries/new" passHref>
                    <Button variant="outline" className="w-full h-full flex flex-col items-center justify-center p-6 rounded-lg border-2 border-dashed hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <Plus className="w-8 h-8 text-gray-400 mb-2" />
                        <span className="text-center">Agregar Nuevo Sorteo o Jugada Especial</span>
                    </Button>
                </Link>
            </div>
        </HeaderWrapper>
    );
};

export default LotteriesPage;
