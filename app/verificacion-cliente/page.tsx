'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';

const verificationSchema = z.object({
  ticketId: z.string().min(1, 'Por favor, ingresa el código del ticket.'),
});

interface VerifiedTicket {
  id: string;
  customerName: string;
  lotteryName: string;
  drawTime: string;
  tickets: {
    ticketNumber: string;
  }[];
  createdAt: string;
}

export default function TicketVerificationPage() {
  const [verificationResult, setVerificationResult] = useState<VerifiedTicket | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof verificationSchema>>({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      ticketId: '',
    },
  });

  const handleVerifyTicket = async (values: z.infer<typeof verificationSchema>) => {
    setIsLoading(true);
    setError(null);
    setVerificationResult(null);

    try {
      const response = await fetch(`/api/verificar-ticket?ticketId=${values.ticketId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'No se pudo verificar el ticket.');
      }

      const data: VerifiedTicket = await response.json();
      setVerificationResult(data);
    } catch (e: any) {
      setError(e.message || 'El código es inválido o no se encontró.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">Verificar Ticket</CardTitle>
          <CardDescription className="text-center">
            Ingresa el código de tu ticket o QR para ver los detalles.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleVerifyTicket)} className="space-y-4">
              <FormField
                control={form.control}
                name="ticketId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Código de Ticket</FormLabel>
                    <FormControl>
                      <Input placeholder="Ej: 1a2b3c4d-5e6f-7g8h-9i0j" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? 'Verificando...' : 'Verificar'}
              </Button>
            </form>
          </Form>

          {error && (
            <div className="mt-4 text-center text-red-500">
              <p>Error: {error}</p>
            </div>
          )}

          {verificationResult && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Ticket Válido</CardTitle>
                <CardDescription>Cliente: {verificationResult.customerName}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <p><strong>Lotería:</strong> {verificationResult.lotteryName}</p>
                <p><strong>Sorteo:</strong> {verificationResult.drawTime}</p>
                <p><strong>Fecha de Compra:</strong> {new Date(verificationResult.createdAt).toLocaleString()}</p>
                <div>
                  <strong>Números Jugados:</strong>
                  <ul className="list-disc list-inside bg-gray-100 p-2 rounded-md font-mono">
                    {verificationResult.tickets.map((ticket, index) => (
                      <li key={index}>{ticket.ticketNumber}</li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
