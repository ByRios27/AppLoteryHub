"use client";

import { useMemo, useEffect, useState } from "react";
import { useParams, notFound } from "next/navigation";
import { lotteries, type Sale, type TicketDetail } from "@/lib/data";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowLeft, PlusCircle, Trash2, Share2, Printer, X, Award, Receipt } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import placeholderImages from '@/lib/placeholder-images.json';
import { iconMap } from "@/lib/icon-map";
import { useStateContext } from "@/context/StateContext";

const TICKET_PRICE_PER_FRACTION = 0.20;

const ticketEntrySchema = z.object({
    ticketNumber: z.string()
        .length(2, "Must be 2 digits")
        .regex(/^\d{2}$/, "Must be a number from 00 to 99"),
    fractions: z.coerce.number().min(1, "Min 1"),
});

const saleFormSchema = z.object({
    customerName: z.string().optional(),
    customerPhone: z.string().optional(),
    tickets: z.array(ticketEntrySchema).min(1, "Please add at least one ticket."),
});

const resultsFormSchema = z.object({
    winningNumber: z.string()
        .length(2, "Must be 2 digits")
        .regex(/^\d{2}$/, "Must be a number from 00 to 99"),
});

export default function LotteryDetailPage() {
    const params = useParams();
    const lotteryId = params.id as string;

    const { sales, setSales, winningResults, setWinningResults } = useStateContext();

    const lottery = useMemo(() => lotteries.find((l) => l.id === lotteryId), [lotteryId]);

    const [activeTab, setActiveTab] = useState(lottery?.drawTimes[0] || "");
    const [isReceiptDialogOpen, setIsReceiptDialogOpen] = useState(false);
    const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

    const { toast } = useToast();

    useEffect(() => {
        if (lottery) {
            setActiveTab(lottery.drawTimes[0]);
        } else {
            notFound();
        }
    }, [lotteryId, lottery]);

    const saleForm = useForm<z.infer<typeof saleFormSchema>>({
        resolver: zodResolver(saleFormSchema),
        defaultValues: {
            customerName: "",
            customerPhone: "",
            tickets: [{ ticketNumber: "", fractions: 1 }],
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: saleForm.control,
        name: "tickets",
    });

    const resultsForm = useForm<z.infer<typeof resultsFormSchema>>({
        resolver: zodResolver(resultsFormSchema),
        defaultValues: { winningNumber: "" },
    });

    const onSaleSubmit = (values: z.infer<typeof saleFormSchema>) => {
        const ticketDetails: TicketDetail[] = values.tickets.map(ticket => ({
            id: `T${Date.now()}-${ticket.ticketNumber}`,
            ticketNumber: ticket.ticketNumber,
            fractions: ticket.fractions,
            cost: ticket.fractions * TICKET_PRICE_PER_FRACTION,
        }));

        const totalCost = ticketDetails.reduce((acc, ticket) => acc + ticket.cost, 0);

        const newSale: Sale = {
            id: `S${Date.now()}`,
            lotteryId: lotteryId,
            drawTime: activeTab,
            customerName: values.customerName,
            customerPhone: values.customerPhone,
            tickets: ticketDetails,
            totalCost: totalCost,
            soldAt: new Date(),
        };

        setSales(prev => [...prev, newSale]);
        toast({
            title: "Sale Successful!",
            description: `Sold ${newSale.tickets.length} ticket(s) to ${values.customerName || 'customer'} for a total of $${newSale.totalCost.toFixed(2)}.`,
        });
        saleForm.reset({
            customerName: "",
            customerPhone: "",
            tickets: [{ ticketNumber: "", fractions: 1 }],
        });
    };

    const onResultsSubmit = (values: z.infer<typeof resultsFormSchema>) => {
        setWinningResults(prev => ({ ...prev, [`${lotteryId}-${activeTab}`]: values.winningNumber }));
        toast({
            title: "Result Saved!",
            description: `The winning number for the ${activeTab} draw is ${values.winningNumber}.`
        });
    };

    const openReceiptDialog = (sale: Sale) => {
        setSelectedSale(sale);
        setIsReceiptDialogOpen(true);
    };

    const handleDeleteSale = (saleId: string) => {
        setSales(sales.filter(s => s.id !== saleId));
        toast({
            title: "Sale Deleted",
            description: `Sale has been removed successfully.`,
            variant: "destructive"
        });
    }

    const salesForCurrentDraw = useMemo(() => {
        return sales.filter((s) => s.drawTime === activeTab && s.lotteryId === lotteryId);
    }, [sales, activeTab, lotteryId]);

    const winningNumberForCurrentDraw = winningResults[`${lotteryId}-${activeTab}`];

    if (!lottery) {
        return null;
    }

    const Icon = iconMap[lottery.icon] || iconMap.Ticket;

    const watchedTickets = saleForm.watch("tickets");
    const totalSaleCost = watchedTickets.reduce((acc, current) => {
        const fractions = current.fractions || 0;
        return acc + (fractions * TICKET_PRICE_PER_FRACTION);
    }, 0);

    const qrCodeImage = placeholderImages.placeholderImages.find(p => p.id === "qr-code");

    return (
        <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            <div className="flex items-center gap-4">
                <Button asChild variant="outline" size="icon" className="h-8 w-8">
                    <Link href="/dashboard">
                        <ArrowLeft className="h-4 w-4" />
                        <span className="sr-only">Back</span>
                    </Link>
                </Button>
                <Icon className="h-10 w-10 text-primary" />
                <h1 className="text-3xl font-bold font-headline">{lottery.name}</h1>
            </div>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                <TabsList>
                    {lottery.drawTimes.map((time) => (
                        <TabsTrigger key={time} value={time}>
                            {time}
                        </TabsTrigger>
                    ))}
                </TabsList>
                {lottery.drawTimes.map((time) => (
                    <TabsContent key={time} value={time}>
                        <div className="grid gap-8 lg:grid-cols-3">
                            <Card className="lg:col-span-1">
                                <CardHeader>
                                    <CardTitle className="font-headline">Sell New Tickets</CardTitle>
                                    <CardDescription>Enter customer and ticket details for the {time} draw.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <Form {...saleForm}>
                                        <form onSubmit={saleForm.handleSubmit(onSaleSubmit)} className="space-y-6">
                                            <div className="grid grid-cols-2 gap-4">
                                                <FormField control={saleForm.control} name="customerName" render={({ field }) => (
                                                    <FormItem><FormLabel>Customer Name</FormLabel><FormControl><Input placeholder="John Doe" {...field} /></FormControl><FormMessage /></FormItem>
                                                )} />
                                                <FormField control={saleForm.control} name="customerPhone" render={({ field }) => (
                                                    <FormItem><FormLabel>Customer Phone</FormLabel><FormControl><Input placeholder="+1 123 456 7890" {...field} /></FormControl><FormMessage /></FormItem>
                                                )} />
                                            </div>

                                            <div className="space-y-2">
                                                <FormLabel>Tickets</FormLabel>
                                                {fields.map((field, index) => (
                                                    <div key={field.id} className="flex items-center gap-2">
                                                        <FormField control={saleForm.control} name={`tickets.${index}.ticketNumber`} render={({ field }) => (
                                                            <FormItem className="flex-1"><FormControl><Input placeholder="No." {...field} /></FormControl><FormMessage /></FormItem>
                                                        )} />
                                                        <FormField control={saleForm.control} name={`tickets.${index}.fractions`} render={({ field }) => (
                                                            <FormItem className="flex-1"><FormControl><Input type="number" placeholder="Frac." {...field} /></FormControl><FormMessage /></FormItem>
                                                        )} />
                                                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= 1}>
                                                            <X className="h-4 w-4 text-destructive" />
                                                        </Button>
                                                    </div>
                                                ))}
                                                <Button type="button" variant="outline" size="sm" onClick={() => append({ ticketNumber: "", fractions: 1 })}>
                                                    <PlusCircle className="mr-2 h-4 w-4" /> Add Number
                                                </Button>
                                            </div>

                                            <div className="text-lg font-semibold text-right">
                                                Total Cost: <span className="text-primary">${totalSaleCost.toFixed(2)}</span>
                                            </div>
                                            <Button type="submit" className="w-full">
                                                <PlusCircle className="mr-2 h-4 w-4" />
                                                Complete Sale
                                            </Button>
                                        </form>
                                    </Form>
                                </CardContent>
                            </Card>

                            <div className="lg:col-span-2 space-y-8">
                                <Card>
                                    <CardHeader>
                                        <CardTitle className="font-headline">Enter Results</CardTitle>
                                        <CardDescription>Enter the winning number for the {time} draw to see winners.</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Form {...resultsForm}>
                                            <form onSubmit={resultsForm.handleSubmit(onResultsSubmit)} className="flex items-start gap-4">
                                                <FormField control={resultsForm.control} name="winningNumber" render={({ field }) => (
                                                    <FormItem className="flex-1">
                                                        <FormLabel>Winning Number</FormLabel>
                                                        <FormControl>
                                                            <Input placeholder="e.g., 42" {...field} />
                                                        </FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )} />
                                                <div className="pt-8">
                                                    <Button type="submit"><Award className="mr-2 h-4 w-4" /> Save Result</Button>
                                                </div>
                                            </form>
                                        </Form>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader>
                                        <CardTitle className="font-headline">Sales for this Draw</CardTitle>
                                        <CardDescription>
                                            {winningNumberForCurrentDraw ? `Winning Number: ${winningNumberForCurrentDraw}` : `All sales for the ${time} draw.`}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead>Customer</TableHead>
                                                    <TableHead># Tickets</TableHead>
                                                    <TableHead>Winning Numbers</TableHead>
                                                    <TableHead className="text-right">Total</TableHead>
                                                    <TableHead className="text-right">Actions</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {salesForCurrentDraw.length > 0 ? (
                                                    salesForCurrentDraw.map((sale) => {
                                                        const winningTickets = sale.tickets.filter(t => t.ticketNumber === winningNumberForCurrentDraw);
                                                        const isWinner = winningTickets.length > 0;
                                                        return (
                                                            <TableRow key={sale.id} className={cn(isWinner && "bg-green-100 dark:bg-green-900")}>
                                                                <TableCell>{sale.customerName || "N/A"}</TableCell>
                                                                <TableCell>{sale.tickets.length}</TableCell>
                                                                <TableCell className="font-mono">{isWinner ? winningTickets.map(t => t.ticketNumber).join(', ') : '-'}</TableCell>
                                                                <TableCell className="text-right">${sale.totalCost.toFixed(2)}</TableCell>
                                                                <TableCell className="text-right">
                                                                    <Button variant="ghost" size="icon" onClick={() => openReceiptDialog(sale)}>
                                                                        <Receipt className="h-4 w-4" />
                                                                    </Button>
                                                                    <Button variant="ghost" size="icon" onClick={() => handleDeleteSale(sale.id)}>
                                                                        <Trash2 className="h-4 w-4 text-destructive" />
                                                                    </Button>
                                                                </TableCell>
                                                            </TableRow>
                                                        );
                                                    })
                                                ) : (
                                                    <TableRow><TableCell colSpan={5} className="text-center h-24">No sales recorded yet.</TableCell></TableRow>
                                                )}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>
                            </div>
                        </div>
                    </TabsContent>
                ))}
            </Tabs>

            {selectedSale && (
                <Dialog open={isReceiptDialogOpen} onOpenChange={setIsReceiptDialogOpen}>
                    <DialogContent className="sm:max-w-lg">
                        <DialogHeader>
                            <DialogTitle className="font-headline">Digital Sale Receipt</DialogTitle>
                            <DialogDescription>
                                Lottery: {lottery.name} | Draw: {selectedSale.drawTime}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="flex flex-col gap-4 py-4">
                          <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                  <p className="font-semibold">Customer:</p>
                                  <p>{selectedSale.customerName || 'N/A'}</p>
                                  <p>{selectedSale.customerPhone || ''}</p>
                              </div>
                              <div className="text-right">
                                  <p className="font-semibold">Sale ID:</p>
                                  <p className="font-mono text-xs">{selectedSale.id}</p>
                                  <p className="text-xs">{new Date(selectedSale.soldAt).toLocaleString()}</p>
                              </div>
                          </div>
                          
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead>Number</TableHead>
                                <TableHead>Fractions</TableHead>
                                <TableHead className="text-right">Cost</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {selectedSale.tickets.map(ticket => (
                                <TableRow key={ticket.id}>
                                  <TableCell className="font-mono font-bold text-lg">{ticket.ticketNumber}</TableCell>
                                  <TableCell>{ticket.fractions}</TableCell>
                                  <TableCell className="text-right">${ticket.cost.toFixed(2)}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>

                          <div className="text-2xl font-bold text-right mt-4">
                            Total: <span className="text-primary">${selectedSale.totalCost.toFixed(2)}</span>
                          </div>

                          {qrCodeImage && <div className="flex justify-center pt-4">
                              <div className="relative w-32 h-32">
                                  <Image src={qrCodeImage.imageUrl} alt={qrCodeImage.description} layout="fill" objectFit="contain" data-ai-hint={qrCodeImage.imageHint} />
                              </div>
                          </div>}
                        </div>
                        <DialogFooter className="sm:justify-between gap-2">
                            <Button type="button" variant="secondary" onClick={() => { toast({ title: "Sharing not implemented." }) }}><Share2 className="mr-2 h-4 w-4" /> Share</Button>
                            <Button type="button" onClick={() => { toast({ title: "Printing not implemented." }) }}><Printer className="mr-2 h-4 w-4" /> Print</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}
        </main>
    );
}
