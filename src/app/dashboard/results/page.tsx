"use client";

import { useState, useMemo, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { lotteries, type Sale, type Winner } from "@/lib/data";
import { useStateContext } from "@/context/StateContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const resultsSchema = z.object({
    prize1: z.string().length(2, "Debe tener 2 dígitos").regex(/^\d{2}$/, "Debe ser un número del 00 al 99"),
    prize2: z.string().length(2, "Debe tener 2 dígitos").regex(/^\d{2}$/, "Debe ser un número del 00 al 99"),
    prize3: z.string().length(2, "Debe tener 2 dígitos").regex(/^\d{2}$/, "Debe ser un número del 00 al 99"),
});

export default function ResultsPage() {
    const { sales, winningResults, setWinningResults, winners, setWinners } = useStateContext();
    const { toast } = useToast();

    const [selectedLottery, setSelectedLottery] = useState(lotteries[0]);
    const [activeDrawTime, setActiveDrawTime] = useState(selectedLottery.drawTimes[0]);
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm<z.infer<typeof resultsSchema>>({
        resolver: zodResolver(resultsSchema),
        defaultValues: { prize1: "", prize2: "", prize3: "" },
    });
    
    const resultKey = `${selectedLottery.id}-${activeDrawTime}`;

    useEffect(() => {
        // Cuando la lotería seleccionada cambia, resetea la hora del sorteo a la primera disponible para esa lotería.
        if (selectedLottery) {
            setActiveDrawTime(selectedLottery.drawTimes[0]);
        }
    }, [selectedLottery]);

    useEffect(() => {
        // Cuando el sorteo activo cambia (ya sea por cambio de lotería o de hora), 
        // busca los resultados guardados y resetea el formulario.
        const winningNumbers = winningResults[resultKey];
        form.reset(
            winningNumbers 
                ? { prize1: winningNumbers.prize1 || "", prize2: winningNumbers.prize2 || "", prize3: winningNumbers.prize3 || "" }
                : { prize1: "", prize2: "", prize3: "" }
        );
    }, [resultKey, winningResults, form]);

    const onSubmit = (values: z.infer<typeof resultsSchema>) => {
        setIsLoading(true);
        
        const newWinningNumbers = { prize1: values.prize1, prize2: values.prize2, prize3: values.prize3 };
        setWinningResults(prev => ({ ...prev, [resultKey]: newWinningNumbers }));
        
        const salesForDraw = sales.filter(s => s.lotteryId === selectedLottery.id && s.drawTime === activeDrawTime);
        
        const foundWinners: Winner[] = [];
        salesForDraw.forEach(sale => {
            sale.tickets.forEach(ticket => {
                let prizeTier = 0;
                if (ticket.ticketNumber === values.prize1) prizeTier = 1;
                else if (ticket.ticketNumber === values.prize2) prizeTier = 2;
                else if (ticket.ticketNumber === values.prize3) prizeTier = 3;

                if (prizeTier > 0) {
                    const existingWinner = winners.find(w => w.id === ticket.id);
                    foundWinners.push({ 
                        id: ticket.id, 
                        prizeTier, 
                        ticketNumber: ticket.ticketNumber, 
                        fractions: ticket.fractions, 
                        customerName: sale.customerName || "N/A", 
                        saleId: sale.id, 
                        isPaid: existingWinner?.isPaid || false, 
                    });
                }
            });
        });
        
        setTimeout(() => {
            // Filtra los ganadores antiguos para mantener solo los que no pertenecen al sorteo actual
            const otherWinners = winners.filter(w => {
                const saleOfWinner = sales.find(s => s.id === w.saleId);
                return saleOfWinner?.lotteryId !== selectedLottery.id || saleOfWinner?.drawTime !== activeDrawTime;
            });

            const newWinners = [...otherWinners, ...foundWinners];
            setWinners(newWinners);
            setIsLoading(false);
            toast({ title: "Ganadores Determinados", description: `Se encontraron ${foundWinners.length} boletos ganadores para ${selectedLottery.name} a las ${activeDrawTime}.` });
        }, 500);
    };
    
    const currentWinnersInView = useMemo(() => {
        return winners.filter(w => {
            const sale = sales.find(s => s.id === w.saleId);
            return sale?.lotteryId === selectedLottery.id && sale?.drawTime === activeDrawTime;
        });
    }, [winners, selectedLottery, activeDrawTime, sales]);

    const togglePaidStatus = (ticketId: string) => {
        setWinners(prev => prev.map(w => w.id === ticketId ? { ...w, isPaid: !w.isPaid } : w));
    };

    return (
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold font-headline">Resultados del Sorteo</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <Card>
                    <CardHeader>
                        <CardTitle>Paso 1: Seleccionar Lotería</CardTitle>
                        <CardDescription>Elija la lotería para la cual desea ingresar los resultados.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Tabs
                            defaultValue={selectedLottery.id}
                            onValueChange={(lotteryId) => {
                                const newLottery = lotteries.find(l => l.id === lotteryId);
                                if (newLottery) {
                                    setSelectedLottery(newLottery);
                                }
                            }}
                            className="w-full"
                        >
                            <TabsList className="grid w-full grid-cols-2">
                                {lotteries.map(lottery => (
                                    <TabsTrigger key={lottery.id} value={lottery.id}>
                                        {lottery.name}
                                    </TabsTrigger>
                                ))}
                            </TabsList>
                        </Tabs>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Paso 2: Seleccionar Sorteo</CardTitle>
                        <CardDescription>Sorteos para: <span className="font-semibold">{selectedLottery.name}</span></CardDescription>
                    </CardHeader>
                    <CardContent>
                        {selectedLottery && activeDrawTime && (
                             <Tabs
                                value={activeDrawTime}
                                onValueChange={setActiveDrawTime}
                                className="w-full"
                            >
                                <TabsList className="grid w-full grid-cols-3">
                                    {selectedLottery.drawTimes.map(time => (
                                        <TabsTrigger key={time} value={time}>
                                            {time}
                                        </TabsTrigger>
                                    ))}
                                </TabsList>
                            </Tabs>
                        )}
                    </CardContent>
                </Card>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8 mt-4">
                <div className="md:col-span-1">
                    <Card>
                        <CardHeader>
                            <CardTitle>Ingresar Números Ganadores</CardTitle>
                            <CardDescription>Para <span className="font-semibold">{selectedLottery.name}</span> a las <span className="font-semibold">{activeDrawTime}</span>.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                    <FormField control={form.control} name="prize1" render={({ field }) => (<FormItem><FormLabel>1er Premio</FormLabel><FormControl><Input placeholder="e.g., 07" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={form.control} name="prize2" render={({ field }) => (<FormItem><FormLabel>2do Premio</FormLabel><FormControl><Input placeholder="e.g., 15" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    <FormField control={form.control} name="prize3" render={({ field }) => (<FormItem><FormLabel>3er Premio</FormLabel><FormControl><Input placeholder="e.g., 23" {...field} /></FormControl><FormMessage /></FormItem>)} />
                                    <Button type="submit" className="w-full" disabled={isLoading}>{isLoading ? "Buscando..." : "Determinar Ganadores"}</Button>
                                </form>
                            </Form>
                        </CardContent>
                    </Card>
                </div>

                <div className="md:col-span-2">
                    <Card>
                        <CardHeader>
                            <CardTitle>Ganadores</CardTitle>
                            <CardDescription>Boletos ganadores para <span className="font-semibold">{selectedLottery.name}</span> del sorteo de las <span className="font-semibold">{activeDrawTime}</span>.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader><TableRow><TableHead>Premio</TableHead><TableHead># Boleto</TableHead><TableHead>Cliente</TableHead><TableHead>Fracciones</TableHead><TableHead className="text-right">Estado</TableHead></TableRow></TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        <TableRow><TableCell colSpan={5} className="h-24 text-center">Buscando ganadores...</TableCell></TableRow>
                                    ) : currentWinnersInView.length > 0 ? (
                                        currentWinnersInView.sort((a,b) => a.prizeTier - b.prizeTier).map(winner => (
                                            <TableRow key={winner.id} className={winner.isPaid ? 'bg-muted/50 text-muted-foreground' : ''}>
                                                <TableCell><Badge variant={winner.prizeTier === 1 ? "default" : winner.prizeTier === 2 ? "secondary" : "outline"}>Premio {winner.prizeTier}</Badge></TableCell>
                                                <TableCell className="font-mono font-bold">{winner.ticketNumber}</TableCell>
                                                <TableCell>{winner.customerName}</TableCell>
                                                <TableCell>{winner.fractions}</TableCell>
                                                <TableCell className="text-right">
                                                    <Button variant={winner.isPaid ? "outline" : "default"} size="sm" onClick={() => togglePaidStatus(winner.id)}>{winner.isPaid ? "Pagado" : "Marcar Pagado"}</Button>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow><TableCell colSpan={5} className="h-24 text-center">No se encontraron ganadores para este sorteo.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </main>
    );
}
