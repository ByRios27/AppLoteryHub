"use client";

import { useState } from 'react';
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

const resultsSchema = z.object({
  lotteryId: z.string().nonempty("Debes seleccionar una lotería."),
});

export default function ResultsPage() {
  const { winners } = useStateContext();
  const [filteredWinners, setFilteredWinners] = useState(winners);

  const form = useForm<z.infer<typeof resultsSchema>>({
    resolver: zodResolver(resultsSchema),
  });

  const handleFilter = (values: z.infer<typeof resultsSchema>) => {
    const filtered = winners.filter(w => w.lotteryId === values.lotteryId);
    setFilteredWinners(filtered);
  };

  return (
    <main className="flex flex-col gap-4 p-4 md:gap-8 md:p-8">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Resultados de Sorteos</CardTitle>
          <CardDescription>Filtra por lotería para ver los números ganadores y los detalles de los premios.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFilter)} className="flex items-center gap-4">
              <FormField
                control={form.control}
                name="lotteryId"
                render={({ field }) => (
                  <FormItem className="w-full md:w-1/3">
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecciona una Lotería" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {lotteries.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit">Filtrar Resultados</Button>
            </form>
          </Form>
        </CardContent>
      </Card>

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
                  <TableCell colSpan={4} className="text-center">No hay resultados para la lotería seleccionada.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}
