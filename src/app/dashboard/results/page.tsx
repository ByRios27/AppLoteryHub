'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useStateContext } from '@/context/StateContext';
import { lotteries } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

const registerDrawSchema = z.object({
  lotteryId: z.string().nonempty("Debes seleccionar una lotería."),
  firstPrizeNumber: z.string().length(4, "El número debe tener 4 dígitos."),
  secondPrizeNumber: z.string().length(4, "El número debe tener 4 dígitos."),
  thirdPrizeNumber: z.string().length(4, "El número debe tener 4 dígitos."),
});

export default function ResultsPage() {
  const { winners, addWinner, sales } = useStateContext();
  const [filteredWinners, setFilteredWinners] = useState(winners);
  const [filterLottery, setFilterLottery] = useState('');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const form = useForm<z.infer<typeof registerDrawSchema>>({
    resolver: zodResolver(registerDrawSchema),
    defaultValues: { 
      lotteryId: '', 
      firstPrizeNumber: '', 
      secondPrizeNumber: '', 
      thirdPrizeNumber: '' 
    },
  });

  useEffect(() => {
    if (isClient) {
      const filtered = filterLottery ? winners.filter(w => w.lotteryId === filterLottery) : winners;
      setFilteredWinners(filtered);
    }
  }, [winners, filterLottery, isClient]);

 const handleRegisterDraw = (values: z.infer<typeof registerDrawSchema>) => {
    const { lotteryId, firstPrizeNumber, secondPrizeNumber, thirdPrizeNumber } = values;

    const prizeNumbers = [
        { number: firstPrizeNumber, prizeTier: 1 },
        { number: secondPrizeNumber, prizeTier: 2 },
        { number: thirdPrizeNumber, prizeTier: 3 },
    ];

    let winnersFoundCount = 0;

    const relevantSales = sales.filter(sale => sale.lotteryId === lotteryId);

    for (const sale of relevantSales) {
      for (const ticket of sale.tickets) {
        for (const prize of prizeNumbers) {
          if (ticket.ticketNumber === prize.number) {
            addWinner(ticket.id, lotteryId, ticket.ticketNumber, prize.prizeTier);
            winnersFoundCount++;
          }
        }
      }
    }

    if (winnersFoundCount > 0) {
        toast.success(`¡${winnersFoundCount} ganadores registrados!`, {
            description: `Se procesaron los resultados para la lotería seleccionada.`,
        });
    } else {
        toast.info('No se encontraron ganadores', {
            description: 'Ningún boleto vendido coincide con los números ganadores ingresados.',
        });
    }
    form.reset();
  };

  return (
    <main className="grid gap-4 p-4 md:gap-8 md:p-8">
      <div className="grid md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Registrar Resultados del Sorteo</CardTitle>
            <CardDescription>Ingresa los números ganadores para una lotería específica.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleRegisterDraw)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="lotteryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Lotería</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger><SelectValue placeholder="Selecciona una Lotería" /></SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {lotteries.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="firstPrizeNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número del 1er Premio</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: 0524" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="secondPrizeNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número del 2do Premio</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: 1190" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="thirdPrizeNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número del 3er Premio</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: 8345" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit">Registrar Ganadores</Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Filtrar Resultados</CardTitle>
            <CardDescription>Filtra por lotería para ver los números ganadores.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
                <Select 
                  onValueChange={(value) => setFilterLottery(value === 'all' ? '' : value)}
                  value={filterLottery || 'all'}
                >
                    <SelectTrigger><SelectValue placeholder="Mostrar Todas" /></SelectTrigger>
                    <SelectContent>
                         <SelectItem value="all">Mostrar Todas</SelectItem>
                        {lotteries.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                    </SelectContent>
                </Select>
                <Button onClick={() => setFilterLottery('')} variant="outline">Limpiar</Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Números Ganadores</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Lotería</TableHead>
                <TableHead>Número Ganador</TableHead>
                <TableHead>Premio</TableHead>
                <TableHead>Fecha del Sorteo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isClient && filteredWinners.length > 0 ? (
                filteredWinners.map(winner => {
                  const lottery = lotteries.find(l => l.id === winner.lotteryId);
                  return (
                    <TableRow key={winner.id}>
                      <TableCell>{lottery?.name || 'N/A'}</TableCell>
                      <TableCell className="font-mono font-bold">{winner.ticketNumber}</TableCell>
                      <TableCell><Badge>Premio {winner.prizeTier}</Badge></TableCell>
                      <TableCell>{new Date(winner.drawDate).toLocaleDateString()}</TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={4} className="text-center">
                    {isClient ? 'No hay resultados para mostrar.' : 'Cargando...'}
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
