'use client';

import { useMemo, useEffect, useState } from "react";
import { useParams, notFound } from "next/navigation";
import { type Sale, type TicketDetail, type Lottery } from "@/lib/data";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowLeft, PlusCircle, Trash2, Share2, Printer, Receipt, Edit } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { iconMap } from "@/lib/icon-map";
import * as htmlToImage from 'html-to-image';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useStateContext } from "@/context/StateContext";
import ReceiptComponent from "@/components/receipt";

const TICKET_PRICE_PER_FRACTION = 0.20;

const ticketEntrySchema = z.object({
    ticketNumber: z.string().length(2, "Debe tener 2 dígitos").regex(/^\d{2}$/, "Debe ser un número del 00 al 99"),
    fractions: z.coerce.number().min(1, "Mínimo 1"),
});

const saleFormSchema = z.object({
    customerName: z.string().optional(),
    customerPhone: z.string().optional(),
    tickets: z.array(ticketEntrySchema).min(1, "Añade al menos un boleto."),
});

export default function LotteryDetailPage() {
    const params = useParams();
    const lotteryId = params.id as string;

    const { sales, setSales, lotteries } = useStateContext();
    const { toast } = useToast();

    const lottery = useMemo(() => lotteries.find((l) => l.id === lotteryId), [lotteryId, lotteries]);

    const [activeDrawTime, setActiveDrawTime] = useState(lottery?.drawTimes[0] || "");
    const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

    useEffect(() => {
        if (lottery) {
            setActiveDrawTime(lottery.drawTimes[0]);
        } else {
            notFound();
        }
    }, [lotteryId, lottery]);

    const saleForm = useForm<z.infer<typeof saleFormSchema>>({
        resolver: zodResolver(saleFormSchema),
        defaultValues: { customerName: "", customerPhone: "", tickets: [{ ticketNumber: "", fractions: 1 }] },
    });

    const { fields, append, remove } = useFieldArray({ control: saleForm.control, name: "tickets" });

    const editForm = useForm<z.infer<typeof saleFormSchema>>({ resolver: zodResolver(saleFormSchema) });

    const { fields: editFields, append: editAppend, remove: editRemove } = useFieldArray({ control: editForm.control, name: "tickets" });

    const onSaleSubmit = (values: z.infer<typeof saleFormSchema>) => {
        const ticketDetails: Omit<TicketDetail, 'id'>[] = values.tickets.map(ticket => ({
            ticketNumber: ticket.ticketNumber,
            fractions: ticket.fractions,
            cost: ticket.fractions * TICKET_PRICE_PER_FRACTION,
        }));
        const totalCost = ticketDetails.reduce((acc, ticket) => acc + ticket.cost, 0);
        const newSale: Sale = {
            id: `S${Date.now()}`,
            lotteryId: lotteryId,
            drawTime: activeDrawTime,
            customerName: values.customerName,
            customerPhone: values.customerPhone,
            tickets: ticketDetails.map(td => ({ ...td, id: `T${Date.now()}-${td.ticketNumber}` })),
            totalCost: totalCost,
            soldAt: new Date(),
        };
        setSales(prev => [...prev, newSale]);
        toast({ title: "¡Venta Exitosa!", description: `Venta ${newSale.id} creada.` });
        saleForm.reset({ customerName: "", customerPhone: "", tickets: [{ ticketNumber: "", fractions: 1 }] });
    };

    const onEditSubmit = (values: z.infer<typeof saleFormSchema>) => {
        if (!selectedSale) return;
        const updatedTickets: TicketDetail[] = values.tickets.map(ticket => ({
            id: `T${Date.now()}-${ticket.ticketNumber}`,
            ticketNumber: ticket.ticketNumber,
            fractions: ticket.fractions,
            cost: ticket.fractions * TICKET_PRICE_PER_FRACTION,
        }));
        const totalCost = updatedTickets.reduce((acc, ticket) => acc + ticket.cost, 0);
        const updatedSale: Sale = { ...selectedSale, customerName: values.customerName, customerPhone: values.customerPhone, tickets: updatedTickets, totalCost: totalCost };
        setSales(prev => prev.map(s => s.id === selectedSale.id ? updatedSale : s));
        toast({ title: "¡Venta Actualizada!", description: `Venta ${selectedSale.id} ha sido actualizada.` });
        setIsEditDialogOpen(false);
        setSelectedSale(null);
    };

    const openReceiptDialog = (sale: Sale) => {
        setSelectedSale(sale);
        setIsReceiptDialogOpen(true);
    };

    const openEditDialog = (sale: Sale) => {
        setSelectedSale(sale);
        editForm.reset({ customerName: sale.customerName, customerPhone: sale.customerPhone, tickets: sale.tickets.map(t => ({ ticketNumber: t.ticketNumber, fractions: t.fractions })) });
        setIsEditDialogOpen(true);
    };

    const handleDeleteSale = (saleId: string) => {
        setSales(sales.filter(s => s.id !== saleId));
        toast({ title: "Venta Eliminada", variant: "destructive" });
    };

    const handleShare = async (sale: Sale) => {
    const receiptElement = document.getElementById('receipt-content');
    if (!receiptElement) {
        toast({ title: "Error", description: "No se pudo encontrar el contenido del recibo.", variant: "destructive" });
        return;
    }

    try {
        const dataUrl = await htmlToImage.toPng(receiptElement, {
            pixelRatio: 2,
            quality: 1.0,
        });
        
        const blob = await (await fetch(dataUrl)).blob();
        const file = new File([blob], "comprobante.png", { type: "image/png" });

        if (navigator.share && navigator.canShare({ files: [file] })) {
            await navigator.share({
                files: [file],
                title: 'Comprobante de Venta',
                text: `Recibo de la venta ${sale.id}`,
            });
        } else {
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = 'comprobante.png';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            toast({ title: "Descargado", description: "El recibo ha sido descargado como una imagen." });
        }
    } catch (error) {
        console.error('Error al generar o compartir la imagen del recibo', error);
        toast({ title: "Error", description: "No se pudo generar o compartir la imagen del recibo.", variant: "destructive" });
    }
};
    
    const handlePrint = () => {
        const printContent = document.getElementById("receipt-content");
        if (printContent) {
            const originalContents = document.body.innerHTML;
            document.body.innerHTML = printContent.innerHTML;
            window.print();
            document.body.innerHTML = originalContents;
            window.location.reload(); 
        }
    }


    const salesForCurrentDraw = useMemo(() => {
        return sales.filter((s) => s.drawTime === activeDrawTime && s.lotteryId === lotteryId).sort((a, b) => new Date(b.soldAt).getTime() - new Date(a.soldAt).getTime());
    }, [sales, activeDrawTime, lotteryId]);

    if (!lottery) return null;

    const Icon = lottery.icon.startsWith('data:image') ? null : (iconMap[lottery.icon as keyof typeof iconMap] || iconMap.Ticket);
    const watchedSaleTickets = saleForm.watch("tickets");
    const totalSaleCost = watchedSaleTickets.reduce((acc, current) => acc + ((current.fractions || 0) * TICKET_PRICE_PER_FRACTION), 0);

    return (
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            <div className="flex items-center gap-4">
                <Button asChild variant="outline" size="icon" className="h-8 w-8"><Link href="/dashboard/lotteries"><ArrowLeft className="h-4 w-4" /><span className="sr-only">Atrás</span></Link></Button>
                 {Icon ? (
                    <Icon className="h-10 w-10 text-primary" />
                ) : (
                    <img src={lottery.icon} alt={lottery.name} className="w-10 h-10 rounded-full object-cover" />
                )}
                <h1 className="text-3xl font-bold font-headline">{lottery.name}</h1>
            </div>

            <Tabs value={activeDrawTime} onValueChange={setActiveDrawTime} className="w-full">
                <TabsList className={`grid w-full grid-cols-${lottery.drawTimes.length}`}>{lottery.drawTimes.map((time) => (<TabsTrigger key={time} value={time}>{time}</TabsTrigger>))}</TabsList>
                {lottery.drawTimes.map((time) => (
                    <TabsContent key={time} value={time}>
                        <Tabs defaultValue="sell" className="w-full">
                            <TabsList className="grid w-full grid-cols-2"> 
                                <TabsTrigger value="sell">Vender</TabsTrigger>
                                <TabsTrigger value="sales">Ventas Realizadas</TabsTrigger>
                            </TabsList>
                            <TabsContent value="sell" className="pt-6">
                                <Card><CardHeader><CardTitle className="font-headline">Vender Boletos</CardTitle><CardDescription>Crear una nueva venta para el sorteo de las {time}.</CardDescription></CardHeader>
                                    <CardContent>
                                        <Form {...saleForm}>
                                            <form onSubmit={saleForm.handleSubmit(onSaleSubmit)} className="space-y-6">
                                                <div className="grid grid-cols-2 gap-4">
                                                    <FormField control={saleForm.control} name="customerName" render={({ field }) => (<FormItem><FormLabel>Nombre Cliente</FormLabel><FormControl><Input placeholder="Opcional" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                                    <FormField control={saleForm.control} name="customerPhone" render={({ field }) => (<FormItem><FormLabel>Teléfono Cliente</FormLabel><FormControl><Input placeholder="Opcional" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                                </div>
                                                <div className="space-y-2">
                                                    <FormLabel>Boletos</FormLabel>
                                                    {fields.map((field, index) => (
                                                        <div key={field.id} className="flex items-center gap-2">
                                                            <FormField control={saleForm.control} name={`tickets.${index}.ticketNumber`} render={({ field }) => (<FormItem className="flex-1"><FormControl><Input placeholder="Número" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                                            <FormField control={saleForm.control} name={`tickets.${index}.fractions`} render={({ field }) => (<FormItem className="w-24"><FormControl><Input type="number" placeholder="Cant." {...field} /></FormControl><FormMessage /></FormItem>)} />
                                                            <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= 1}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                                        </div>
                                                    ))}
                                                    <Button type="button" variant="outline" size="sm" onClick={() => append({ ticketNumber: "", fractions: 1 })}><PlusCircle className="mr-2 h-4 w-4" /> Añadir Número</Button>
                                                </div>
                                                <div className="text-lg font-semibold text-right">Costo Total: <span className="text-primary">${totalSaleCost.toFixed(2)}</span></div>
                                                <Button type="submit" className="w-full"><PlusCircle className="mr-2 h-4 w-4" /> Completar Venta</Button>
                                            </form>
                                        </Form>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                            <TabsContent value="sales" className="pt-6">
                                <Card><CardHeader><CardTitle className="font-headline">Ventas Realizadas</CardTitle><CardDescription>Todas las ventas para el sorteo de las {time}.</CardDescription></CardHeader>
                                    <CardContent>
                                        <Table>
                                            <TableHeader><TableRow><TableHead>ID Venta</TableHead><TableHead>Cliente</TableHead><TableHead>Boletos</TableHead><TableHead className="text-right">Total</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
                                            <TableBody>
                                                {salesForCurrentDraw.length > 0 ? (salesForCurrentDraw.map((sale) => (
                                                    <TableRow key={sale.id}>
                                                        <TableCell className="font-mono">{sale.id}</TableCell>
                                                        <TableCell>{sale.customerName || "N/A"}<p className="text-xs text-muted-foreground font-mono">{new Date(sale.soldAt).toLocaleTimeString()}</p></TableCell>
                                                        <TableCell>{sale.tickets.length}</TableCell>
                                                        <TableCell className="text-right">${sale.totalCost.toFixed(2)}</TableCell>
                                                        <TableCell className="text-right">
                                                            <Button variant="ghost" size="icon" onClick={() => openReceiptDialog(sale)}><Receipt className="h-4 w-4" /></Button>
                                                            <Button variant="ghost" size="icon" onClick={() => handleShare(sale)}><Share2 className="h-4 w-4" /></Button>
                                                            <Button variant="ghost" size="icon" onClick={() => openEditDialog(sale)}><Edit className="h-4 w-4" /></Button>
                                                            <Button variant="ghost" size="icon" onClick={() => handleDeleteSale(sale.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                                        </TableCell>
                                                    </TableRow>
                                                ))) : (<TableRow><TableCell colSpan={5} className="text-center h-24">No se han registrado ventas.</TableCell></TableRow>)}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>
                            </TabsContent>
                        </Tabs>
                    </TabsContent>
                ))}
            </Tabs>

            {selectedSale && lottery && (
                <Dialog open={isReceiptDialogOpen} onOpenChange={setIsReceiptDialogOpen}>
                    <DialogContent className="sm:max-w-xs p-0 bg-white">
                        <div id="receipt-content">
                           <ReceiptComponent sale={selectedSale} lotteryName={lottery.name} drawTime={selectedSale.drawTime} />
                        </div>
                        <DialogFooter className="sm:justify-between gap-2 p-4 border-t">
                            <Button type="button" variant="secondary" onClick={() => handleShare(selectedSale)}><Share2 className="mr-2 h-4 w-4" /> Compartir</Button>
                            <Button type="button" onClick={handlePrint}><Printer className="mr-2 h-4 w-4" /> Imprimir</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
            
            {selectedSale && (
                <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Editar Venta</DialogTitle>
                            <DialogDescription>ID de la venta: {selectedSale.id}</DialogDescription>
                        </DialogHeader>
                        <Form {...editForm}>
                            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4 pt-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField control={editForm.control} name="customerName" render={({ field }) => (<FormItem><FormLabel>Nombre Cliente</FormLabel><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                    <FormField control={editForm.control} name="customerPhone" render={({ field }) => (<FormItem><FormLabel>Teléfono Cliente</Label><FormControl><Input {...field} /></FormControl></FormItem>)} />
                                </div>
                                <div className="space-y-2">
                                    <FormLabel>Boletos</FormLabel>
                                    {editFields.map((field, index) => (
                                        <div key={field.id} className="flex items-center gap-2">
                                            <FormField control={editForm.control} name={`tickets.${index}.ticketNumber`} render={({ field }) => (<FormItem className="flex-1"><FormControl><Input {...field} /></FormControl><FormMessage/></FormItem>)} />
                                            <FormField control={editForm.control} name={`tickets.${index}.fractions`} render={({ field }) => (<FormItem className="w-24"><FormControl><Input type="number" {...field} /></FormControl><FormMessage/></FormItem>)} />
                                            <Button type="button" variant="ghost" size="icon" onClick={() => editRemove(index)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                        </div>
                                    ))}
                                    <Button type="button" variant="outline" size="sm" onClick={() => editAppend({ ticketNumber: "", fractions: 1 })}><PlusCircle className="mr-2 h-4 w-4" /> Añadir Número</Button>
                                </div>
                                <DialogFooter>
                                    <Button type="button" variant="ghost" onClick={() => setIsEditDialogOpen(false)}>Cancelar</Button>
                                    <Button type="submit">Guardar Cambios</Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            )}
        </main>
    );
}
