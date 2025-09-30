'use client';

import { useMemo, useEffect, useState } from "react";
import { useParams, notFound, useSearchParams } from "next/navigation";
import { type Sale, type Lottery, type SpecialPlay } from "@/lib/data";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowLeft, PlusCircle, Trash2, MoreHorizontal, Eye, Edit, Share2 } from "lucide-react";
import Link from "next/link";
import { iconMap } from "@/lib/icon-map";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { useStateContext } from "@/context/StateContext";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { SaleReceiptModal } from "@/components/SaleReceiptModal";

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

    const [selectedDraws, setSelectedDraws] = useState<{ lotteryId: string; drawTime: string; }[]>([]);
    const [saleToDelete, setSaleToDelete] = useState<string | null>(null);
    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
    const [selectedSaleForReceipt, setSelectedSaleForReceipt] = useState<{sale: Sale, lottery: Lottery} | null>(null);

    const currentSaleFormSchema = useMemo(() => saleFormSchema(item?.numberOfDigits ?? 2), [item]);

    const form = useForm<z.infer<typeof currentSaleFormSchema>>({
        resolver: zodResolver(currentSaleFormSchema),
        defaultValues: { customerName: "", customerPhone: "", tickets: [{ ticketNumber: "", fractions: 1 }] },
    });
    const { fields, append, remove } = useFieldArray({ control: form.control, name: "tickets" });

    useEffect(() => {
        setSelectedDraws([]);
        form.reset({ customerName: "", customerPhone: "", tickets: [{ ticketNumber: "", fractions: 1 }] });
    }, [id, isSpecial, form]);

    if (!item) {
        notFound();
    }

    const handleDrawSelectionChange = (lotteryId: string, drawTime: string, isChecked: boolean) => {
        setSelectedDraws(prev => {
            const existing = Array.isArray(prev) ? prev.find(d => d.lotteryId === lotteryId && d.drawTime === drawTime) : undefined;
            if (isChecked && !existing) {
                return [...(Array.isArray(prev) ? prev : []), { lotteryId, drawTime }];
            }
            if (!isChecked && existing) {
                return (Array.isArray(prev) ? prev : []).filter(d => d.lotteryId !== lotteryId || d.drawTime !== drawTime);
            }
            return prev;
        });
    };

    const onSubmit = async (values: z.infer<typeof currentSaleFormSchema>) => {
        if (!item || selectedDraws.length === 0) {
            toast({ title: "Error", description: "Debes seleccionar al menos un sorteo.", variant: "destructive" });
            return;
        }

        const costPerFraction = item.cost;
        const baseTotalCost = values.tickets.reduce((acc, ticket) => acc + (ticket.fractions * costPerFraction), 0);
        const totalCost = baseTotalCost * (isSpecial ? selectedDraws.length : 1);

        const newSale: Sale = {
            id: `S${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
            draws: selectedDraws,
            customerName: values.customerName,
            customerPhone: values.customerPhone,
            tickets: values.tickets.map(ticket => ({
                id: `T${Date.now()}-${ticket.ticketNumber}-${Math.random()}`,
                ticketNumber: ticket.ticketNumber,
                fractions: ticket.fractions,
                cost: ticket.fractions * costPerFraction,
            })),
            totalCost: totalCost,
            soldAt: new Date(),
            specialPlayId: isSpecial ? item.id : undefined,
        };
        
        setSales(prev => [...prev, newSale]);
        toast({ title: "¡Venta Exitosa!", description: `Se ha registrado la venta para ${selectedDraws.length} sorteo(s).` });

        form.reset({ customerName: "", customerPhone: "", tickets: [{ ticketNumber: "", fractions: 1 }] });
        setSelectedDraws([]);
    };

    const salesForItem = useMemo(() => {
        if (isSpecial) {
            return sales.filter(s => s.specialPlayId === item.id)
                        .sort((a, b) => new Date(b.soldAt).getTime() - new Date(a.soldAt).getTime());
        } else {
            return sales.filter(s => Array.isArray(s.draws) && s.draws.some(d => d.lotteryId === item.id))
                        .sort((a, b) => new Date(b.soldAt).getTime() - new Date(a.soldAt).getTime());
        }
    }, [sales, item, isSpecial]);

    const handleDeleteSale = () => {
        if (saleToDelete) {
            setSales(prev => prev.filter(s => s.id !== saleToDelete));
            toast({ title: "Venta Eliminada", description: "La venta ha sido eliminada con éxito." });
            setSaleToDelete(null); 
        }
    };

    const handleViewReceipt = (sale: Sale) => {
        let lotteryForReceipt: Lottery | undefined;

        if (isSpecial) {
            const firstDraw = Array.isArray(sale.draws) ? sale.draws[0] : undefined;
            if (firstDraw) {
                lotteryForReceipt = lotteries.find(l => l.id === firstDraw.lotteryId);
            }
        } else {
            lotteryForReceipt = item as Lottery;
        }

        if (!lotteryForReceipt) {
            toast({ title: "Error", description: "No se pudo encontrar la lotería asociada a esta venta.", variant: "destructive" });
            return;
        }

        setSelectedSaleForReceipt({ sale, lottery: lotteryForReceipt });
        setIsReceiptModalOpen(true);
    };

    const handleShareSale = async (sale: Sale) => {
        const lotteryDetails = Array.isArray(sale.draws) ? sale.draws.map(draw => {
            const lottery = lotteries.find(l => l.id === draw.lotteryId);
            return `${lottery?.name || 'Sorteo'} - ${draw.drawTime}`;
        }).join('\n') : '';

        const ticketDetails = Array.isArray(sale.tickets) ? sale.tickets.map(t => `Nº ${t.ticketNumber}`).join(', ') : '';

        const shareText = `*Comprobante de Venta*\n\n*Números:* ${ticketDetails}\n*Sorteos:*\n${lotteryDetails}\n\n*Total:* $${sale.totalCost.toFixed(2)}`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Comprobante de Venta',
                    text: shareText,
                });
                toast({ title: "¡Compartido!", description: "El ticket se ha compartido con éxito." });
            } catch (error) {
                toast({ title: "Error al compartir", description: "No se pudo compartir el ticket.", variant: "destructive" });
            }
        } else {
            navigator.clipboard.writeText(shareText);
            toast({ title: "¡Copiado!", description: "Los detalles del ticket se han copiado al portapapeles." });
        }
    };

    const Icon = item.icon.startsWith('data:image') ? null : (iconMap[item.icon as keyof typeof iconMap] || iconMap.Ticket);
    
    const watchedSaleTickets = form.watch("tickets");
    const costMultiplier = selectedDraws.length > 0 ? selectedDraws.length : 1;
    const baseTotalCost = watchedSaleTickets.reduce((acc, current) => acc + ((current.fractions || 0) * (item.cost || 0)), 0);
    const totalSaleCost = isSpecial ? (baseTotalCost * costMultiplier) : baseTotalCost;

    const renderDrawSelector = () => {
        if (isSpecial) {
            return (
                 <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-6 rounded-md border p-4">
                    {lotteries.map(lottery => (
                        <div key={lottery.id}>
                            <p className="font-semibold mb-2">{lottery.name}</p>
                            <div className="space-y-2">
                                {lottery.drawTimes.map(time => (
                                    <div key={time} className="flex items-center gap-2">
                                        <Checkbox 
                                            id={`${item.id}-${lottery.id}-${time}`}
                                            onCheckedChange={(checked) => handleDrawSelectionChange(lottery.id, time, !!checked)}
                                            checked={Array.isArray(selectedDraws) && selectedDraws.some(d => d.lotteryId === lottery.id && d.drawTime === time)}
                                        />
                                        <Label htmlFor={`${item.id}-${lottery.id}-${time}`} className="font-normal">{time}</Label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )
        } else {
            const lottery = item as Lottery;
            return (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 rounded-md border p-4">
                    {lottery.drawTimes.map(time => (
                        <div key={time} className="flex items-center gap-2">
                            <Checkbox 
                                id={`${lottery.id}-${time}`}
                                onCheckedChange={(checked) => handleDrawSelectionChange(lottery.id, time, !!checked)}
                                checked={Array.isArray(selectedDraws) && selectedDraws.some(d => d.lotteryId === lottery.id && d.drawTime === time)}
                            />
                            <Label htmlFor={`${lottery.id}-${time}`} className="font-normal">{time}</Label>
                        </div>
                    ))}
                </div>
            )
        }
    }

    return (
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            <AlertDialog open={!!saleToDelete} onOpenChange={(open) => !open && setSaleToDelete(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                        <AlertDialogDescription>Esta acción no se puede deshacer. Esto eliminará permanentemente la venta.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteSale}>Sí, eliminar</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            <SaleReceiptModal 
                open={isReceiptModalOpen} 
                onOpenChange={setIsReceiptModalOpen}
                sale={selectedSaleForReceipt?.sale}
                lottery={selectedSaleForReceipt?.lottery}
            />

            <div className="flex items-center gap-4">
                <Button asChild variant="outline" size="icon" className="h-8 w-8"><Link href="/dashboard/lotteries"><ArrowLeft className="h-4 w-4" /><span className="sr-only">Atrás</span></Link></Button>
                 {Icon ? (
                    <Icon className="h-10 w-10 text-primary" />
                ) : (
                    <img src={item.icon} alt={item.name} className="w-10 h-10 rounded-full object-cover" />
                )}
                <div>
                    <h1 className="text-3xl font-bold font-headline">{item.name}</h1>
                    <p className="text-sm text-muted-foreground">
                        {isSpecial ? "Jugada Especial" : `Sorteos: ${(item as Lottery).drawTimes.join(', ')}`}
                    </p>
                </div>
            </div>

            <Tabs defaultValue="sell" className="w-full">
                <TabsList className="grid w-full grid-cols-2"> 
                    <TabsTrigger value="sell">Vender</TabsTrigger>
                    <TabsTrigger value="sales">Ventas Realizadas</TabsTrigger>
                </TabsList>
                <TabsContent value="sell" className="pt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-headline">Vender Boletos</CardTitle>
                            <CardDescription>
                                {isSpecial ? "Crea una nueva venta para esta jugada especial." : `Crea una nueva venta para ${item.name}.`}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                                     <div className="space-y-4">
                                        <Label className="text-base font-medium">1. Selecciona los Sorteos</Label>
                                        {renderDrawSelector()}
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <FormField control={form.control} name="customerName" render={({ field }) => (<FormItem><FormLabel>Nombre Cliente</FormLabel><FormControl><Input placeholder="Opcional" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        <FormField control={form.control} name="customerPhone" render={({ field }) => (<FormItem><FormLabel>Teléfono Cliente</FormLabel><FormControl><Input placeholder="Opcional" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    </div>

                                    <div className="space-y-2">
                                        <FormLabel>2. Añade los Números ({item.numberOfDigits} cifras)</FormLabel>
                                        {fields.map((field, index) => (
                                            <div key={field.id} className="flex items-center gap-2">
                                                <FormField control={form.control} name={`tickets.${index}.ticketNumber`} render={({ field }) => (<FormItem className="flex-1"><FormControl><Input placeholder="Número" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                                <FormField control={form.control} name={`tickets.${index}.fractions`} render={({ field }) => (<FormItem className="w-24"><FormControl><Input type="number" placeholder="Cant." {...field} /></FormControl><FormMessage /></FormItem>)} />
                                                <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= 1}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                            </div>
                                        ))}
                                        <Button type="button" variant="outline" size="sm" onClick={() => append({ ticketNumber: "", fractions: 1 })}><PlusCircle className="mr-2 h-4 w-4" /> Añadir Número</Button>
                                    </div>
                                    <div className="text-xl font-bold text-right">Costo Total: <span className="text-primary">${totalSaleCost.toFixed(2)}</span></div>
                                    <Button type="submit" className="w-full"><PlusCircle className="mr-2 h-4 w-4" /> Completar Venta</Button>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                </TabsContent>
                <TabsContent value="sales" className="pt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-headline">Ventas Realizadas</CardTitle>
                            <CardDescription>Un resumen de todas las ventas para {item.name}.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[25%]">Números</TableHead>
                                        <TableHead className="w-[35%]">Sorteos</TableHead>
                                        <TableHead>Cliente</TableHead>
                                        <TableHead className="text-right">Total</TableHead>
                                        <TableHead className="text-right">Acciones</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {salesForItem.length > 0 ? (salesForItem.map((sale) => (
                                        <TableRow key={sale.id}>
                                            <TableCell className="font-mono text-lg font-bold">
                                                {(Array.isArray(sale.tickets) ? sale.tickets : []).map(t => t.ticketNumber).join(', ')}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                {(Array.isArray(sale.draws) ? sale.draws : []).map(draw => {
                                                    const lotteryName = lotteries.find(l => l.id === draw.lotteryId)?.name || 'Lotería no encontrada';
                                                    return (
                                                        <span key={`${draw.lotteryId}-${draw.drawTime}`}>{lotteryName} - {draw.drawTime}</span>
                                                    )
                                                })}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                {sale.customerName || "-"}
                                                <p className="text-xs text-muted-foreground font-mono">{new Date(sale.soldAt).toLocaleString()}</p>
                                            </TableCell>
                                            <TableCell className="text-right font-semibold">${sale.totalCost.toFixed(2)}</TableCell>
                                            <TableCell className="text-right">
                                                 <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <span className="sr-only">Abrir menú</span>
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={() => handleViewReceipt(sale)}><Eye className="mr-2 h-4 w-4"/>Ver Ticket</DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => toast({ title: 'Próximamente', description: 'La edición de ventas estará disponible pronto.' })}><Edit className="mr-2 h-4 w-4"/>Editar</DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleShareSale(sale)}><Share2 className="mr-2 h-4 w-4"/>Compartir</DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => setSaleToDelete(sale.id)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4"/>Borrar</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))) : (<TableRow><TableCell colSpan={5} className="text-center h-24">No se han registrado ventas.</TableCell></TableRow>)}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </main>
    );
}
