"use client";

import { useSearchParams } from 'next/navigation';
import { useStateContext } from '@/context/StateContext';
import { lotteries } from '@/lib/data';
import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function VerifyPage() {
  const searchParams = useSearchParams();
  const saleId = searchParams.get('saleId');
  const { sales } = useStateContext();

  const sale = useMemo(() => {
    if (!saleId) return null;
    return sales.find(s => s.id === saleId) || null;
  }, [saleId, sales]);

  const lottery = useMemo(() => {
      if (!sale) return null;
      return lotteries.find(l => l.id === sale.lotteryId) || null;
  }, [sale]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-4 md:p-8">
        <div className="w-full max-w-2xl">
            <div className="text-center mb-8">
                 <h1 className="text-3xl font-bold font-headline">Verificador de Recibos</h1>
                 <p className="text-muted-foreground">Comprueba la autenticidad de un recibo de venta.</p>
            </div>
      
            {!saleId ? (
                 <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>No se proporcionó ningún ID de venta para verificar.</AlertDescription>
                </Alert>
            ) : sale ? (
                <Card>
                    <CardHeader>
                        <div className="flex items-center gap-3">
                            <CheckCircle className="h-8 w-8 text-green-500" />
                            <div>
                                <CardTitle className="font-headline">Recibo Válido</CardTitle>
                                <CardDescription>Este recibo ha sido verificado en el sistema.</CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="font-semibold">Lotería:</p>
                                <p>{lottery?.name} | Sorteo: {sale.drawTime}</p>
                            </div>
                             <div className="text-right">
                                <p className="font-semibold">Fecha de Venta:</p>
                                <p>{new Date(sale.soldAt).toLocaleString()}</p>
                            </div>
                        </div>
                         <div>
                            <p className="font-semibold">Cliente:</p>
                            <p>{sale.customerName || 'N/A'} ({sale.customerPhone || 'N/A'})</p>
                        </div>
                        <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Número</TableHead>
                                <TableHead>Fracciones</TableHead>
                                <TableHead className="text-right">Costo</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {sale.tickets.map(ticket => (
                                <TableRow key={ticket.id}>
                                  <TableCell className="font-mono font-bold text-lg">{ticket.ticketNumber}</TableCell>
                                  <TableCell>{ticket.fractions}</TableCell>
                                  <TableCell className="text-right">${ticket.cost.toFixed(2)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                        </Table>
                         <div className="text-xl font-bold text-right mt-4">Total: <span className="text-primary">${sale.totalCost.toFixed(2)}</span></div>
                    </CardContent>
                </Card>
            ) : (
                <Alert variant="destructive">
                    <XCircle className="h-4 w-4" />
                    <AlertTitle>Recibo Inválido</AlertTitle>
                    <AlertDescription>El ID de venta "{saleId}" no se encontró en el sistema o es incorrecto.</AlertDescription>
                </Alert>
            )}
            <div className="mt-8 text-center">
                <Button asChild variant="outline"><Link href="/dashboard">Volver al Dashboard</Link></Button>
            </div>
        </div>
    </main>
  );
}
