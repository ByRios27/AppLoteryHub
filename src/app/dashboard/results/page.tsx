'use client';

import { useState, useEffect, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useStateContext } from '@/context/StateContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { type Winner, type Sale, type Lottery, type SpecialPlay } from '@/lib/data';
import { SaleReceiptModal } from '@/components/SaleReceiptModal';
import { Eye, Calendar as CalendarIcon, Award, Edit, Trash2, MoreHorizontal } from 'lucide-react';
import DashboardHeader from '@/components/ui/DashboardHeader';
import { format, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
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

const createRegisterDrawSchema = (lotteries: Lottery[]) => z.object({
  lotteryId: z.string().nonempty("Debes seleccionar una lotería."),
  drawTime: z.string().nonempty("Debes seleccionar un horario de sorteo."),
  firstPrizeNumber: z.string(),
  secondPrizeNumber: z.string(),
  thirdPrizeNumber: z.string(),
}).superRefine((data, ctx) => {
  if (!data.lotteryId) return;
  const lottery = lotteries.find(l => l.id === data.lotteryId);
  if (!lottery) return;
  const { numberOfDigits } = lottery;
  const prizeFields: ('firstPrizeNumber' | 'secondPrizeNumber' | 'thirdPrizeNumber')[] = ['firstPrizeNumber', 'secondPrizeNumber', 'thirdPrizeNumber'];
  for (const field of prizeFields) {
      const value = data[field];
      if (value.length > 0 && value.length !== numberOfDigits) {
        ctx.addIssue({ code: z.ZodIssueCode.invalid_literal, expected: `${numberOfDigits}` , received: value, message: `Debe tener ${numberOfDigits} dígitos.`, path: [field] });
      } else if (value.length > 0 && !/^\d+$/.test(value)) {
        ctx.addIssue({ code: z.ZodIssueCode.invalid_string, validation: 'regex', message: 'Solo números.', path: [field] });
      }
  }
  if (data.firstPrizeNumber.length === 0 && data.secondPrizeNumber.length === 0 && data.thirdPrizeNumber.length === 0) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Debes ingresar al menos un premio.', path: ['firstPrizeNumber'] });
  }
});

interface WinnerDetails extends Winner {
  customerName?: string;
  sale: Sale | undefined;
  lottery?: Lottery;
  specialPlayName?: string;
}

interface HistoricResult {
    id: string;
    lotteryId: string;
    lotteryName: string;
    drawTime: string;
    date: string;
    prizes: string[];
}

