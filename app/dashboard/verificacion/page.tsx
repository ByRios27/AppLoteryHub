'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
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
  tickets: { ticketNumber: string }[];
  createdAt: string;
}

export default function DashboardVerificationPage() {
  const { data: session, status } = useSession();
  const [verificationResult, setVerificationResult] = useState<VerifiedTicket | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof verificationSchema>>({
    resolver: zodResolver(verificationSchema),
    defaultValues: { ticketId: '' },
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

  if (status === 'loading') {
    return <p className="text-center p-10">Cargando...</p>;
  }

  const userRole = session?.user?.role;
  const isAuthorized = userRole === 'admin' || userRole === 'seller';

  if (!isAuthorized) {
    return (
      <div className="flex items-center justify-center p-4" style={{ minHeight: 'calc(100vh - 200px)' }}>
        <Card className="w-full max-w-md text-center">
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-red-600">Acceso Denegado</CardTitle>
          </CardHeader>
          <CardContent>
            <p>No tienes los permisos necesarios para acceder a esta página. Si crees que esto es un error, por favor, contacta a un administrador.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-start p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-2xl font-bold">Verificación Interna de Tickets</CardTitle>
          <CardDescription>
            Usa esta herramienta para validar tickets de clientes o verificar información.
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
                    <FormLabel>Código de Ticket o QR</FormLabel>
                    <FormControl>
                      <Input placeholder="Ingresa o escanea el código..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full sm:w-auto" disabled={isLoading}>
                {isLoading ? 'Buscando...' : 'Verificar Ticket'}
              </Button>
            </form>
          </Form>

          {error && (
            <div className="mt-4 text-center text-red-500 bg-red-50 p-3 rounded-md">
              <p><strong>Error:</strong> {error}</p>
            </div>
          )}

          {verificationResult && (
            <Card className="mt-6 bg-green-50">
              <CardHeader>
                <CardTitle className="text-green-800">Ticket Válido</CardTitle>
                <CardDescription>Cliente: {verificationResult.customerName}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                <p><strong>Lotería:</strong> {verificationResult.lotteryName}</p>
                <p><strong>Sorteo:</strong> {verificationResult.drawTime}</p>
                <p><strong>ID de Venta:</strong> <span className="font-mono text-sm">{verificationResult.id}</span></p>
                <p><strong>Fecha de Compra:</strong> {new Date(verificationResult.createdAt).toLocaleString()}</p>
                <div>
                  <strong>Números Jugados:</strong>
                  <ul className="list-disc list-inside bg-white p-2 rounded-md font-mono text-lg">
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
    </div>
  );
}
