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
import { type Sale, type Lottery } from '@/lib/data';
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

const ticketDetailSchema = z.object({
  ticketNumber: z.string().min(1, "Debe ingresar un número"),
  fractions: z.number().min(1, "La cantidad debe ser al menos 1"),
  cost: z.number().min(0.01, "El monto debe ser mayor que cero"),
});

const salesFormSchema = z.object({
  lotteryId: z.string().nonempty("Debe seleccionar un sorteo"),
  drawTime: z.string().nonempty("Debe seleccionar un horario"),
  customerName: z.string().min(2, "El nombre del cliente es requerido"),
  customerPhone: z.string().optional(),
  tickets: z.array(ticketDetailSchema).min(1, "Debe ingresar al menos un número"),
});

function SalesPageContent() {
  const { lotteries, sales, setSales } = useStateContext();
  const [activeSale, setActiveSale] = useState<Sale | null>(null);
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
  const activeLottery = lotteries.find(l => l.id === (activeSale?.lotteryId || selectedLotteryId));

  useEffect(() => {
    const lotteryIdFromUrl = searchParams.get('lotteryId');
    if (lotteryIdFromUrl && !form.getValues('lotteryId')) {
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
      tickets: values.tickets.map(t => ({ ...t, id: uuidv4() })),
      totalCost,
      soldAt: new Date(),
    };

    setSales(prevSales => [...prevSales, newSale]);
    setActiveSale(newSale);
    setIsReceiptOpen(true);
    
    toast.success('Venta registrada exitosamente', {
      description: `Se ha generado el ticket #${newSale.id.slice(0, 8)}...`,
    });

    form.reset({
        ...values,
        customerName: '',
        customerPhone: '',
        tickets: [],
    });
  };
  
  const handleShare = (sale: Sale) => {
      setActiveSale(sale);
      setIsReceiptOpen(true);
  };

  const handleDownloadReceipt = async () => {
    if (!receiptRef.current) return;
    try {
      const dataUrl = await toPng(receiptRef.current, { quality: 1.0, pixelRatio: 2 });
      const link = document.createElement('a');
      link.download = `comprobante-${activeSale?.id.slice(0, 8)}.png`;
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
          {/* ... FORMULARIO DE VENTA (SIN CAMBIOS) ... */}
      </Card>

      {selectedLotteryId && (
          <Card>
              <CardHeader>
                  <CardTitle>Historial de Ventas: {activeLottery?.name}</CardTitle>
                  <CardDescription>Aquí puedes ver y gestionar todos los tickets vendidos para este sorteo.</CardDescription>
              </CardHeader>
              <CardContent>
                  <Table>
                      <TableHeader>
                          <TableRow>
                              <TableHead>Cliente / Ticket</TableHead>
                              <TableHead>Números</TableHead>
                              <TableHead className="text-right">Monto</TableHead>
                              <TableHead>Fecha</TableHead>
                              <TableHead className="text-right">Acciones</TableHead>
                          </TableRow>
                      </TableHeader>
                      <TableBody>
                          {filteredSales.length > 0 ? (
                              filteredSales.map(sale => (
                                  <TableRow key={sale.id}>
                                      <TableCell>
                                          <div className="font-medium">{sale.customerName}</div>
                                          <div className="text-sm text-muted-foreground">ID: {sale.id.slice(0, 8)}...</div>
                                      </TableCell>
                                      <TableCell className="text-sm">
                                          {sale.tickets.map(t => t.ticketNumber).join(', ')}
                                      </TableCell>
                                      <TableCell className="text-right font-medium">${sale.totalCost.toFixed(2)}</TableCell>
                                      <TableCell>{format(new Date(sale.soldAt), "dd/MM/yy HH:mm")}</TableCell>
                                      <TableCell className="text-right">
                                          <DropdownMenu>
                                              <DropdownMenuTrigger asChild>
                                                  <Button variant="ghost" size="icon"><MoreHorizontal className="h-4 w-4" /></Button>
                                              </DropdownMenuTrigger>
                                              <DropdownMenuContent align="end">
                                                  <DropdownMenuItem onClick={() => handleShare(sale)}>
                                                      <Share2 className="mr-2 h-4 w-4" />
                                                      Compartir Recibo
                                                  </DropdownMenuItem>
                                                  <DropdownMenuItem onClick={() => toast.info('Próximamente: Editar Venta')}>
                                                      <Edit className="mr-2 h-4 w-4" />
                                                      Editar
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
                                  <TableCell colSpan={5} className="text-center h-24">No hay ventas para este sorteo todavía.</TableCell>
                              </TableRow>
                          )}
                      </TableBody>
                  </Table>
              </CardContent>
          </Card>
      )}

      {activeSale && activeLottery && (
         <Dialog open={isReceiptOpen} onOpenChange={setIsReceiptOpen}>
            <DialogContent className="sm:max-w-md bg-gray-100">
                 <DialogHeader>
                    <DialogTitle className="font-headline">Comprobante de Venta</DialogTitle>
                    <DialogDescription>ID: {activeSale.id}</DialogDescription>
                </DialogHeader>
                <div ref={receiptRef} className="bg-white p-4 mx-auto">
                    <Receipt sale={activeSale} lotteryName={activeLottery.name} drawTime={activeSale.drawTime} />
                </div>
                <DialogFooter className="mt-4 sm:justify-center">
                    <Button onClick={handleDownloadReceipt} className="w-full sm:w-auto">
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

export default function SalesPage() {
    return (
        <Suspense fallback={<div>Cargando...</div>}>
            <SalesPageContent />
        </Suspense>
    );
}