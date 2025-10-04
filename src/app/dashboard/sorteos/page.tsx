'use client';
import React, { useMemo } from 'react';
import { useStateContext } from '@/context/StateContext';
import DashboardHeader from "@/components/ui/DashboardHeader";
import Link from 'next/link';
import { iconMap } from '@/lib/icon-map';

const SorteosPage: React.FC = () => {
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

        // Filter for enabled special plays ONLY
        const specialPlayItems = specialPlays
            .filter(play => play.enabled)
            .map(play => {
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
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            <DashboardHeader title="Sorteos" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 pt-4">
                {combinedItems.map((item) => {
                    const Icon = iconMap[item.icon as keyof typeof iconMap] || iconMap.ticket;
                    return (
                        <Link 
                            href={item.link} 
                            key={item.id} 
                            className="flex flex-col items-center justify-center gap-3 p-4 rounded-lg transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
                        >
                            {item.icon && item.icon.startsWith('data:image') ? (
                                 <img src={item.icon} alt={item.name} className="w-24 h-24 rounded-full object-cover border-4 border-white dark:border-gray-900 shadow-md" />
                            ) : (
                                 <div className="w-24 h-24 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center border-4 border-white dark:border-gray-900 shadow-md">
                                    <Icon className="w-12 h-12 text-gray-500" />
                                 </div>
                            )}
                            <h3 className="text-base font-semibold text-center mt-2">{item.name}</h3>
                        </Link>
                    )
                })}
            </div>
            {combinedItems.length === 0 && (
                 <div className="text-center py-12">
                    <p className="text-muted-foreground">No hay sorteos ni jugadas especiales disponibles.</p>
                    <p className="text-sm text-muted-foreground mt-2">
                        Asegúrate de haber creado loterías y activado jugadas especiales en los <Link href="/dashboard/settings" className="text-primary hover:underline">Ajustes</Link>.
                    </p>
                </div>
            )}
        </main>
    );
};

export default SorteosPage;
