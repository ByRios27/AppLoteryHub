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

const addWinnerSchema = z.object({
  lotteryId: z.string().nonempty("Debes seleccionar una lotería."),
  ticketNumber: z.string().nonempty("El número de boleto no puede estar vacío."),
  prizeTier: z.coerce.number().min(1, "El premio debe ser al menos 1."),
});

export default function ResultsPage() {
  const { winners, addWinner, sales } = useStateContext();
  const [filteredWinners, setFilteredWinners] = useState(winners);
  const [filterLottery, setFilterLottery] = useState('');

  const form = useForm<z.infer<typeof addWinnerSchema>>({
    resolver: zodResolver(addWinnerSchema),
    defaultValues: { lotteryId: '', ticketNumber: '', prizeTier: 1 },
  });

  useEffect(() => {
    const filtered = filterLottery ? winners.filter(w => w.lotteryId === filterLottery) : winners;
    setFilteredWinners(filtered);
  }, [winners, filterLottery]);

  const handleAddWinner = (values: z.infer<typeof addWinnerSchema>) => {
    const ticketExistsInSales = sales.some(sale => 
      sale.lotteryId === values.lotteryId && 
      sale.tickets.some(ticket => ticket.ticketNumber === values.ticketNumber)
    );

    if (!ticketExistsInSales) {
      toast.error('Error: El boleto no existe.', {
        description: `El número de boleto ${values.ticketNumber} para la lotería seleccionada no fue encontrado en las ventas.`,
      });
      return;
    }

    addWinner(values.lotteryId, values.ticketNumber, values.prizeTier);
    toast.success('¡Ganador Añadido!', {
      description: `El boleto ${values.ticketNumber} ha sido registrado como ganador del premio ${values.prizeTier}.`,
    });
    form.reset();
  };

  return (
    <main className="grid gap-4 p-4 md:gap-8 md:p-8">
      <div className="grid md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Ingresar Ganador</CardTitle>
            <CardDescription>Registra un nuevo boleto ganador en el sistema.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleAddWinner)} className="space-y-4">
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
                  name="ticketNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número de Boleto Ganador</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: 0524" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="prizeTier"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Premio</FormLabel>
                      <FormControl>
                        <Input type="number" placeholder="Ej: 1" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit">Añadir Ganador</Button>
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
                <Select onValueChange={setFilterLottery} value={filterLottery}>
                    <SelectTrigger><SelectValue placeholder="Mostrar Todas" /></SelectTrigger>
                    <SelectContent>
                         <SelectItem value="">Mostrar Todas</SelectItem>
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
              {filteredWinners.length > 0 ? (
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
                  <TableCell colSpan={4} className="text-center">No hay resultados para mostrar.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
