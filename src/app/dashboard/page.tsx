'use client';

import { useState, useRef } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { v4 as uuidv4 } from 'uuid';
import { toPng } from 'html-to-image';
import { useStateContext } from '@/context/StateContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Trash2, PlusCircle, Download } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import Receipt from '@/components/receipt'; // Importar el nuevo componente de recibo
import { type Sale } from '@/lib/data';

const numberEntrySchema = z.object({
  number: z.string().min(1, "Debe ingresar un número"),
  quantity: z.number().min(1, "La cantidad debe ser al menos 1"),
  amount: z.number().min(0.01, "El monto debe ser mayor que cero"),
});

const salesFormSchema = z.object({
  lotteryId: z.string().nonempty("Debe seleccionar un sorteo"),
  drawTime: z.string().nonempty("Debe seleccionar un horario"),
  customerName: z.string().min(2, "El nombre del cliente es requerido"),
  customerPhone: z.string().optional(),
  numbers: z.array(numberEntrySchema).min(1, "Debe ingresar al menos un número"),
});

export default function DashboardPage() {
  const { lotteries, setSales } = useStateContext();
  const [lastSale, setLastSale] = useState<Sale | null>(null);
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const receiptRef = useRef<HTMLDivElement>(null);

  const form = useForm<z.infer<typeof salesFormSchema>>({
    resolver: zodResolver(salesFormSchema),
    defaultValues: {
      lotteryId: '',
      drawTime: '',
      customerName: '',
      customerPhone: '',
      numbers: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'numbers',
  });

  const selectedLotteryId = form.watch('lotteryId');
  const selectedLottery = lotteries.find(l => l.id === selectedLotteryId);

  const onSubmit = (values: z.infer<typeof salesFormSchema>) => {
    const totalAmount = values.numbers.reduce((sum, num) => sum + num.amount, 0);

    const newSale: Sale = {
      id: uuidv4(),
      ...values,
      totalAmount,
      timestamp: new Date().toISOString(),
    };

    setSales(prevSales => [...prevSales, newSale]);
    setLastSale(newSale);
    setIsReceiptOpen(true);
    
    toast.success('Venta registrada exitosamente', {
      description: `Se ha generado el ticket #${newSale.id.slice(0, 8)}...`,
    });

    form.reset();
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

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Registrar Nueva Venta</CardTitle>
          <CardDescription>Completa los detalles para generar un nuevo ticket de lotería.</CardDescription>
        </CardHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="lotteryId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sorteo</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un sorteo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {lotteries.map(lottery => (
                            <SelectItem key={lottery.id} value={lottery.id}>{lottery.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="drawTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Horario del Sorteo</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!selectedLottery}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecciona un horario" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {selectedLottery?.drawTimes.map(time => (
                            <SelectItem key={time} value={time}>{time}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                 <FormField
                  control={form.control}
                  name="customerName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre del Cliente</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Juan Pérez" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                 <FormField
                  control={form.control}
                  name="customerPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teléfono (Opcional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: 0991234567" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-medium mb-4">Números Jugados</h3>
                {fields.map((field, index) => {
                  const watchedNumber = form.watch(`numbers.${index}.number`);
                  const isValid = selectedLottery ? watchedNumber?.length === selectedLottery.numberOfDigits : false;

                  return (
                    <div key={field.id} className="flex items-center gap-4 mb-4">
                        <FormField
                            control={form.control}
                            name={`numbers.${index}.number`}
                            render={({ field }) => (
                                <FormItem className="flex-1">
                                    <FormControl>
                                        <Input 
                                            placeholder={`Número de ${selectedLottery?.numberOfDigits || ''} cifras`} 
                                            {...field} 
                                            maxLength={selectedLottery?.numberOfDigits}
                                            className={!isValid && watchedNumber?.length > 0 ? 'border-destructive' : ''}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name={`numbers.${index}.quantity`}
                            render={({ field }) => (
                                <FormItem className="w-24">
                                    <FormControl>
                                        <Input type="number" placeholder="Cant." {...field} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name={`numbers.${index}.amount`}
                            render={({ field }) => (
                                <FormItem className="w-28">
                                    <FormControl>
                                        <Input type="number" placeholder="Monto $" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                      <Button type="button" variant="destructive" size="icon" onClick={() => remove(index)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  );
                })}
                <Button
                  type="button"
                  variant="outline"
                  className="w-full mt-2"
                  onClick={() => append({ number: '', quantity: 1, amount: 1 })}
                  disabled={!selectedLottery}
                >
                  <PlusCircle className="mr-2" />
                  Añadir Número
                </Button>
              </div>
            </CardContent>
            <CardFooter>
              <Button type="submit" size="lg" className="w-full">Generar Ticket</Button>
            </CardFooter>
          </form>
        </Form>
      </Card>

      {lastSale && selectedLottery && (
         <Dialog open={isReceiptOpen} onOpenChange={setIsReceiptOpen}>
            <DialogContent className="sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl bg-gray-100">
                 <DialogHeader>
                    <DialogTitle className="font-headline">Comprobante de Venta</DialogTitle>
                </DialogHeader>
                <div ref={receiptRef}>
                    <Receipt 
                        sale={lastSale} 
                        lotteryName={selectedLottery.name} 
                        drawTime={lastSale.drawTime}
                    />
                </div>
                <DialogFooter className="mt-4">
                    <Button onClick={handleDownloadReceipt} className="w-full">
                        <Download className="mr-2" />
                        Descargar Comprobante
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      )}
    </>
  );
}
