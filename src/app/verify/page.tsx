'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useStateContext } from '@/context/StateContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { CheckCircle, XCircle, Award } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const verifySchema = z.object({
  qrCode: z.string().min(1, "El código QR no puede estar vacío."),
});

interface VerificationResult {
  status: 'valid' | 'invalid' | 'winner';
  message: string;
  details?: {
    lotteryName: string;
    drawTime: string;
    customerName: string;
    ticketNumber: string;
    fractions: number;
    soldAt: string;
    prizeTier?: number;
  };
}

function VerifyPageContent() {
  const { sales, winners, lotteries } = useStateContext();
  const [result, setResult] = useState<VerificationResult | null>(null);
  const searchParams = useSearchParams();

  const form = useForm<z.infer<typeof verifySchema>>({
    resolver: zodResolver(verifySchema),
    defaultValues: { qrCode: '' },
  });

  const handleVerification = (values: z.infer<typeof verifySchema>) => {
    let saleId: string;
    try {
        const parsedQr = JSON.parse(values.qrCode);
        saleId = parsedQr.saleId;
    } catch(e) {
        saleId = values.qrCode;
    }

    if (!saleId) {
      setResult({ status: 'invalid', message: 'Código QR inválido o malformado.' });
      return;
    }

    const sale = sales.find(s => s.id === saleId);

    if (!sale) {
      setResult({ status: 'invalid', message: 'Esta venta no se encuentra en el sistema. Verifique el código.' });
      return;
    }
    
    const ticket = sale.tickets[0];

    if (!ticket) {
      setResult({ status: 'invalid', message: 'El boleto asociado a esta venta no es válido.' });
      return;
    }

    const lottery = lotteries.find(l => l.id === sale.lotteryId);
    const winnerInfo = winners.find(w => w.id === ticket.id);

    if (winnerInfo) {
      setResult({
        status: 'winner',
        message: `¡Boleto Ganador del ${winnerInfo.prizeTier}er Premio!`,
        details: {
          lotteryName: lottery?.name || 'Desconocida',
          drawTime: sale.drawTime,
          customerName: sale.customerName || 'N/A',
          ticketNumber: ticket.ticketNumber,
          fractions: ticket.fractions,
          soldAt: new Date(sale.soldAt).toLocaleString(),
          prizeTier: winnerInfo.prizeTier,
        },
      });
    } else {
      setResult({
        status: 'valid',
        message: 'Boleto Válido. No es un ganador en los sorteos finalizados.',
        details: {
          lotteryName: lottery?.name || 'Desconocida',
          drawTime: sale.drawTime,
          customerName: sale.customerName || 'N/A',
          ticketNumber: ticket.ticketNumber,
          fractions: ticket.fractions,
          soldAt: new Date(sale.soldAt).toLocaleString(),
        },
      });
    }
  };

  useEffect(() => {
    const saleIdFromUrl = searchParams.get('saleId');
    if (saleIdFromUrl) {
      form.setValue('qrCode', saleIdFromUrl);
      handleVerification({ qrCode: saleIdFromUrl });
    }
  }, [searchParams, form]);

  return (
    <main className="flex flex-col items-center justify-center p-4 md:p-8">
      <div className="w-full max-w-2xl">
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="font-headline">Verificador de Boletos</CardTitle>
            <CardDescription>Ingrese el código de su boleto para verificar su autenticidad y si ha resultado ganador.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleVerification)} className="flex gap-4">
                <FormField
                  control={form.control}
                  name="qrCode"
                  render={({ field }) => (
                    <FormItem className="flex-grow">
                      <FormControl>
                        <Input placeholder="Pegue el código del QR aquí o use el enlace de verificación" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit">Verificar</Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {result && (
          <Card 
            className={`border-2 ${{
              'winner': 'border-green-500 bg-green-500/10',
              'valid': 'border-blue-500 bg-blue-500/10',
              'invalid': 'border-red-500 bg-red-500/10'
            }[result.status]}`}>
            <CardHeader className="text-center">
                <div className="flex justify-center items-center gap-3 mb-2">
                    {result.status === 'winner' && <Award className="h-8 w-8 text-green-500" />}
                    {result.status === 'valid' && <CheckCircle className="h-8 w-8 text-blue-500" />}
                    {result.status === 'invalid' && <XCircle className="h-8 w-8 text-red-500" />}
                    <CardTitle className={`text-2xl ${{
                        'winner': 'text-green-600',
                        'valid': 'text-blue-600',
                        'invalid': 'text-red-600'
                    }[result.status]}`}>{result.message}</CardTitle>
                </div>
            </CardHeader>
            {result.details && (
              <CardContent className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div className="font-semibold">Lotería:</div><div>{result.details.lotteryName}</div>
                <div className="font-semibold">Sorteo:</div><div>{result.details.drawTime}</div>
                <div className="font-semibold">Cliente:</div><div>{result.details.customerName}</div>
                <div className="font-semibold">Número Jugado:</div><div className="font-mono text-base font-bold">{result.details.ticketNumber}</div>
                <div className="font-semibold">Fracciones:</div><div>{result.details.fractions}</div>
                <div className="font-semibold">Fecha de Venta:</div><div>{result.details.soldAt}</div>
                {result.details.prizeTier && <><div className="font-semibold">Premio:</div><div><Badge>Premio {result.details.prizeTier}</Badge></div></>}
              </CardContent>
            )}
          </Card>
        )}

      </div>
    </main>
  );
}

// We need to wrap the component in a Suspense boundary if we use useSearchParams
// but since this is a simple page, we can just wrap it in a client component that does the check
export default function VerifyPage() {
    return (
        <VerifyPageContent />
    );
}
