'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useStateContext } from '@/context/StateContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { type Winner, type Sale } from '@/lib/data';
import { SaleReceiptModal } from '@/components/SaleReceiptModal';
import { Eye } from 'lucide-react';
import DashboardHeader from '@/components/ui/DashboardHeader';

const createRegisterDrawSchema = (lotteries: any[]) => z.object({
  lotteryId: z.string().nonempty("Debes seleccionar una lotería."),
  drawTime: z.string().nonempty("Debes seleccionar un horario de sorteo."),
  firstPrizeNumber: z.string(),
  secondPrizeNumber: z.string(),
  thirdPrizeNumber: z.string(),
}).superRefine((data, ctx) => {
  if (!data.lotteryId) return;

  const lottery = lotteries.find(l => l.id === data.lotteryId);
  if (!lottery) return;

  const { numberOfDigits } = lottery;
  const prizeFields: ('firstPrizeNumber' | 'secondPrizeNumber' | 'thirdPrizeNumber')[] = ['firstPrizeNumber', 'secondPrizeNumber', 'thirdPrizeNumber'];
  
  for (const field of prizeFields) {
    if (data[field].length === 0) {
       ctx.addIssue({
          code: z.ZodIssueCode.too_small,
          minimum: 1,
          type: 'string',
          inclusive: true,
          message: 'El número no puede estar vacío.',
          path: [field],
        });
    } else if (data[field].length !== numberOfDigits) {
      ctx.addIssue({
        code: z.ZodIssueCode.invalid_string,
        validation: 'length',
        message: `El número debe tener ${numberOfDigits} dígitos.`,
        path: [field],
      });
    }
  }
});

interface WinnerDetails extends Winner {
  customerName?: string;
  sale: Sale | null;
}

