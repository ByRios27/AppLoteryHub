"use client";

import { useState, useMemo, useEffect } from "react";
import { useParams, notFound } from "next/navigation";
import { lotteries, type SoldTicket } from "@/lib/data";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowLeft, PlusCircle, Trash2, Edit, Share2, Printer, X, Award } from "lucide-react";
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

const TICKET_PRICE_PER_FRACTION = 0.20;

// Schema for a single ticket entry in the form
const ticketEntrySchema = z.object({
  ticketNumber: z.string()
    .length(2, "2 digits")
    .regex(/^\\d{2}$/, "00-99"),
  fractions: z.coerce.number().min(1, "Min 1"),
});

// Main schema for the entire sale form
const saleFormSchema = z.object({
  customerName: z.string().optional(),
  customerPhone: z.string().optional(),
  tickets: z.array(ticketEntrySchema).min(1, "Please add at least one ticket."),
});

const resultsFormSchema = z.object({
  winningNumber: z.string()
    .length(2, "Must be 2 digits")
    .regex(/^\\d{2}$/, "Must be 2 digits from 00 to 99"),
});


export default function LotteryDetailPage() {
  const params = useParams();
  const lotteryId = params.id as string;
  
  const initialLottery = useMemo(() => lotteries.find((l) => l.id === lotteryId), [lotteryId]);
  
  const [lottery, setLottery] = useState(initialLottery);
  const [soldTickets, setSoldTickets] = useState<SoldTicket[]>([]);
  const [activeTab, setActiveTab] = useState(lottery?.drawTimes[0] || "");
  const [isTicketDialogOpen, setIsTicketDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SoldTicket | null>(null);
  const [winningResults, setWinningResults] = useState<{ [key: string]: string }>({});

  const { toast } = useToast();

  useEffect(() => {
    const foundLottery = lotteries.find((l) => l.id === lotteryId);
    if (!foundLottery) {
      notFound();
    }
    setLottery(foundLottery);
    if (foundLottery) {
      setActiveTab(foundLottery.drawTimes[0]);
    }
  }, [lotteryId]);

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
    const newTickets: SoldTicket[] = values.tickets.map(ticket => ({
      id: `T${Date.now()}-${ticket.ticketNumber}`,
      lotteryId: lotteryId,
      drawTime: activeTab,
      ticketNumber: ticket.ticketNumber,
      fractions: ticket.fractions,
      cost: ticket.fractions * TICKET_PRICE_PER_FRACTION,
      soldAt: new Date(),
      customerName: values.customerName,
      customerPhone: values.customerPhone,
    }));

    setSoldTickets(prev => [...prev, ...newTickets]);
    toast({
      title: "Sale Successful!",
      description: `Sold ${newTickets.length} ticket(s) to ${values.customerName || 'customer'}.`,
    });
    saleForm.reset({
        customerName: "",
        customerPhone: "",
        tickets: [{ ticketNumber: "", fractions: 1 }],
    });
  };
  
  const onResultsSubmit = (values: z.infer<typeof resultsFormSchema>) => {
    setWinningResults(prev => ({ ...prev, [activeTab]: values.winningNumber }));
    toast({
      title: "Result Saved!",
      description: `The winning number for the ${activeTab} draw is ${values.winningNumber}.`,
    });
    resultsForm.reset();
  };

  const openTicketDialog = (ticket: SoldTicket) => {
    setSelectedTicket(ticket);
    setIsTicketDialogOpen(true);
  };
  
  const handleDeleteTicket = (ticketId: string) => {
    setSoldTickets(soldTickets.filter(t => t.id !== ticketId));
    toast({
        title: "Ticket Deleted",
        description: `Ticket has been removed successfully.`,
        variant: "destructive"
    });
  }

  const ticketsForCurrentDraw = useMemo(() => {
    return soldTickets.filter((t) => t.drawTime === activeTab && t.lotteryId === lotteryId);
  }, [soldTickets, activeTab, lotteryId]);
  
  const winningNumberForCurrentDraw = winningResults[activeTab];

  if (!lottery) {
    return null;
  }

  const Icon = iconMap[lottery.icon] || iconMap.Ticket;
  
  const watchedTickets = saleForm.watch("tickets");
  const totalCost = watchedTickets.reduce((acc, current) => {
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
          ))}\
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
                        )}/>
                        <FormField control={saleForm.control} name="customerPhone" render={({ field }) => (
                            <FormItem><FormLabel>Customer Phone</FormLabel><FormControl><Input placeholder="+1 123 456 7890" {...field} /></FormControl><FormMessage /></FormItem>
                        )}/>
                      </div>
                      
                      <div className="space-y-2">
                        <FormLabel>Tickets</FormLabel>
                        {fields.map((field, index) => (
                          <div key={field.id} className="flex items-center gap-2">
                            <FormField control={saleForm.control} name={`tickets.${index}.ticketNumber`} render={({ field }) => (
                                <FormItem className="flex-1"><FormControl><Input placeholder="No." {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <FormField control={saleForm.control} name={`tickets.${index}.fractions`} render={({ field }) => (
                               <FormItem className="flex-1"><FormControl><Input type="number" placeholder="Frac." {...field} /></FormControl><FormMessage /></FormItem>
                            )}/>
                            <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} disabled={fields.length <= 1}>
                                <X className="h-4 w-4 text-destructive"/>
                            </Button>
                          </div>
                        ))}
                         <Button type="button" variant="outline" size="sm" onClick={() => append({ ticketNumber: "", fractions: 1 })}>
                            <PlusCircle className="mr-2 h-4 w-4" /> Add Number
                        </Button>
                      </div>

                      <div className="text-lg font-semibold text-right">
                        Total Cost: <span className="text-primary">${totalCost.toFixed(2)}</span>
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
                                            <Input placeholder="e.g., 42" {...field} value={winningResults[time] || field.value} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}/>
                                <div className="pt-8">
                                    <Button type="submit"><Award className="mr-2 h-4 w-4" /> Save Result</Button>
                                </div>
                            </form>
                        </Form>
                    </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="font-headline">Sold Tickets</CardTitle>
                    <CardDescription>
                        {winningNumberForCurrentDraw ? `Winning Number: ${winningNumberForCurrentDraw}` : `Tickets sold for the ${time} draw.`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Number</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead>Fractions</TableHead>
                          <TableHead className="text-right">Cost</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {ticketsForCurrentDraw.length > 0 ? (
                          ticketsForCurrentDraw.map((ticket) => {
                            const isWinner = winningNumberForCurrentDraw === ticket.ticketNumber;
                            return (
                                <TableRow key={ticket.id} className={cn(isWinner && "bg-green-100 dark:bg-green-900")}>
                                    <TableCell className="font-medium">{ticket.ticketNumber}</TableCell>
                                    <TableCell>{ticket.customerName || "-"}</TableCell>
                                    <TableCell>{ticket.fractions}</TableCell>
                                    <TableCell className="text-right">${ticket.cost.toFixed(2)}</TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => openTicketDialog(ticket)}>
                                            <Share2 className="h-4 w-4" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleDeleteTicket(ticket.id)}>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            );
                          })
                        ) : (
                          <TableRow><TableCell colSpan={5} className="text-center h-24">No tickets sold yet.</TableCell></TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        ))}\
      </Tabs>
      
      {selectedTicket && (
        <Dialog open={isTicketDialogOpen} onOpenChange={setIsTicketDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="font-headline">Digital Ticket Voucher</DialogTitle>
              <DialogDescription>
                Lottery: {lottery.name} | Draw: {selectedTicket.drawTime}
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center gap-4 py-4">
              {qrCodeImage && <div className="relative w-40 h-40">
                <Image src={qrCodeImage.imageUrl} alt={qrCodeImage.description} fill={true} data-ai-hint={qrCodeImage.imageHint} />
              </div>}
              <div className="text-center">
                 <p className="text-sm text-muted-foreground">Ticket for</p>
                 <p className="text-lg font-semibold">{selectedTicket.customerName || 'N/A'}</p>
                 <p className="text-xs text-muted-foreground">{selectedTicket.customerPhone || ''}</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Ticket Number</p>
                <p className="text-5xl font-bold font-mono">{selectedTicket.ticketNumber}</p>
              </div>
              <div className="flex gap-8">
                <div className="text-center">
                    <p className="text-sm text-muted-foreground">Fractions</p>
                    <p className="text-2xl font-semibold">{selectedTicket.fractions}</p>
                </div>
                <div className="text-center">
                    <p className="text-sm text-muted-foreground">Total Cost</p>
                    <p className="text-2xl font-semibold">${selectedTicket.cost.toFixed(2)}</p>
                </div>
              </div>
              <p className="text-xs text-muted-foreground pt-4">
                Sold on: {new Date(selectedTicket.soldAt).toLocaleString()}
              </p>
            </div>
            <DialogFooter className="sm:justify-between gap-2">
                <Button type="button" variant="secondary" onClick={() => {toast({title: "Sharing not implemented."})}}><Share2 className="mr-2 h-4 w-4" /> Share</Button>
                <Button type="button" onClick={() => {toast({title: "Printing not implemented."})}}><Printer className="mr-2 h-4 w-4" /> Print</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </main>
  );
}