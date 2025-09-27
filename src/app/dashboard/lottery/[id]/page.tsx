"use client";

import { useState, useMemo, useEffect } from "react";
import { useParams } from "next/navigation";
import { lotteries, type SoldTicket } from "@/lib/data";
import { notFound } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { ArrowLeft, PlusCircle, Trash2, Edit, Share2, Printer, QrCode } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableCaption } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import placeholderImages from '@/lib/placeholder-images.json';
import { iconMap } from "@/lib/icon-map";

const TICKET_PRICE_PER_FRACTION = 0.20;

const ticketFormSchema = z.object({
  ticketNumber: z.string()
    .length(2, "Must be 2 digits")
    .regex(/^\d{2}$/, "Must be 2 digits from 00 to 99"),
  fractions: z.coerce.number().min(1, "At least 1 fraction"),
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

  const { toast } = useToast();

  useEffect(() => {
    const foundLottery = lotteries.find((l) => l.id === lotteryId);
    if (!foundLottery) {
      notFound();
    }
    setLottery(foundLottery);
    if(foundLottery) {
      setActiveTab(foundLottery.drawTimes[0]);
    }
  }, [lotteryId]);

  const form = useForm<z.infer<typeof ticketFormSchema>>({
    resolver: zodResolver(ticketFormSchema),
    defaultValues: { ticketNumber: "", fractions: 1 },
  });

  const onSubmit = (values: z.infer<typeof ticketFormSchema>) => {
    const newTicket: SoldTicket = {
      id: `T${Date.now()}`,
      lotteryId: lotteryId,
      drawTime: activeTab,
      ticketNumber: values.ticketNumber,
      fractions: values.fractions,
      cost: values.fractions * TICKET_PRICE_PER_FRACTION,
      soldAt: new Date(),
    };
    setSoldTickets([...soldTickets, newTicket]);
    toast({
      title: "Ticket Sold!",
      description: `Sold ${values.fractions} fractions of #${values.ticketNumber}.`,
    });
    form.reset();
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

  if (!lottery) {
    return null; // Or a loading spinner, notFound handles the server render case
  }

  const Icon = iconMap[lottery.icon] || iconMap.Ticket;

  const fractions = form.watch("fractions");
  const calculatedCost = isNaN(fractions) ? 0 : fractions * TICKET_PRICE_PER_FRACTION;
  
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
            <div className="grid gap-8 lg:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="font-headline">Sell New Ticket</CardTitle>
                  <CardDescription>Enter details for the {time} draw.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                         <FormField
                          control={form.control}
                          name="ticketNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Number (00-99)</FormLabel>
                              <FormControl>
                                <Input placeholder="e.g., 42" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                         <FormField
                          control={form.control}
                          name="fractions"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Fractions</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="e.g., 10" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="text-lg font-semibold text-right">
                        Total Cost: <span className="text-primary">${calculatedCost.toFixed(2)}</span>
                      </div>
                      <Button type="submit" className="w-full">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Sell Ticket
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="font-headline">Sold Tickets</CardTitle>
                  <CardDescription>Tickets sold for the {time} draw.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Number</TableHead>
                        <TableHead>Fractions</TableHead>
                        <TableHead className="text-right">Cost</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {ticketsForCurrentDraw.length > 0 ? (
                        ticketsForCurrentDraw.map((ticket) => (
                          <TableRow key={ticket.id}>
                            <TableCell className="font-medium">{ticket.ticketNumber}</TableCell>
                            <TableCell>{ticket.fractions}</TableCell>
                            <TableCell className="text-right">${ticket.cost.toFixed(2)}</TableCell>
                            <TableCell className="text-right">
                                <Button variant="ghost" size="icon" onClick={() => openTicketDialog(ticket)}>
                                    <Share2 className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" disabled>
                                    <Edit className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" onClick={() => handleDeleteTicket(ticket.id)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell colSpan={4} className="text-center h-24">No tickets sold yet.</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        ))}
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
                <Image src={qrCodeImage.imageUrl} alt={qrCodeImage.description} fill={true} data-ai-hint={qrCodeImage.imageHint}/>
              </div>}
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
                <Button type="button" variant="secondary" onClick={() => {toast({title: "Sharing not implemented."})}}>
                  <Share2 className="mr-2 h-4 w-4" /> Share
                </Button>
                <Button type="button" onClick={() => {toast({title: "Printing not implemented."})}}>
                  <Printer className="mr-2 h-4 w-4" /> Print
                </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

    </main>
  );
}