export default function ResultsPage() {
  const { winners, addWinner, sales, lotteries, winningResults, addWinningResult, updateWinnerPaymentStatus } = useStateContext();
  const [filteredWinners, setFilteredWinners] = useState<WinnerDetails[]>([]);
  const [filterLottery, setFilterLottery] = useState('');
  const [isClient, setIsClient] = useState(false);
  const [selectedLottery, setSelectedLottery] = useState<any | null>(null);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const registerDrawSchema = createRegisterDrawSchema(lotteries);

  const form = useForm<z.infer<typeof registerDrawSchema>>({
    resolver: zodResolver(registerDrawSchema),
    defaultValues: { lotteryId: '', drawTime: '', firstPrizeNumber: '', secondPrizeNumber: '', thirdPrizeNumber: '' },
  });

  const lotteryId = form.watch('lotteryId');

  useEffect(() => {
    const lottery = lotteries.find(l => l.id === lotteryId);
    setSelectedLottery(lottery || null);
    form.reset({ lotteryId: lotteryId, drawTime: '', firstPrizeNumber: '', secondPrizeNumber: '', thirdPrizeNumber: '' });
  }, [lotteryId, form, lotteries]);

  const winnerDetails = useMemo(() => {
    return winners.map(winner => {
        const sale = sales.find(s => Array.isArray(s.tickets) && s.tickets.some(t => t.id === winner.id)) || null;
        return {
            ...winner,
            customerName: sale?.customerName || 'N/A',
            sale: sale,
        };
    });
  }, [winners, sales]);

  useEffect(() => {
    if (isClient) {
      const filtered = filterLottery ? winnerDetails.filter(w => w.lotteryId === filterLottery) : winnerDetails;
      setFilteredWinners(filtered);
    }
  }, [winnerDetails, filterLottery, isClient]);

 const handleRegisterDraw = (values: z.infer<typeof registerDrawSchema>) => {
    const { lotteryId, drawTime, firstPrizeNumber, secondPrizeNumber, thirdPrizeNumber } = values;
    
    addWinningResult(lotteryId, drawTime, [firstPrizeNumber, secondPrizeNumber, thirdPrizeNumber]);

    const prizeNumbers = [
        { number: firstPrizeNumber, prizeTier: 1 },
        { number: secondPrizeNumber, prizeTier: 2 },
        { number: thirdPrizeNumber, prizeTier: 3 },
    ];

    let winnersFoundCount = 0;
    const relevantSales = sales.filter(sale => sale.lotteryId === lotteryId && sale.drawTime === drawTime);

    for (const sale of relevantSales) {
      for (const ticket of sale.tickets) {
        for (const prize of prizeNumbers) {
          if (ticket.ticketNumber === prize.number) {
            addWinner(ticket.id, lotteryId, drawTime, ticket.ticketNumber, prize.prizeTier);
            winnersFoundCount++;
          }
        }
      }
    }

    if (winnersFoundCount > 0) {
        toast.success(`¡${winnersFoundCount} ganadores registrados!`);
    } else {
        toast.info('No se encontraron ganadores');
    }
    form.reset();
  };

  const pastDraws = useMemo(() => {
      return Object.entries(winningResults).flatMap(([date, dailyResults]) => 
          Object.entries(dailyResults).flatMap(([lotteryId, lotteryResults]) => 
              Object.entries(lotteryResults).map(([drawTime, prizes]) => {
                  const lottery = lotteries.find(l => l.id === lotteryId);
                  return { id: `${date}-${lotteryId}-${drawTime}`, date, lotteryName: lottery?.name || 'N/A', drawTime, prizes };
              })
          )
      ).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [winningResults, lotteries]);

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <DashboardHeader title="Resultados" />
      <div className="grid md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Registrar Resultados</CardTitle>
            <CardDescription>Ingresa los números ganadores.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleRegisterDraw)} className="space-y-4">
                 <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="lotteryId" render={({ field }) => (
                        <FormItem>
                        <FormLabel>Lotería</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecciona una Lotería" /></SelectTrigger></FormControl><SelectContent>{lotteries.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent></Select>
                        <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name="drawTime" render={({ field }) => (
                        <FormItem>
                            <FormLabel>Horario</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedLottery}><FormControl><SelectTrigger><SelectValue placeholder="Selecciona un horario" /></SelectTrigger></FormControl><SelectContent>{selectedLottery?.drawTimes.map((time: string) => <SelectItem key={time} value={time}>{time}</SelectItem>)}</SelectContent></Select>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>
                <FormField control={form.control} name="firstPrizeNumber" render={({ field }) => (<FormItem><FormLabel>1er Premio</FormLabel><FormControl><Input placeholder={selectedLottery ? `Ej: ${'12345'.slice(0, selectedLottery.numberOfDigits)}` : "..."} {...field} disabled={!lotteryId}/></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="secondPrizeNumber" render={({ field }) => (<FormItem><FormLabel>2do Premio</FormLabel><FormControl><Input placeholder={selectedLottery ? `Ej: ${'67890'.slice(0, selectedLottery.numberOfDigits)}` : "..."} {...field} disabled={!lotteryId}/></FormControl><FormMessage /></FormItem>)} />
                <FormField control={form.control} name="thirdPrizeNumber" render={({ field }) => (<FormItem><FormLabel>3er Premio</FormLabel><FormControl><Input placeholder={selectedLottery ? `Ej: ${'11223'.slice(0, selectedLottery.numberOfDigits)}` : "..."} {...field} disabled={!lotteryId}/></FormControl><FormMessage /></FormItem>)} />
                <Button type="submit" disabled={!lotteryId}>Registrar Ganadores</Button>
              </form>
            </Form>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Historial de Sorteos</CardTitle>
            <CardDescription>Resultados de los últimos 7 días.</CardDescription>
          </CardHeader>
          <CardContent className="max-h-96 overflow-y-auto">
             <Table><TableHeader><TableRow><TableHead>Lotería</TableHead><TableHead>Fecha/Hora</TableHead><TableHead>Premios</TableHead></TableRow></TableHeader>
                <TableBody>{isClient && pastDraws.length > 0 ? (pastDraws.map(draw => (<TableRow key={draw.id}><TableCell>{draw.lotteryName}</TableCell><TableCell>{draw.date}<br/>{draw.drawTime}</TableCell><TableCell className="font-mono text-xs">{draw.prizes.map((p, i) => `[${i+1}] ${p}`).join(' ')}</TableCell></TableRow>))) : (<TableRow><TableCell colSpan={3} className="text-center h-24">No hay resultados históricos.</TableCell></TableRow>)}</TableBody>
             </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Ganadores Registrados</CardTitle>
           <div className="flex items-center gap-4 pt-4">
                <Select onValueChange={(value) => setFilterLottery(value === 'all' ? '' : value)} value={filterLottery || 'all'}><SelectTrigger className="w-64"><SelectValue placeholder="Filtrar por Lotería" /></SelectTrigger><SelectContent><SelectItem value="all">Mostrar Todas</SelectItem>{lotteries.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent></Select>
                <Button onClick={() => setFilterLottery('')} variant="outline">Limpiar</Button>
            </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lotería</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Número/ID</TableHead>
                <TableHead>Premio</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isClient && filteredWinners.length > 0 ? (
                filteredWinners.map(winner => {
                  const lottery = lotteries.find(l => l.id === winner.lotteryId);
                  if (!lottery || !winner.sale) return null; // Skip if lottery or sale not found
                  return (
                    <TableRow key={winner.id}>
                      <TableCell>{lottery?.name || 'N/A'}<p className="text-xs text-muted-foreground">{winner.drawTime}</p></TableCell>
                      <TableCell>{winner.customerName}</TableCell>
                      <TableCell><p className="font-mono font-bold">{winner.ticketNumber}</p><p className="font-mono text-xs text-muted-foreground">ID: {winner.sale.id}</p></TableCell>
                      <TableCell><Badge>Premio {winner.prizeTier}</Badge></TableCell>
                      <TableCell className="flex justify-end items-center gap-2">
                          <Button size="sm" variant={winner.paid ? 'secondary' : 'destructive'} onClick={() => updateWinnerPaymentStatus(winner.id, !winner.paid)}>{winner.paid ? 'Pagado' : 'Pagar'}</Button>
                           <SaleReceiptModal sale={winner.sale} lottery={lottery}>
                                <Button variant="outline" size="icon"><Eye className="h-4 w-4" /></Button>
                           </SaleReceiptModal>
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow><TableCell colSpan={5} className="text-center h-24">{isClient ? 'No hay ganadores para mostrar.' : 'Cargando...'}</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
