"use client";

import Link from "next/link";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { lotteries } from "@/lib/data";
import { iconMap } from "@/lib/icon-map";
import { useStateContext } from "@/context/StateContext";
import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Award } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";

const resultsFormSchema = z.object({
  lotteryId: z.string({ required_error: "Por favor selecciona una lotería." }),
  drawTime: z.string({ required_error: "Por favor selecciona un sorteo." }),
  winningNumber: z.string().length(2, "Debe tener 2 dígitos").regex(/^\d{2}$/, "Debe ser un número del 00 al 99"),
});

function ResultsManager() {
  const { setWinningResults } = useStateContext();
  const [selectedLotteryId, setSelectedLotteryId] = useState<string | null>(null);
  const { toast } = useToast();

  const form = useForm<z.infer<typeof resultsFormSchema>>({
    resolver: zodResolver(resultsFormSchema),
    defaultValues: { winningNumber: "" },
  });

  const selectedLottery = lotteries.find(l => l.id === selectedLotteryId);

  const onSubmit = (values: z.infer<typeof resultsFormSchema>) => {
    const key = `${values.lotteryId}-${values.drawTime}`;
    setWinningResults(prev => ({ ...prev, [key]: values.winningNumber }));
    const lotteryName = lotteries.find(l => l.id === values.lotteryId)?.name;
    toast({ title: "¡Resultado Guardado!", description: `El número ganador para ${lotteryName} a las ${values.drawTime} es ${values.winningNumber}.` });
    form.reset();
    setSelectedLotteryId(null);
  };

  return (
    <Card className="col-span-1 lg:col-span-2">
      <CardHeader>
        <CardTitle className="font-headline">Centro de Resultados</CardTitle>
        <CardDescription>Ingresa los números ganadores para cada sorteo.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 sm:grid-cols-4 gap-4 items-start">
            <FormField control={form.control} name="lotteryId" render={({ field }) => (
              <FormItem>
                <FormLabel>Lotería</FormLabel>
                <Select onValueChange={(value) => { field.onChange(value); setSelectedLotteryId(value); form.resetField("drawTime"); }} value={field.value ?? ''}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar Lotería" /></SelectTrigger></FormControl>
                  <SelectContent>{lotteries.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="drawTime" render={({ field }) => (
              <FormItem>
                <FormLabel>Sorteo</FormLabel>
                <Select onValueChange={field.onChange} value={field.value ?? ''} disabled={!selectedLottery}>
                  <FormControl><SelectTrigger><SelectValue placeholder="Seleccionar Sorteo" /></SelectTrigger></FormControl>
                  <SelectContent>{selectedLottery?.drawTimes.map(time => <SelectItem key={time} value={time}>{time}</SelectItem>)}</SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )} />
            <FormField control={form.control} name="winningNumber" render={({ field }) => (
              <FormItem>
                <FormLabel>Número Ganador</FormLabel>
                <FormControl><Input placeholder="Ej: 42" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )} />
            <div className="self-end pb-1"><Button type="submit" className="w-full"><Award className="mr-2 h-4 w-4" /> Guardar</Button></div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function WinnersList() {
    const { sales, winningResults } = useStateContext();

    const winners = useMemo(() => {
        const allWinners: any[] = [];
        Object.entries(winningResults).forEach(([key, winningNumber]) => {
            if (!winningNumber) return;
            const [lotteryId, drawTime] = key.split('-');
            const lottery = lotteries.find(l => l.id === lotteryId);

            const winningSales = sales.filter(sale => 
                sale.lotteryId === lotteryId &&
                sale.drawTime === drawTime &&
                sale.tickets.some(t => t.ticketNumber === winningNumber)
            );

            winningSales.forEach(sale => {
                sale.tickets.forEach(ticket => {
                    if (ticket.ticketNumber === winningNumber) {
                        allWinners.push({ sale, ticket, lottery, drawTime });
                    }
                });
            });
        });
        return allWinners.sort((a,b) => new Date(b.sale.soldAt).getTime() - new Date(a.sale.soldAt).getTime());
    }, [sales, winningResults]);

    return (
         <Card className="col-span-1 lg:col-span-3">
            <CardHeader>
                <CardTitle className="font-headline">Lista de Ganadores</CardTitle>
                <CardDescription>Un resumen de todos los boletos ganadores en todos los sorteos.</CardDescription>
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Lotería y Sorteo</TableHead>
                            <TableHead>Cliente</TableHead>
                            <TableHead>Número Ganador</TableHead>
                            <TableHead className="text-right">Premio (12x)</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {winners.length > 0 ? (winners.map(({ sale, ticket, lottery }) => (
                            <TableRow key={ticket.id} className="bg-green-100/50 dark:bg-green-900/50">
                                <TableCell>{lottery?.name} <span className="font-mono text-xs">({sale.drawTime})</span></TableCell>
                                <TableCell>{sale.customerName || 'N/A'}</TableCell>
                                <TableCell className="font-mono font-bold text-lg">{ticket.ticketNumber}</TableCell>
                                <TableCell className="text-right font-semibold">${(ticket.fractions * 12).toFixed(2)}</TableCell> 
                            </TableRow>
                        ))) : (
                            <TableRow><TableCell colSpan={4} className="text-center h-24">Aún no hay ganadores.</TableCell></TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}

export default function Dashboard() {
  return (
    <main className="flex flex-1 flex-col gap-8 p-4 md:p-8">
      <div className="flex items-center">
        <h1 className="text-3xl font-bold font-headline">Venta de Loterías</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {lotteries.map((lottery) => {
          const Icon = iconMap[lottery.icon] || iconMap.Ticket;
          return (
            <Link href={`/dashboard/lottery/${lottery.id}`} key={lottery.id} className="group">
              <Card className="h-full flex flex-col justify-center items-center text-center p-6 transition-all hover:bg-muted/50 hover:shadow-lg">
                  <div className="flex items-center justify-center h-20 w-20 rounded-full bg-primary/10 group-hover:scale-105 transition-transform mb-4">
                    <Icon className="h-10 w-10 text-primary" />
                  </div>
                  <CardHeader className="p-0 flex flex-col items-center">
                    <CardTitle className="font-headline text-xl">{lottery.name}</CardTitle>
                    <CardDescription>{lottery.drawTimes.join(', ')}</CardDescription>
                  </CardHeader>
              </Card>
            </Link>
          );
        })}
      </div>
      
      <div className="grid gap-8 lg:grid-cols-5">
          <ResultsManager />
          <WinnersList />
      </div>
    </main>
  );
}
