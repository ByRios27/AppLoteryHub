"use client";

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { lotteries, type Lottery, type SoldTicket } from '@/lib/data';
import { determineWinners } from '@/ai/flows/determine-winners';
import { iconMap } from '@/lib/icon-map';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Wand2, CheckCircle } from 'lucide-react';

// WORKAROUND: For demo purposes, we will mock some tickets directly on this page
// as client-side state is not persisted between routes in this prototype.
const MOCK_TICKETS: SoldTicket[] = [
    { id: 'T1', lotteryId: 'lucky-clover', drawTime: '10:00 AM', ticketNumber: '23', fractions: 5, cost: 1.00, soldAt: new Date() },
    { id: 'T2', lotteryId: 'lucky-clover', drawTime: '10:00 AM', ticketNumber: '88', fractions: 10, cost: 2.00, soldAt: new Date() },
    { id: 'T3', lotteryId: 'lucky-clover', drawTime: '10:00 AM', ticketNumber: '45', fractions: 2, cost: 0.40, soldAt: new Date() },
    { id: 'T4', lotteryId: 'diamond-draw', drawTime: '11:00 AM', ticketNumber: '07', fractions: 50, cost: 10.00, soldAt: new Date() },
    { id: 'T5', lotteryId: 'diamond-draw', drawTime: '11:00 AM', ticketNumber: '77', fractions: 1, cost: 0.20, soldAt: new Date() },
    { id: 'T6', lotteryId: 'lucky-clover', drawTime: '02:00 PM', ticketNumber: '11', fractions: 20, cost: 4.00, soldAt: new Date() },
    { id: 'T7', lotteryId: 'lucky-clover', drawTime: '02:00 PM', ticketNumber: '22', fractions: 30, cost: 6.00, soldAt: new Date() },
];

const resultsFormSchema = z.object({
  prizes: z.array(z.object({
    number: z.string().length(2, "Must be 2 digits").regex(/^\d{2}$/, "Must be 2 digits"),
  })).length(3, "There must be 3 prizes."),
});

type Winner = SoldTicket & { prizeTier: number };

