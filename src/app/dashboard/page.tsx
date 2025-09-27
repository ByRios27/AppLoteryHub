"use client";

import { useMemo } from 'react';
import Link from 'next/link';
import { lotteries } from '@/lib/data';
import { iconMap } from '@/lib/icon-map';
import { useStateContext } from '@/context/StateContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export default function DashboardPage() {
  const { sales } = useStateContext();

  const recentSales = useMemo(() => {
    return [...sales]
      .sort((a, b) => new Date(b.soldAt).getTime() - new Date(a.soldAt).getTime())
      .slice(0, 5);
  }, [sales]);

  const getLotteryName = (lotteryId: string) => {
    return lotteries.find(l => l.id === lotteryId)?.name || 'Unknown';
  };

  return (
    <main className="flex flex-1 flex-col gap-8 p-4 md:p-8">
      <div className="flex items-center">
        <h1 className="text-3xl font-bold font-headline">Selección de Lotería</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {lotteries.map((lottery) => {
          const Icon = iconMap[lottery.icon] || iconMap.Ticket;
          return (
            <Link href={`/dashboard/lottery/${lottery.id}`} key={lottery.id} className="group">
              <div className="transition-colors h-full flex flex-col justify-center items-center text-center p-6 rounded-lg hover:bg-primary/10 border">
                <div className="flex items-center justify-center h-20 w-20 rounded-full bg-primary/20 group-hover:bg-primary/30 mb-4 transition-colors">
                  <Icon className="h-10 w-10 text-primary" />
                </div>
                <div className="p-0 flex flex-col items-center">
                  <h3 className="font-headline text-xl font-semibold text-foreground">{lottery.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{lottery.drawTimes.length > 1 ? `${lottery.drawTimes.length} sorteos hoy` : lottery.drawTimes[0]}</p>
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Actividad Reciente</CardTitle>
          <CardDescription>Registro de las últimas ventas en todas las loterías.</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lotería</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead># Boletos</TableHead>
                <TableHead>Vendido a las</TableHead>
                <TableHead className="text-right">Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recentSales.length > 0 ? (
                recentSales.map(sale => (
                  <TableRow key={sale.id}>
                    <TableCell>
                      <Badge variant="outline">{getLotteryName(sale.lotteryId)} ({sale.drawTime})</Badge>
                    </TableCell>
                    <TableCell>{sale.customerName || 'N/A'}</TableCell>
                    <TableCell>{sale.tickets.length}</TableCell>
                    <TableCell>{new Date(sale.soldAt).toLocaleTimeString()}</TableCell>
                    <TableCell className="text-right font-semibold">${sale.totalCost.toFixed(2)}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center h-24">
                    No se han registrado ventas todavía.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