function EditResultModal({ open, onOpenChange, result, onUpdate }: { open: boolean, onOpenChange: (open: boolean) => void, result: HistoricResult | null, onUpdate: (newPrizes: string[]) => void }) {
    const lottery = useStateContext().lotteries.find(l => l.id === result?.lotteryId);
    const numDigits = lottery?.numberOfDigits || 0;

    const editSchema = z.object({
        first: z.string().length(numDigits, {message: `Debe tener ${numDigits} digitos`}).optional().or(z.literal('')),
        second: z.string().length(numDigits, {message: `Debe tener ${numDigits} digitos`}).optional().or(z.literal('')),
        third: z.string().length(numDigits, {message: `Debe tener ${numDigits} digitos`}).optional().or(z.literal('')),
    }).refine(data => data.first || data.second || data.third, { message: "Debes ingresar al menos un premio.", path: ["first"] });

    const form = useForm({ resolver: zodResolver(editSchema) });

    useEffect(() => {
        if (result) {
            form.reset({ first: result.prizes[0] || '', second: result.prizes[1] || '', third: result.prizes[2] || '' });
        }
    }, [result, form]);

    if (!result) return null;

    const handleSubmit = (values: { first?: string, second?: string, third?: string }) => {
        onUpdate([values.first || '', values.second || '', values.third || '']);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent><DialogHeader><DialogTitle>Editar Resultado</DialogTitle><DialogDescription>Modificando resultados para {result.lotteryName} - {result.drawTime} del {format(parseISO(result.date), 'dd/MM/yyyy')}</DialogDescription></DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4 py-4">
                        <FormField control={form.control} name="first" render={({ field }) => (<FormItem><FormLabel>1er Premio</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="second" render={({ field }) => (<FormItem><FormLabel>2do Premio</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <FormField control={form.control} name="third" render={({ field }) => (<FormItem><FormLabel>3er Premio</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        <DialogFooter><DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose><Button type="submit">Guardar Cambios</Button></DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

// Helper function to determine badge color based on prize tier
const getPrizeTierClass = (tier: number) => {
  switch (tier) {
    case 1: return 'bg-yellow-400 text-black';
    case 2: return 'bg-blue-400 text-white';
    case 3: return 'bg-green-400 text-white';
    default: return 'bg-gray-400 text-white';
  }
};

export default function ResultsPage() {
  const { winners, sales, lotteries, specialPlays, winningResults, addWinningResult, confirmAndPayWinner, updateWinningResult, deleteWinningResult } = useStateContext();
  const [isClient, setIsClient] = useState(false);
  const [selectedLottery, setSelectedLottery] = useState<Lottery | null>(null);
  const [historicFilterLottery, setHistoricFilterLottery] = useState<Lottery | null>(null);
  const [filterDate, setFilterDate] = useState<Date | undefined>();
  const [filterLotteryId, setFilterLotteryId] = useState<string>('');
  const [filterDrawTime, setFilterDrawTime] = useState<string>('');
  const [historicResults, setHistoricResults] = useState<HistoricResult[]>([]);
  const [winnerToPay, setWinnerToPay] = useState<WinnerDetails | null>(null);
  const [isPayConfirmOpen, setIsPayConfirmOpen] = useState(false);
  const [resultToEdit, setResultToEdit] = useState<HistoricResult | null>(null);
  const [resultToDelete, setResultToDelete] = useState<HistoricResult | null>(null);

  useEffect(() => { setIsClient(true); }, []);

  const registerDrawSchema = createRegisterDrawSchema(lotteries);
  const form = useForm<z.infer<typeof registerDrawSchema>>({ resolver: zodResolver(registerDrawSchema), defaultValues: { lotteryId: '', drawTime: '', firstPrizeNumber: '', secondPrizeNumber: '', thirdPrizeNumber: '' } });
  const lotteryId = form.watch('lotteryId');

  useEffect(() => {
    const lottery = lotteries.find(l => l.id === lotteryId);
    setSelectedLottery(lottery || null);
    form.reset({ lotteryId, drawTime: '', firstPrizeNumber: '', secondPrizeNumber: '', thirdPrizeNumber: '' });
  }, [lotteryId, form, lotteries]);

  useEffect(() => {
      const lottery = lotteries.find(l => l.id === filterLotteryId);
      setHistoricFilterLottery(lottery || null);
      setFilterDrawTime('');
  }, [filterLotteryId, lotteries]);

  const handleRegisterDraw = (values: z.infer<typeof registerDrawSchema>) => {
    const { lotteryId, drawTime, firstPrizeNumber, secondPrizeNumber, thirdPrizeNumber } = values;
    addWinningResult(lotteryId, drawTime, [firstPrizeNumber, secondPrizeNumber, thirdPrizeNumber].filter(p => p.length > 0));
    toast.success('Resultados registrados. Verificando ganadores...');
    form.reset({ lotteryId: '', drawTime: '', firstPrizeNumber: '', secondPrizeNumber: '', thirdPrizeNumber: '' });
    setSelectedLottery(null);
  };

  const handleSearchHistoricDraw = () => {
    if (filterDate && filterLotteryId) {
        const dateStr = format(filterDate, 'yyyy-MM-dd');
        const dailyResults = winningResults[dateStr]?.[filterLotteryId];
        if (dailyResults) {
            const lottery = lotteries.find(l => l.id === filterLotteryId);
            const results = Object.entries(dailyResults)
                .filter(([drawTime, _]) => !filterDrawTime || drawTime === filterDrawTime)
                .map(([drawTime, prizes]) => ({
                    id: `${dateStr}-${filterLotteryId}-${drawTime}`,
                    lotteryId: filterLotteryId,
                    date: dateStr,
                    lotteryName: lottery?.name || 'N/A',
                    drawTime: drawTime,
                    prizes: prizes,
                }));
            setHistoricResults(results);
            if (results.length === 0) toast.info("No se encontraron resultados para esta selección.");

        } else {
            setHistoricResults([]);
            toast.info("No se encontraron resultados para esta selección.");
        }
    } else {
        toast.warning("Por favor, seleccione fecha y lotería para buscar.");
    }
  };

  const handleUpdatePrizes = (newPrizes: string[]) => {
      if (resultToEdit) {
          updateWinningResult(resultToEdit.date, resultToEdit.lotteryId, resultToEdit.drawTime, newPrizes);
          setHistoricResults(prev => prev.map(r => r.id === resultToEdit.id ? { ...r, prizes: newPrizes } : r));
          setResultToEdit(null);
      }
  };
  
  const handleDeleteResult = () => {
      if (resultToDelete) {
          deleteWinningResult(resultToDelete.date, resultToDelete.lotteryId, resultToDelete.drawTime);
          setHistoricResults(prev => prev.filter(r => r.id !== resultToDelete.id));
          setResultToDelete(null);
      }
  };

  const handlePayClick = (winner: WinnerDetails) => {
    setWinnerToPay(winner);
    setIsPayConfirmOpen(true);
  };

  const winnerDetails: WinnerDetails[] = useMemo(() => winners.map(winner => {
    const sale = sales.find(s => s.id === winner.id.split('-')[0]);
    const lottery = lotteries.find(l => l.id === winner.lotteryId);
    const specialPlay = specialPlays.find(sp => sp.id === winner.specialPlayId);
    return { ...winner, customerName: sale?.customerName || '-', sale, lottery, specialPlayName: specialPlay?.name };
  }).sort((a, b) => new Date(b.drawDate).getTime() - new Date(a.drawDate).getTime()), [winners, sales, lotteries, specialPlays]);

  const regularWinners = useMemo(() => winnerDetails.filter(w => !w.specialPlayId), [winnerDetails]);
  const specialWinners = useMemo(() => winnerDetails.filter(w => w.specialPlayId), [winnerDetails]);
  
  const [receiptModalState, setReceiptModalState] = useState<{ open: boolean; sale?: Sale; item?: Lottery | SpecialPlay }>({ open: false });

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <DashboardHeader title="Resultados y Ganadores" />
      <div className="grid md:grid-cols-2 gap-8"> 
        <Card><CardHeader><CardTitle className="font-headline">Registrar Resultados</CardTitle><CardDescription>Ingresa los números ganadores de un sorteo.</CardDescription></CardHeader><CardContent><Form {...form}><form onSubmit={form.handleSubmit(handleRegisterDraw)} className="space-y-4"><div className="grid grid-cols-2 gap-4"><FormField control={form.control} name="lotteryId" render={({ field }) => (<FormItem><FormLabel>Lotería</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecciona una Lotería" /></SelectTrigger></FormControl><SelectContent>{lotteries.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} /><FormField control={form.control} name="drawTime" render={({ field }) => (<FormItem><FormLabel>Horario</FormLabel><Select onValueChange={field.onChange} value={field.value} disabled={!selectedLottery}><FormControl><SelectTrigger><SelectValue placeholder="Selecciona un horario" /></SelectTrigger></FormControl><SelectContent>{selectedLottery?.drawTimes.map((time: string) => <SelectItem key={time} value={time}>{time}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem>)} /></div><FormField control={form.control} name="firstPrizeNumber" render={({ field }) => (<FormItem><FormLabel>1er Premio</FormLabel><FormControl><Input placeholder={selectedLottery ? `Número de ${selectedLottery.numberOfDigits} dígitos` : "..."} {...field} disabled={!lotteryId}/></FormControl><FormMessage /></FormItem>)} /><FormField control={form.control} name="secondPrizeNumber" render={({ field }) => (<FormItem><FormLabel>2do Premio</FormLabel><FormControl><Input placeholder={selectedLottery ? `Número de ${selectedLottery.numberOfDigits} dígitos` : "..."} {...field} disabled={!lotteryId}/></FormControl><FormMessage /></FormItem>)} /><FormField control={form.control} name="thirdPrizeNumber" render={({ field }) => (<FormItem><FormLabel>3er Premio</FormLabel><FormControl><Input placeholder={selectedLottery ? `Número de ${selectedLottery.numberOfDigits} dígitos` : "..."} {...field} disabled={!lotteryId}/></FormControl><FormMessage /></FormItem>)} /><Button type="submit">Registrar Ganadores</Button></form></Form></CardContent></Card>
        <Card>
             <CardHeader><CardTitle className="font-headline">Historial de Sorteos</CardTitle><CardDescription>Busca resultados de una fecha y lotería.</CardDescription></CardHeader>
            <CardContent className="space-y-4"><div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"><div className="space-y-2"><Label>Fecha</Label><Popover><PopoverTrigger asChild><Button variant={"outline"} className={cn("w-full justify-start text-left font-normal", !filterDate && "text-muted-foreground")}><CalendarIcon className="mr-2 h-4 w-4" />{filterDate ? format(filterDate, "PPP") : <span>Selecciona una fecha</span>}</Button></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={filterDate} onSelect={setFilterDate} disabled={(date) => date > new Date()} initialFocus /></PopoverContent></Popover></div><div className="space-y-2"><Label>Lotería</Label><Select onValueChange={setFilterLotteryId} value={filterLotteryId}><SelectTrigger><SelectValue placeholder="Selecciona Lotería" /></SelectTrigger><SelectContent>{lotteries.map(l => <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>)}</SelectContent></Select></div><div className="space-y-2"><Label>Horario (Opcional)</Label><Select onValueChange={setFilterDrawTime} value={filterDrawTime} disabled={!historicFilterLottery}><SelectTrigger><SelectValue placeholder="Todos" /></SelectTrigger><SelectContent>{historicFilterLottery?.drawTimes.map((time: string) => <SelectItem key={time} value={time}>{time}</SelectItem>)}</SelectContent></Select></div></div><Button onClick={handleSearchHistoricDraw} className="w-full sm:w-auto">Buscar</Button>
                <div className="mt-4 pt-4 border-t">
                    {historicResults.length > 0 ? (
                        <Table><TableHeader><TableRow><TableHead>Sorteo</TableHead><TableHead>Premios</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader>
                            <TableBody>{historicResults.map(result => (
                                <TableRow key={result.id}>
                                    <TableCell className="font-semibold">{result.drawTime}</TableCell>
                                    <TableCell className="font-mono text-sm"><div>1ro: <span className="font-bold text-primary">{result.prizes[0] || '-'}</span></div><div>2do: {result.prizes[1] || '-'}</div><div>3ro: {result.prizes[2] || '-'}</div></TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu><DropdownMenuTrigger asChild><Button variant="ghost" className="h-8 w-8 p-0"><MoreHorizontal className="h-4 w-4" /></Button></DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => setResultToEdit(result)}><Edit className="mr-2 h-4 w-4"/>Editar</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => setResultToDelete(result)} className="text-destructive"><Trash2 className="mr-2 h-4 w-4"/>Borrar</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))}</TableBody>
                        </Table>
                    ) : (<div className="text-center text-muted-foreground py-8"><p>No hay resultados para mostrar.</p></div>)}
                </div>
            </CardContent>
        </Card>
      </div>
      <Tabs defaultValue="regular" className="w-full"><TabsList className="grid w-full grid-cols-2"><TabsTrigger value="regular">Ganadores Regulares ({regularWinners.length})</TabsTrigger><TabsTrigger value="special">Ganadores Especiales ({specialWinners.length})</TabsTrigger></TabsList><TabsContent value="regular"><Card><CardHeader><CardTitle>Premios Pendientes de Pago</CardTitle><CardDescription>Lista de ganadores de sorteos tradicionales que aún no han sido pagados.</CardDescription></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>Lotería/Sorteo</TableHead><TableHead>Cliente</TableHead><TableHead>Número Ganador</TableHead><TableHead>Premio</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader><TableBody>{isClient && regularWinners.length > 0 ? (regularWinners.map(winner => (<TableRow key={winner.id}><TableCell>{winner.lottery?.name || 'N/A'}<p className="text-xs text-muted-foreground">{winner.drawTime}</p></TableCell><TableCell>{winner.customerName}</TableCell><TableCell><p className="font-mono font-bold">{winner.ticketNumber}</p></TableCell><TableCell><Badge variant="default">Premio {winner.prizeTier}</Badge></TableCell><TableCell className="flex justify-end items-center gap-2"><Button size="sm" variant={'destructive'} onClick={() => handlePayClick(winner)}>Pagar</Button>{winner.sale && winner.lottery && <Button variant="outline" size="icon" onClick={() => setReceiptModalState({ open: true, sale: winner.sale, item: winner.lottery })}><Eye className="h-4 w-4" /></Button>}</TableCell></TableRow>))) : (<TableRow><TableCell colSpan={5} className="text-center h-24">{isClient ? 'No hay premios pendientes.' : 'Cargando...'}</TableCell></TableRow>)}</TableBody></Table></CardContent></Card></TabsContent><TabsContent value="special"><Card><CardHeader><CardTitle>Premios Especiales Pendientes</CardTitle><CardDescription>Lista de ganadores de jugadas especiales que aún no han sido pagados.</CardDescription></CardHeader><CardContent><Table><TableHeader><TableRow><TableHead>Jugada / Lotería</TableHead><TableHead>Cliente</TableHead><TableHead>Número Jugado</TableHead><TableHead>Nivel de Premio</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader><TableBody>{isClient && specialWinners.length > 0 ? (specialWinners.map(winner => (<TableRow key={winner.id} className={getPrizeTierClass(winner.prizeTier)}><TableCell>{winner.specialPlayName}<p className="text-xs text-muted-foreground">En: {winner.lottery?.name} ({winner.drawTime})</p></TableCell><TableCell>{winner.customerName}</TableCell><TableCell><p className="font-mono font-bold">{winner.ticketNumber}</p></TableCell><TableCell><Badge><Award className="h-4 w-4 mr-1"/>{winner.prizeTier === 1 ? 'Dorado' : winner.prizeTier === 2 ? 'Azul' : 'Verde'}</Badge></TableCell><TableCell className="flex justify-end items-center gap-2"><Button size="sm" variant={'destructive'} onClick={() => handlePayClick(winner)}>Pagar</Button>{winner.sale && winner.lottery && <Button variant="outline" size="icon" onClick={() => setReceiptModalState({ open: true, sale: winner.sale, item: winner.lottery })}><Eye className="h-4 w-4" /></Button>}</TableCell></TableRow>))) : (<TableRow><TableCell colSpan={5} className="text-center h-24">{isClient ? 'No hay premios especiales pendientes.' : 'Cargando...'}</TableCell></TableRow>)}</TableBody></Table></CardContent></Card></TabsContent></Tabs>

      {receiptModalState.open && receiptModalState.sale && receiptModalState.item && <SaleReceiptModal open={receiptModalState.open} onOpenChange={(open) => setReceiptModalState({ ...receiptModalState, open })} sale={receiptModalState.sale} item={receiptModalState.item} />}

      <EditResultModal open={!!resultToEdit} onOpenChange={(open) => !open && setResultToEdit(null)} result={resultToEdit} onUpdate={handleUpdatePrizes} />

      <AlertDialog open={!!resultToDelete} onOpenChange={(open) => !open && setResultToDelete(null)}>
          <AlertDialogContent>
              <AlertDialogHeader><AlertDialogTitle>¿Confirmas la eliminación?</AlertDialogTitle><AlertDialogDescription>Esta acción eliminará permanentemente el resultado y los ganadores asociados a este sorteo. Esta acción no se puede deshacer.</AlertDialogDescription></AlertDialogHeader>
              <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={handleDeleteResult}>Sí, Eliminar</AlertDialogAction></AlertDialogFooter>
          </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isPayConfirmOpen} onOpenChange={setIsPayConfirmOpen}>
        <AlertDialogContent>
            <AlertDialogHeader><AlertDialogTitle>Confirmar Pago de Premio</AlertDialogTitle><AlertDialogDescription>¿Confirmas que has pagado el premio para el ticket <b className="font-mono">{winnerToPay?.ticketNumber}</b> del cliente <b className="font-mono">{winnerToPay?.customerName}</b>? Esta acción es irreversible.</AlertDialogDescription></AlertDialogHeader>
            <AlertDialogFooter><AlertDialogCancel>Cancelar</AlertDialogCancel><AlertDialogAction onClick={() => { if (winnerToPay) { confirmAndPayWinner(winnerToPay.id); } }}>Sí, Pagar y Archivar</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  );
}
