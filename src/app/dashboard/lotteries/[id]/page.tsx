'use client';

import { useMemo, useEffect, useState } from "react";
import { useParams, notFound, useSearchParams } from "next/navigation";
import { type Sale, type TicketDetail, type Lottery, type SpecialPlay } from "@/lib/data";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowLeft, PlusCircle, Trash2, Share2, Printer, Receipt, Edit } from "lucide-react";
import Link from "next/link";
import { iconMap } from "@/lib/icon-map";
import * as htmlToImage from 'html-to-image';

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useStateContext } from "@/context/StateContext";
import ReceiptComponent from "@/components/receipt";

const ticketEntrySchema = (digits: number) => z.object({
    ticketNumber: z.string().length(digits, { message: `Debe tener ${digits} dígitos` }).regex(new RegExp(`^\\d{${digits}}$`), `Debe ser un número de ${digits} dígitos`),
    fractions: z.coerce.number().min(1, "Mínimo 1"),
});

const saleFormSchema = (digits: number) => z.object({
    customerName: z.string().optional(),
    customerPhone: z.string().optional(),
    tickets: z.array(ticketEntrySchema(digits)).min(1, "Añade al menos un boleto."),
});


export default function LotterySalePage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const id = params.id as string;
    const isSpecial = searchParams.get('special') === 'true';

    const { sales, setSales, lotteries, specialPlays } = useStateContext();
    const { toast } = useToast();

    const item: (Lottery | SpecialPlay) | undefined = useMemo(() => {
        return isSpecial 
            ? specialPlays.find(sp => sp.id === id) 
            : lotteries.find(l => l.id === id);
    }, [id, lotteries, specialPlays, isSpecial]);

    // State for special play draw selection
    const [selectedDraws, setSelectedDraws] = useState<{ lotteryId: string; drawTime: string; }[]>([]);
    
    const [activeDrawTime, setActiveDrawTime] = useState<string>("");

     useEffect(() => {
        if (!isSpecial && item) {
            const lottery = item as Lottery;
            if (lottery.drawTimes.length > 0) {
                setActiveDrawTime(lottery.drawTimes[0]);
            }
        }
    }, [item, isSpecial]);

    // Dynamic schema based on item
    const currentSaleFormSchema = useMemo(() => saleFormSchema(item?.numberOfDigits ?? 2), [item]);

    const form = useForm<z.infer<typeof currentSaleFormSchema>>({
        resolver: zodResolver(currentSaleFormSchema),
        defaultValues: { customerName: "", customerPhone: "", tickets: [{ ticketNumber: "", fractions: 1 }] },
    });
    const { fields, append, remove } = useFieldArray({ control: form.control, name: "tickets" });


    if (!item) {
        notFound();
    }

    const handleDrawSelectionChange = (lotteryId: string, drawTime: string, isChecked: boolean) => {
        setSelectedDraws(prev => {
            const existing = prev.find(d => d.lotteryId === lotteryId && d.drawTime === drawTime);
            if (isChecked && !existing) {
                return [...prev, { lotteryId, drawTime }];
            }
            if (!isChecked && existing) {
                return prev.filter(d => d.lotteryId !== lotteryId || d.drawTime !== drawTime);
            }
            return prev;
        });
    };

    const onSubmit = async (values: z.infer<typeof currentSaleFormSchema>) => {
        if (!item) return;

        const costPerFraction = item.cost;
        const ticketDetailsTemplate = values.tickets.map(ticket => ({
            ticketNumber: ticket.ticketNumber,
            fractions: ticket.fractions,
            cost: ticket.fractions * costPerFraction,
        }));
        const singleDrawTotalCost = ticketDetailsTemplate.reduce((acc, ticket) => acc + ticket.cost, 0);

        if (isSpecial) {
            if (selectedDraws.length === 0) {
                toast({ title: "Error", description: "Debes seleccionar al menos un sorteo.", variant: "destructive" });
                return;
            }
            const newSales: Sale[] = selectedDraws.map(draw => ({
                id: `S${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
                lotteryId: draw.lotteryId,
                drawTime: draw.drawTime,
                customerName: values.customerName,
                customerPhone: values.customerPhone,
                tickets: ticketDetailsTemplate.map(td => ({ ...td, id: `T${Date.now()}-${td.ticketNumber}` })),
                totalCost: singleDrawTotalCost,
                soldAt: new Date(),
                specialPlayId: item.id
            }));
            setSales(prev => [...prev, ...newSales]);
            toast({ title: "¡Venta Exitosa!", description: `Se crearon ${newSales.length} participaciones.` });
        } else {
             const lottery = item as Lottery;
             const newSale: Sale = {
                id: `S${Date.now()}`,
                lotteryId: lottery.id,
                drawTime: activeDrawTime,
                customerName: values.customerName,
                customerPhone: values.customerPhone,
                tickets: ticketDetailsTemplate.map(td => ({ ...td, id: `T${Date.now()}-${td.ticketNumber}` })),
                totalCost: singleDrawTotalCost,
                soldAt: new Date(),
            };
            setSales(prev => [...prev, newSale]);
            const lotteryForSale = lotteries.find(l => l.id === newSale.lotteryId);
            toast({ title: "¡Venta Exitosa!", description: `Venta creada para ${lotteryForSale?.name} a las ${activeDrawTime}.` });
        }

        form.reset({ customerName: "", customerPhone: "", tickets: [{ ticketNumber: "", fractions: 1 }] });
        setSelectedDraws([]);
    };

    const salesForCurrentDraw = useMemo(() => {
        if (isSpecial) return []; // Sales view is not shown for special plays
        return sales.filter((s) => s.drawTime === activeDrawTime && s.lotteryId === item.id).sort((a, b) => new Date(b.soldAt).getTime() - new Date(a.soldAt).getTime());
    }, [sales, activeDrawTime, item, isSpecial]);

    const Icon = item.icon.startsWith('data:image') ? null : (iconMap[item.icon as keyof typeof iconMap] || iconMap.Ticket);
    
    const watchedSaleTickets = form.watch("tickets");
    const costMultiplier = isSpecial ? selectedDraws.length : 1;
    const baseTotalCost = watchedSaleTickets.reduce((acc, current) => acc + ((current.fractions || 0) * (item.cost || 0)), 0);
    const totalSaleCost = baseTotalCost * costMultiplier;

    return (
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            <div className="flex items-center gap-4">
                <Button asChild variant="outline" size="icon" className="h-8 w-8"><Link href="/dashboard/lotteries"><ArrowLeft className="h-4 w-4" /><span className="sr-only">Atrás</span></Link></Button>
                 {Icon ? (
                    <Icon className="h-10 w-10 text-primary" />
                ) : (
                    <img src={item.icon} alt={item.name} className="w-10 h-10 rounded-full object-cover" />
                )}
                <div>
                    <h1 className="text-3xl font-bold font-headline">{item.name}</h1>
                    {isSpecial && <p className="text-sm text-muted-foreground">Jugada Especial</p>}
                </div>
            </div>

            {isSpecial ? (
                 <Card>
                    <CardHeader>
                        <CardTitle className="font-headline">Vender Boletos</CardTitle>
                        <CardDescription>Crea una nueva venta para esta jugada especial.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                 <div className="space-y-4">
                                    <Label className="text-base font-medium">Aplicar a Sorteos:</Label>
                                    <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-6 rounded-md border p-4">
                                        {(item as SpecialPlay).appliesTo.map(({ lotteryId, drawTimes }) => {
                                            const lottery = lotteries.find(l => l.id === lotteryId);
                                            if (!lottery) return null;
                                            return (
                                                <div key={lotteryId}>
                                                    <p className="font-semibold mb-2">{lottery.name}</p>
                                                    <div className="space-y-2">
                                                        {drawTimes.map(time => (
                                                            <div key={time} className="flex items-center gap-2">
                                                                <Checkbox 
                                                                    id={`${item.id}-${lotteryId}-${time}`}
                                                                    onCheckedChange={(checked) => handleDrawSelectionChange(lotteryId, time, !!checked)}
                                                                />
                                                                <Label htmlFor={`${item.id}-${lotteryId}-${time}`} className="font-normal">{time}</Label>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField control={form.control} name="customerName" render={({ field }) => (<FormItem><FormLabel>Nombre Cliente</FormLabel><FormControl><Input placeholder="Opcional" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={form.control} name="customerPhone" render={({ field }) => (<FormItem><FormLabel>Teléfono Cliente</FormLabel><FormControl><Input placeholder="Opcional" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                </div>
                                <div className="space-y-2">
                                    <FormLabel>Boletos ({item.numberOfDigits} cifras)</FormLabel>
                                    {fields.map((field, index) => (
                                        <div key={field.id} className="flex items-center gap-2">
                                            <FormField control={form.control} name={`tickets.${index}.ticketNumber`} render={({ field }) => (<FormItem className="flex-1"><FormControl><Input placeholder="Número" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                            <FormField control={form.control} name={`tickets.${index}.fractions`} render={({ field }) => (<FormItem className="w-24"><FormControl><Input type="number" placeholder="Cant." {...field} /></FormControl><FormMessage /></FormItem>)} />
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
            ) : (
                 <Tabs value={activeDrawTime} onValueChange={setActiveDrawTime} className="w-full">
                    <TabsList className={`grid w-full grid-cols-${(item as Lottery).drawTimes.length}`}>
                        {(item as Lottery).drawTimes.map((time) => (<TabsTrigger key={time} value={time}>{time}</TabsTrigger>))}
                    </TabsList>
                    {(item as Lottery).drawTimes.map((time) => (
                        <TabsContent key={time} value={time}>
                            <Tabs defaultValue="sell" className="w-full">
                                <TabsList className="grid w-full grid-cols-2"> 
                                    <TabsTrigger value="sell">Vender</TabsTrigger>
                                    <TabsTrigger value="sales">Ventas Realizadas</TabsTrigger>
                                </TabsList>
                                <TabsContent value="sell" className="pt-6">
                                    <Card><CardHeader><CardTitle className="font-headline">Vender Boletos</CardTitle><CardDescription>Crear una nueva venta para el sorteo de las {time}.</CardDescription></CardHeader>
                                        <CardContent>
                                            <Form {...form}>
                                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <FormField control={form.control} name="customerName" render={({ field }) => (<FormItem><FormLabel>Nombre Cliente</FormLabel><FormControl><Input placeholder="Opcional" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                                        <FormField control={form.control} name="customerPhone" render={({ field }) => (<FormItem><FormLabel>Teléfono Cliente</FormLabel><FormControl><Input placeholder="Opcional" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <FormLabel>Boletos</FormLabel>
                                                        {fields.map((field, index) => (
                                                            <div key={field.id} className="flex items-center gap-2">
                                                                <FormField control={form.control} name={`tickets.${index}.ticketNumber`} render={({ field }) => (<FormItem className="flex-1"><FormControl><Input placeholder="Número" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                                                <FormField control={form.control} name={`tickets.${index}.fractions`} render={({ field }) => (<FormItem className="w-24"><FormControl><Input type="number" placeholder="Cant." {...field} /></FormControl><FormMessage /></FormItem>)} />
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
                                                <TableHeader><TableRow><TableHead>ID Venta</TableHead><TableHead>Cliente</TableHead><TableHead>Boletos</TableHead><TableHead className="text-right">Total</TableHead></TableRow></TableHeader>
                                                <TableBody>
                                                    {salesForCurrentDraw.length > 0 ? (salesForCurrentDraw.map((sale) => (
                                                        <TableRow key={sale.id}>
                                                            <TableCell className="font-mono">{sale.id}</TableCell>
                                                            <TableCell>{sale.customerName || "N/A"}<p className="text-xs text-muted-foreground font-mono">{new Date(sale.soldAt).toLocaleTimeString()}</p></TableCell>
                                                            <TableCell>{sale.tickets.length}</TableCell>
                                                            <TableCell className="text-right">${sale.totalCost.toFixed(2)}</TableCell>
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
            )}
        </main>
    );
}
