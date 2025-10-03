'use client';

import { useMemo, useEffect, useState } from "react";
import { useParams, notFound, useSearchParams } from "next/navigation";
import { type Sale, type Lottery, type SpecialPlay } from "@/lib/data";
import { useForm } from "react-hook-form";
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

const specialPlaySaleSchema = z.object({
    customerName: z.string().optional(),
    customerPhone: z.string().optional(),
    picks: z.array(z.string()).refine(val => val.every(v => v.trim() !== ''), { message: 'Todos los números son requeridos.' }),
});

export default function LotterySalePage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const id = params.id as string;
    const isSpecial = searchParams.get('special') === 'true';

    const { sales, setSales, lotteries, specialPlays } = useStateContext();
    const { toast } = useToast();

    const item = useMemo(() => {
        return isSpecial 
            ? specialPlays.find(sp => sp.id === id) 
            : lotteries.find(l => l.id === id);
    }, [id, lotteries, specialPlays, isSpecial]);

    const [activeTab, setActiveTab] = useState("sell");
    const [selectedDraws, setSelectedDraws] = useState<{ lotteryId: string; drawTime: string; }[]>([]);
    const [saleToDelete, setSaleToDelete] = useState<string | null>(null);
    const [editingSale, setEditingSale] = useState<Sale | null>(null);
    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
    const [selectedSaleForReceipt, setSelectedSaleForReceipt] = useState<{sale: Sale, item: Lottery | SpecialPlay} | null>(null);

    const isSpecialPlay = item && isSpecial;
    const specialPlayItem = isSpecialPlay ? item as SpecialPlay : null;
    const lotteryItem = !isSpecialPlay ? item as Lottery : null;

    const standardForm = useForm<z.infer<typeof saleFormSchema>>({
        resolver: zodResolver(saleFormSchema(lotteryItem?.numberOfDigits ?? 2)),
        defaultValues: { customerName: "", customerPhone: "", tickets: [{ ticketNumber: "", fractions: 1 }] },
    });

    const specialPlayForm = useForm<z.infer<typeof specialPlaySaleSchema>>({
        resolver: zodResolver(specialPlaySaleSchema),
        defaultValues: { customerName: "", customerPhone: "", picks: Array(specialPlayItem?.numberOfPicks || 0).fill('') },
    });
    
    useEffect(() => {
        standardForm.reset({ customerName: "", customerPhone: "", tickets: [{ ticketNumber: "", fractions: 1 }] });
        specialPlayForm.reset({ customerName: "", customerPhone: "", picks: Array(specialPlayItem?.numberOfPicks || 0).fill('') });
        setSelectedDraws([]);
        setEditingSale(null);
    }, [id, isSpecial, standardForm, specialPlayForm, specialPlayItem]);

    if (!item) {
        notFound();
    }

    const handleStandardSubmit = (values: z.infer<typeof saleFormSchema>) => {
        if (selectedDraws.length === 0) {
            toast({ title: "Error", description: "Debes seleccionar al menos un sorteo.", variant: "destructive" });
            return;
        }

        const newSale: Sale = {
            id: `S${Date.now()}`,
            draws: selectedDraws,
            customerName: values.customerName,
            customerPhone: values.customerPhone,
            tickets: values.tickets.map(ticket => ({
                id: `T${Date.now()}-${ticket.ticketNumber}`,
                ticketNumber: ticket.ticketNumber,
                fractions: ticket.fractions,
                cost: ticket.fractions * item.cost,
            })),
            totalCost: values.tickets.reduce((acc, t) => acc + (t.fractions * item.cost), 0) * selectedDraws.length,
            soldAt: new Date(),
            lotteryId: item.id
        };
        setSales(prev => [...prev, newSale]);
        toast({ title: "¡Venta Exitosa!", description: `Venta registrada.` });
        standardForm.reset({ customerName: "", customerPhone: "", tickets: [{ ticketNumber: "", fractions: 1 }] });
        setSelectedDraws([]);
        setActiveTab("sales");
    };

    const handleSpecialPlaySubmit = (values: z.infer<typeof specialPlaySaleSchema>) => {
        if (selectedDraws.length === 0) {
            toast({ title: "Error", description: "Debes seleccionar al menos un sorteo.", variant: "destructive" });
            return;
        }

        const newSale: Sale = {
            id: `S${Date.now()}`,
            draws: selectedDraws,
            customerName: values.customerName,
            customerPhone: values.customerPhone,
            tickets: [{
                id: `T${Date.now()}`,
                ticketNumber: values.picks.join(' - '),
                fractions: 1,
                cost: item.cost * selectedDraws.length,
            }],
            totalCost: item.cost * selectedDraws.length,
            soldAt: new Date(),
            specialPlayId: item.id,
        };
        setSales(prev => [...prev, newSale]);
        toast({ title: "¡Venta Exitosa!", description: `Jugada especial '${item.name}' registrada.` });
        specialPlayForm.reset({ customerName: "", customerPhone: "", picks: Array(specialPlayItem?.numberOfPicks || 0).fill('') });
        setSelectedDraws([]);
        setActiveTab("sales");
    };
    
    const salesForItem = useMemo(() => {
        return sales
            .filter(s => isSpecial ? s.specialPlayId === id : s.lotteryId === id)
            .sort((a, b) => new Date(b.soldAt).getTime() - new Date(a.soldAt).getTime());
    }, [sales, id, isSpecial]);

    const handleDeleteSale = () => {
        if (saleToDelete) {
            setSales(prev => prev.filter(s => s.id !== saleToDelete));
            toast({ title: "Venta Eliminada", variant: "destructive" });
            setSaleToDelete(null); 
        }
    };

    const handleViewReceipt = (sale: Sale) => {
        if (!item) return;
        setSelectedSaleForReceipt({ sale, item });
        setIsReceiptModalOpen(true);
    };

    const Icon = item.icon.startsWith('data:image') ? null : (iconMap[item.icon as keyof typeof iconMap] || iconMap.ticket);

    const watchedPicks = specialPlayForm.watch('picks');
    const isSpecialPlayButtonDisabled = !watchedPicks || watchedPicks.some(p => p.trim() === '') || selectedDraws.length === 0;

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
                item={selectedSaleForReceipt?.item}
            />

            <div className="flex items-center gap-4">
                <Button asChild variant="outline" size="icon" className="h-8 w-8"><Link href="/dashboard/sorteos"><ArrowLeft className="h-4 w-4" /></Link></Button>
                {Icon ? <Icon className="h-10 w-10 text-primary" /> : <img src={item.icon} alt={item.name} className="w-10 h-10 rounded-full object-cover" />}
                <div>
                    <h1 className="text-3xl font-bold font-headline">{item.name}</h1>
                    <p className="text-sm text-muted-foreground">
                        {isSpecial ? `Jugada Especial - ${specialPlayItem?.numberOfPicks} Números` : `Sorteos: ${(item as Lottery).drawTimes.join(', ')}`}
                    </p>
                </div>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="sell">Vender</TabsTrigger>
                    <TabsTrigger value="sales">Ventas Realizadas</TabsTrigger>
                </TabsList>
                <TabsContent value="sell" className="pt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="font-headline">{isSpecial ? `Realizar Jugada` : "Vender Boletos"}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {isSpecialPlay ? (
                                <Form {...specialPlayForm}>
                                    <form onSubmit={specialPlayForm.handleSubmit(handleSpecialPlaySubmit)} className="space-y-6">
                                        <div>
                                            <Label className="text-base font-medium">1. Selecciona los Sorteos Participantes</Label>
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-6 rounded-md border p-4 mt-2">
                                                {lotteries.map(lottery => (
                                                    <div key={lottery.id}>
                                                        <p className="font-semibold mb-2">{lottery.name}</p>
                                                        <div className="space-y-2">
                                                            {lottery.drawTimes.map(time => (
                                                                <div key={time} className="flex items-center gap-2">
                                                                    <Checkbox 
                                                                        id={`${item.id}-${lottery.id}-${time}`}
                                                                        onCheckedChange={(checked) => setSelectedDraws(prev => checked ? [...prev, {lotteryId: lottery.id, drawTime: time}] : prev.filter(d => d.lotteryId !== lottery.id || d.drawTime !== time))}
                                                                        checked={selectedDraws.some(d => d.lotteryId === lottery.id && d.drawTime === time)}
                                                                    />
                                                                    <Label htmlFor={`${item.id}-${lottery.id}-${time}`} className="font-normal">{time}</Label>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <Label className="text-base font-medium">2. Ingresa los {specialPlayItem?.numberOfPicks} Números</Label>
                                            <div className={`grid grid-cols-${specialPlayItem?.numberOfPicks || 2} gap-4 mt-2`}>
                                                {Array.from({ length: specialPlayItem?.numberOfPicks || 0 }).map((_, index) => (
                                                    <FormField
                                                        key={index}
                                                        control={specialPlayForm.control}
                                                        name={`picks.${index}`}
                                                        render={({ field }) => (
                                                            <FormItem>
                                                                <FormControl>
                                                                    <Input placeholder={`Número ${index + 1}`} {...field} className="text-center font-mono text-lg" />
                                                                </FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )}
                                                    />
                                                ))}
                                            </div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField control={specialPlayForm.control} name="customerName" render={({ field }) => (<FormItem><FormLabel>Nombre Cliente (Opcional)</FormLabel><FormControl><Input placeholder="Nombre" {...field} /></FormControl></FormItem>)} />
                                            <FormField control={specialPlayForm.control} name="customerPhone" render={({ field }) => (<FormItem><FormLabel>Teléfono (Opcional)</FormLabel><FormControl><Input placeholder="Teléfono" {...field} /></FormControl></FormItem>)} />
                                        </div>

                                        <div className="text-xl font-bold text-right">Costo Total: <span className="text-primary">${(item.cost * selectedDraws.length).toFixed(2)}</span></div>
                                        
                                        <div className="flex justify-end pt-4">
                                            <Button type="submit" className="w-full sm:w-auto" disabled={isSpecialPlayButtonDisabled}>
                                                <PlusCircle className="mr-2 h-4 w-4" /> Completar Jugada
                                            </Button>
                                        </div>
                                        {isSpecialPlayButtonDisabled && <p className='text-xs text-center text-red-500 mt-2'>Debes seleccionar al menos un sorteo y rellenar todos los números.</p>}
                                    </form>
                                </Form>
                            ) : (
                                <Form {...standardForm}>
                                    <form onSubmit={standardForm.handleSubmit(handleStandardSubmit)} className="space-y-6">
                                         <Label className="text-base font-medium">1. Selecciona los Sorteos</Label>
                                         <div className="grid grid-cols-2 md:grid-cols-4 gap-4 rounded-md border p-4">
                                            {(item as Lottery).drawTimes.map(time => (
                                                <div key={time} className="flex items-center gap-2">
                                                    <Checkbox 
                                                        id={`${item.id}-${time}`}
                                                        onCheckedChange={(checked) => setSelectedDraws(prev => checked ? [...prev, {lotteryId: item.id, drawTime: time}] : prev.filter(d => d.drawTime !== time))}
                                                        checked={selectedDraws.some(d => d.drawTime === time)}
                                                    />
                                                    <Label htmlFor={`${item.id}-${time}`} className="font-normal">{time}</Label>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="grid grid-cols-2 gap-4">
                                          <FormField control={standardForm.control} name="customerName" render={({ field }) => (<FormItem><FormLabel>Nombre Cliente (Opcional)</FormLabel><FormControl><Input placeholder="Nombre" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                          <FormField control={standardForm.control} name="customerPhone" render={({ field }) => (<FormItem><FormLabel>Teléfono Cliente (Opcional)</FormLabel><FormControl><Input placeholder="Teléfono" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                        </div>
                                         <div className="space-y-2">
                                           <Label>2. Añade los Números ({(item as Lottery).numberOfDigits} cifras)</Label>
                                             {standardForm.watch('tickets').map((field, index) => (
                                                <div key={index} className="flex items-center gap-2">
                                                    <FormField control={standardForm.control} name={`tickets.${index}.ticketNumber`} render={({ field }) => (<FormItem className="flex-1"><FormControl><Input placeholder="Número" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                                    <FormField control={standardForm.control} name={`tickets.${index}.fractions`} render={({ field }) => (<FormItem className="w-24"><FormControl><Input type="number" placeholder="Cant." {...field} /></FormControl><FormMessage /></FormItem>)} />
                                                    <Button type="button" variant="ghost" size="icon" onClick={() => standardForm.setValue('tickets', standardForm.getValues('tickets').filter((_, i) => i !== index))} disabled={standardForm.getValues('tickets').length <= 1}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                                                </div>
                                            ))}
                                            <Button type="button" variant="outline" size="sm" onClick={() => standardForm.setValue('tickets', [...standardForm.getValues('tickets'), {ticketNumber: "", fractions: 1}])}><PlusCircle className="mr-2 h-4 w-4" /> Añadir Número</Button>
                                        </div>
                                        <div className="text-xl font-bold text-right">Costo Total: <span className="text-primary">${(standardForm.watch('tickets').reduce((acc, t) => acc + (t.fractions * item.cost), 0) * selectedDraws.length).toFixed(2)}</span></div>
                                        <div className="flex justify-end gap-2 pt-4">
                                            <Button type="submit" className="w-full sm:w-auto">
                                                <PlusCircle className="mr-2 h-4 w-4" /> Completar Venta
                                            </Button>
                                        </div>
                                    </form>
                                </Form>
                            )}
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
                                <TableHeader><TableRow><TableHead>Números</TableHead><TableHead>Sorteos</TableHead><TableHead>Cliente</TableHead><TableHead className="text-right">Total</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {salesForItem.length > 0 ? (salesForItem.map((sale) => (
                                        <TableRow key={sale.id}>
                                            <TableCell className="font-mono text-lg font-bold">{sale.tickets.map(t => t.ticketNumber).join(', ')}</TableCell>
                                            <TableCell>{sale.draws.map(d => (lotteries.find(l=>l.id===d.lotteryId)?.name||"") + " - " + d.drawTime).join(', ')}</TableCell>
                                            <TableCell>{sale.customerName || "-"}<p className="text-xs text-muted-foreground font-mono">{new Date(sale.soldAt).toLocaleString()}</p></TableCell>
                                            <TableCell className="text-right font-semibold">${sale.totalCost.toFixed(2)}</TableCell>
                                            <TableCell className="text-right">
                                                 <DropdownMenu>
                                                    <DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                      <DropdownMenuItem onClick={() => handleViewReceipt(sale)}><Eye className="mr-2 h-4 w-4"/>Ver Comprobante</DropdownMenuItem>
                                                      <DropdownMenuItem onClick={() => alert('Edit no implemented')}><Edit className="mr-2 h-4 w-4"/>Editar</DropdownMenuItem>
                                                      <DropdownMenuItem onClick={() => alert('Share not implemented')}><Share2 className="mr-2 h-4 w-4"/>Compartir</DropdownMenuItem>
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
