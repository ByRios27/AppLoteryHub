'use client';

import { useState, useRef, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { toPng } from 'html-to-image';
import { format } from 'date-fns';

import { useStateContext } from '@/context/StateContext';
import { type Sale } from '@/lib/data';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Trash2, PlusCircle, Download, MoreHorizontal, Edit, Share2, Trash } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import Receipt from '@/components/receipt';

// Esquema para un ticket individual, alineado con la interfaz TicketDetail
const ticketDetailSchema = z.object({
  ticketNumber: z.string().min(1, "Debe ingresar un número"),
  fractions: z.number().min(1, "La cantidad debe ser al menos 1"),
  cost: z.number().min(0.01, "El monto debe ser mayor que cero"),
});

// Esquema principal del formulario, alineado con la interfaz Sale
const salesFormSchema = z.object({
  lotteryId: z.string().nonempty("Debe seleccionar un sorteo"),
  drawTime: z.string().nonempty("Debe seleccionar un horario"),
  customerName: z.string().min(2, "El nombre del cliente es requerido"),
  customerPhone: z.string().optional(),
  tickets: z.array(ticketDetailSchema).min(1, "Debe ingresar al menos un número"),
});

function SalesPageContent() {
  const { lotteries, sales, setSales } = useStateContext();
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);
  const searchParams = useSearchParams();

  const form = useForm<z.infer<typeof salesFormSchema>>({
    resolver: zodResolver(salesFormSchema),
    defaultValues: {
      lotteryId: '',
      drawTime: '',
      customerName: '',
      customerPhone: '',
      tickets: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'tickets',
  });

  const selectedLotteryId = form.watch('lotteryId');
  const selectedLottery = lotteries.find(l => l.id === selectedLotteryId);
  
  // Pre-seleccionar lotería desde la URL
  useEffect(() => {
    const lotteryIdFromUrl = searchParams.get('lotteryId');
    if (lotteryIdFromUrl) {
      form.setValue('lotteryId', lotteryIdFromUrl);
    }
  }, [searchParams, form]);

  const onSubmit = (values: z.infer<typeof salesFormSchema>) => {
    const totalCost = values.tickets.reduce((sum, ticket) => sum + ticket.cost, 0);

    const newSale: Sale = {
      id: uuidv4(),
      lotteryId: values.lotteryId,
      drawTime: values.drawTime,
      customerName: values.customerName,
      customerPhone: values.customerPhone,
      tickets: values.tickets.map(t => ({ ...t, id: uuidv4() })), // Asignar IDs únicos a cada ticket
      totalCost,
      soldAt: new Date(), // Usar `soldAt` con un objeto Date
    };

    setSales(prevSales => [...prevSales, newSale]);
    setLastSale(newSale);
    setIsReceiptOpen(true);
    
    toast.success('Venta registrada exitosamente', {
      description: `Se ha generado el ticket #${newSale.id.slice(0, 8)}...`,
    });

    form.reset({
        ...form.getValues(), // Mantener los valores del cliente y sorteo
        customerName: '',
        customerPhone: '',
        tickets: [], // Limpiar solo los tickets
    });
  };

  const handleDownloadReceipt = async () => {
    if (!receiptRef.current) return;
    try {
      const dataUrl = await toPng(receiptRef.current, { quality: 1.0 });
      const link = document.createElement('a');
      link.download = `comprobante-${lastSale?.id.slice(0, 8)}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('Error al generar la imagen del recibo:', error);
      toast.error('No se pudo descargar el comprobante');
    }
  };

  const filteredSales = selectedLotteryId 
    ? sales.filter(s => s.lotteryId === selectedLotteryId).sort((a, b) => new Date(b.soldAt).getTime() - new Date(a.soldAt).getTime())
    : [];

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Registrar Nueva Venta</CardTitle>
          <CardDescription>Completa los detalles para generar un nuevo ticket de lotería.</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              {/* ... Campos del formulario (sin cambios) ... */}
              <div className="grid md:grid-cols-2 gap-6">
                {/* ... (resto de campos sin cambios) ... */}
              </div>
              <Separator />
              <div>
                <h3 className="text-lg font-medium mb-4">Números Jugados</h3>
                {fields.map((field, index) => (
                    <div key={field.id} className="flex items-center gap-4 mb-4">
                        <FormField
                            control={form.control}
                            name={`tickets.${index}.ticketNumber`}
                            render={({ field }) => (
                                <FormItem className="flex-1">
                                    <FormControl><Input placeholder="Número" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name={`tickets.${index}.fractions`}
                            render={({ field }) => (
                                <FormItem className="w-24">
                                     <FormControl><Input type="number" placeholder="Cant." {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} /></FormControl>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name={`tickets.${index}.cost`}
                            render={({ field }) => (
                                <FormItem className="w-28">
                                    <FormControl><Input type="number" placeholder="Monto $" {...field} step="0.01" onChange={e => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl>
                                </FormItem>
                            )}
                        />
                      <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full mt-2"
                  onClick={() => append({ ticketNumber: '', fractions: 1, cost: 1 })}
                  disabled={!selectedLottery}
                >
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Añadir Número
                </Button>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" size="lg" className="w-full" disabled={!form.formState.isValid}>Generar Ticket</Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

      {/* ---- NUEVA SECCIÓN: HISTORIAL DE VENTAS ---- */}
      {selectedLottery && (
          <Card>
              <CardHeader>
                  <CardTitle>Historial de Ventas: {selectedLottery.name}</CardTitle>
                  <CardDescription>Aquí puedes ver y gestionar todos los tickets vendidos para este sorteo.</CardDescription>
              </CardHeader>
              <CardContent>
                  <Table>
                      <TableHeader>
                          <TableRow>
                              <TableHead>Cliente</TableHead>
                              <TableHead className="text-right">Monto Total</TableHead>
                              <TableHead>Fecha de Venta</TableHead>
                              <TableHead className="text-right">Acciones</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {filteredSales.length > 0 ? (
                              filteredSales.map(sale => (
                                  <TableRow key={sale.id}>
                                      <TableCell>
                                          <div className="font-medium">{sale.customerName}</div>
                                          <div className="text-sm text-muted-foreground">{sale.tickets.length} ticket(s)</div>
                                      </TableCell>
                                      <TableCell className="text-right">${sale.totalCost.toFixed(2)}</TableCell>
                                      <TableCell>{format(new Date(sale.soldAt), "dd/MM/yyyy 'a las' HH:mm")}</TableCell>
                                      <TableCell className="text-right">
                                          <DropdownMenu>
                                              <DropdownMenuTrigger asChild>
                                                  <Button variant="ghost" size="icon">
                                                      <MoreHorizontal className="h-4 w-4" />
                                                  </Button>
                                              </DropdownMenuTrigger>
                                              <DropdownMenuContent align="end">
                                                  <DropdownMenuItem onClick={() => toast.info('Próximamente: Editar Venta')}>
                                                      <Edit className="mr-2 h-4 w-4" />
                                                      Editar
                                                  </DropdownMenuItem>
                                                  <DropdownMenuItem onClick={() => toast.info('Próximamente: Compartir Venta')}>
                                                      <Share2 className="mr-2 h-4 w-4" />
                                                      Compartir
                                                  </DropdownMenuItem>
                                                  <DropdownMenuItem className="text-red-600" onClick={() => toast.warning('Próximamente: Borrar Venta')}>
                                                      <Trash className="mr-2 h-4 w-4" />
                                                      Borrar
                                                  </DropdownMenuItem>
                                              </DropdownMenuContent>
                                          </DropdownMenu>
                                      </TableCell>
                                  </TableRow>
                              ))
                          ) : (
                              <TableRow>
                                  <TableCell colSpan={4} className="text-center h-24">No hay ventas para este sorteo todavía.</TableCell>
                              </TableRow>
                          )}
                      </TableBody>
                  </Table>
              </CardContent>
          </Card>
      )}

      {/* ---- MODAL DE RECIBO (SIN CAMBIOS) ---- */}
      {lastSale && selectedLottery && (
         <Dialog open={isReceiptOpen} onOpenChange={setIsReceiptOpen}>
            <DialogContent className="sm:max-w-md">
                 <DialogHeader>
                    <DialogTitle className="font-headline">Comprobante de Venta</DialogTitle>
                    <DialogDescription>Comprobante para la venta #{lastSale.id.slice(0, 8)}.</DialogDescription>
                </DialogHeader>
                <div ref={receiptRef} className="bg-white p-4">
                    <Receipt sale={lastSale} lotteryName={selectedLottery.name} drawTime={lastSale.drawTime} />
                </div>
                <DialogFooter className="mt-4">
                    <Button onClick={handleDownloadReceipt} className="w-full">
                        <Download className="mr-2 h-4 w-4" />
                        Descargar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// Envolver el componente en Suspense para el uso de useSearchParams
export default function SalesPage() {
    return (
        <Suspense fallback={<div>Cargando...</div>}>
            <SalesPageContent />
        </Suspense>
    );
}