function DrawResultsManager({ lottery, drawTime }: { lottery: Lottery, drawTime: string }) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [winners, setWinners] = useState<Winner[]>([]);

  const form = useForm<z.infer<typeof resultsFormSchema>>({
    resolver: zodResolver(resultsFormSchema),
    defaultValues: {
      prizes: [{ number: '' }, { number: '' }, { number: '' }],
    },
  });

  const { fields } = useFieldArray({
    control: form.control,
    name: "prizes",
  });

  const handleDetermineWinners = async (values: z.infer<typeof resultsFormSchema>) => {
    setIsLoading(true);
    setWinners([]);
    
    const winningNumbers = values.prizes.map(p => p.number).join(' ');

    const ticketsForDraw = MOCK_TICKETS.filter(
      (ticket) => ticket.lotteryId === lottery.id && ticket.drawTime === drawTime
    );

    if (ticketsForDraw.length === 0) {
        toast({
            title: "No Tickets Found",
            description: `No mock tickets exist for the ${drawTime} draw.`,
        });
        setIsLoading(false);
        return;
    }

    const ticketDetails = ticketsForDraw.map(t => `ID: ${t.id}, Number: ${t.ticketNumber}`).join('\n');

    try {
      // The AI flow is designed to find tickets whose numbers are in the winningNumbers string.
      // We pass all three winning numbers.
      const result = await determineWinners({ winningNumbers, ticketDetails });
      
      const winningTicketIds = new Set(result.winningTicketIds);

      // We determine the prize tier locally after AI identifies the winning tickets.
      const allWinningTickets = ticketsForDraw
        .map((ticket) => {
          if (winningTicketIds.has(ticket.id)) {
            const prizeIndex = values.prizes.findIndex(p => p.number === ticket.ticketNumber);
            if (prizeIndex !== -1) {
              return { ...ticket, prizeTier: prizeIndex + 1 };
            }
          }
          return null;
        })
        .filter((t): t is Winner => t !== null);

      setWinners(allWinningTickets);
      
      toast({
        title: "Winners Determined!",
        description: `${allWinningTickets.length} winning tickets found.`,
      });

    } catch (error) {
      console.error("AI Error:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Could not determine winners. Please try again.",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleMarkAsPaid = (ticketId: string) => {
    setWinners(winners.map(w => w.id === ticketId ? { ...w, isPaid: true } : w));
    toast({
        title: "Payment Confirmed",
        description: `Ticket ${ticketId} has been marked as paid.`,
    })
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Enter Winning Numbers</CardTitle>
          <CardDescription>For the {drawTime} draw.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleDetermineWinners)} className="space-y-4">
              {fields.map((field, index) => (
                <FormField
                  key={field.id}
                  control={form.control}
                  name={`prizes.${index}.number`}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prize {index + 1}</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 07" {...field} disabled={isLoading} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              ))}
              <Button type="submit" className="w-full bg-accent text-accent-foreground hover:bg-accent/90" disabled={isLoading}>
                {isLoading ? 'Analyzing...' : 'Determine Winners'}
                <Wand2 className="ml-2 h-4 w-4" />
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="font-headline">Winners</CardTitle>
          <CardDescription>Winning tickets for the {drawTime} draw.</CardDescription>
        </CardHeader>
        <CardContent>
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Prize</TableHead>
                        <TableHead>Ticket #</TableHead>
                        <TableHead>Fractions</TableHead>
                        <TableHead className="text-right">Status</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                        <TableRow><TableCell colSpan={4} className="h-24 text-center">Finding winners...</TableCell></TableRow>
                    ) : winners.length > 0 ? (
                        winners.sort((a,b) => a.prizeTier - b.prizeTier).map(winner => (
                            <TableRow key={winner.id}>
                                <TableCell><Badge variant="outline">Prize {winner.prizeTier}</Badge></TableCell>
                                <TableCell className="font-medium">{winner.ticketNumber}</TableCell>
                                <TableCell>{winner.fractions}</TableCell>
                                <TableCell className="text-right">
                                    {winner.isPaid ? (
                                        <Badge>Paid</Badge>
                                    ) : (
                                        <Button size="sm" onClick={() => handleMarkAsPaid(winner.id)}>
                                            <CheckCircle className="mr-2 h-4 w-4" />
                                            Mark as Paid
                                        </Button>
                                    )}
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow><TableCell colSpan={4} className="h-24 text-center">No winners found for these numbers.</TableCell></TableRow>
                    )}
                </TableBody>
            </Table>
        </CardContent>
      </Card>
    </div>
  );
}

export default function ResultsPage() {
  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center">
        <h1 className="text-3xl font-bold font-headline">Draw Results</h1>
      </div>

      <Accordion type="single" collapsible className="w-full" defaultValue={lotteries[0].id}>
        {lotteries.map((lottery) => {
          const Icon = iconMap[lottery.icon] || iconMap.Ticket;
          return (
            <AccordionItem value={lottery.id} key={lottery.id}>
              <AccordionTrigger className="text-lg font-semibold hover:no-underline">
                <div className="flex items-center gap-3">
                  <Icon className="h-6 w-6 text-primary" />
                  {lottery.name}
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <Tabs defaultValue={lottery.drawTimes[0]} className="w-full">
                  <TabsList className="flex-wrap h-auto">
                    {lottery.drawTimes.map((time) => (
                      <TabsTrigger value={time} key={time}>{time}</TabsTrigger>
                    ))}
                  </TabsList>
                  {lottery.drawTimes.map((time) => (
                      <TabsContent value={time} key={time} className="pt-4">
                          <DrawResultsManager lottery={lottery} drawTime={time} />
                      </TabsContent>
                  ))}
                </Tabs>
              </AccordionContent>
            </AccordionItem>
          );
        })}
      </Accordion>
    </main>
  );
}
