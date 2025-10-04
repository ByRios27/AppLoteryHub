'use client';

import { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { PlusCircle, Trash2, Edit, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useStateContext } from '@/context/StateContext';
import { type Lottery, type SpecialPlay } from '@/lib/data';
import { TimePicker } from '@/components/ui/time-picker';
import DashboardHeader from '@/components/ui/DashboardHeader';
import { Switch } from "@/components/ui/switch";

// NOTE: The business settings part is preserved from the original file, but it uses appCustomization from context now.
const businessSchema = z.object({
  appName: z.string().min(1, 'El nombre del negocio es requerido.'),
  appLogo: z.string().optional(),
});

const lotterySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'El nombre es requerido.'),
  icon: z.string().optional(),
  numberOfDigits: z.coerce.number().min(1, 'Mínimo 1 dígito.').max(10, 'Máximo 10 dígitos.'),
  cost: z.coerce.number().min(0, 'El costo no puede ser negativo.'),
  drawTimes: z.array(z.string()).min(1, 'Debe haber al menos un sorteo.').max(4, 'No más de 4 sorteos.'),
});

const specialPlaySchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'El nombre es requerido.'),
  icon: z.string().optional(),
  cost: z.coerce.number().min(0, 'El costo no puede ser negativo.'),
  // Properties from the original SpecialPlayForm that were missing
  type: z.enum(['multi_pick', 'single_pick']),
  numberOfPicks: z.number().optional(),
  numberOfDigits: z.number().optional(),
});

// This component is mostly preserved but adapted to use the full special play properties
function SpecialPlayForm({ play }: { play: SpecialPlay }) {
    const { setSpecialPlays } = useStateContext();
    const { toast } = useToast();

    const form = useForm<z.infer<typeof specialPlaySchema>>({
        resolver: zodResolver(specialPlaySchema),
        defaultValues: play,
    });

    const handleIconUpload = (event: React.ChangeEvent<HTMLInputElement>, callback: (base64: string) => void) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => { callback(reader.result as string); };
            reader.readAsDataURL(file);
        }
    };

    const onSubmit = (values: z.infer<typeof specialPlaySchema>) => {
        setSpecialPlays(prev => prev.map(p => p.id === values.id ? { ...p, ...values } : p));
        toast({ title: 'Jugada Especial Actualizada', description: `La jugada ${values.name} ha sido guardada.` });
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                 <FormField
                    control={form.control}
                    name="icon"
                    render={({ field }) => (
                        <FormItem className="flex items-center gap-4">
                            <img src={field.value || '/placeholder.svg'} alt="Icono Jugada" className="w-16 h-16 rounded-full object-cover bg-muted"/>
                            <div className="flex-1">
                                <FormLabel>Icono</FormLabel>
                                <div className="flex items-center gap-2">
                                    <Input type="file" accept="image/*" id={`upload-${play.id}`} className="hidden" onChange={(e) => handleIconUpload(e, (base64) => form.setValue('icon', base64))} />
                                    <label htmlFor={`upload-${play.id}`} className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 w-full">
                                        <Upload className="mr-2 h-4 w-4" /> Cambiar Icono
                                    </label>
                                </div>
                            </div>
                        </FormItem>
                    )}
                />
                <div className="grid grid-cols-2 gap-4">
                    <FormField control={form.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nombre</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={form.control} name="cost" render={({ field }) => (<FormItem><FormLabel>Costo</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>)} />
                </div>
                <FormItem>
                    <FormLabel>Tipo de Jugada</FormLabel>
                    <Input value={play.type === 'multi_pick' ? `Seleccionar ${play.numberOfPicks}` : `Número de ${play.numberOfDigits} cifras`} disabled />
                </FormItem>
                <div className="flex justify-end">
                    <Button type="submit">Guardar Cambios</Button>
                </div>
            </form>
        </Form>
    );
}

export default function SettingsPage() {
  const { lotteries, setLotteries, specialPlays, setSpecialPlays, appCustomization, setAppCustomization } = useStateContext();
  const { toast } = useToast();
  const [editingLottery, setEditingLottery] = useState<Lottery | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => { setIsClient(true); }, []);

  const businessForm = useForm<z.infer<typeof businessSchema>>({
    resolver: zodResolver(businessSchema),
    defaultValues: { appName: '', appLogo: '' },
  });

  const lotteryForm = useForm<z.infer<typeof lotterySchema>>({
    resolver: zodResolver(lotterySchema),
    defaultValues: { name: '', icon: '', numberOfDigits: 2, cost: 1.0, drawTimes: [] },
  });

  useEffect(() => {
    if (isClient && appCustomization) {
      businessForm.reset({ appName: appCustomization.appName || '', appLogo: appCustomization.appLogo || '' });
    }
  }, [isClient, appCustomization, businessForm]);

  const { fields: drawTimesFields, append: appendDrawTime, remove: removeDrawTime } = useFieldArray({
    control: lotteryForm.control, name: 'drawTimes',
  });

  const handleBusinessSubmit = (values: z.infer<typeof businessSchema>) => {
    setAppCustomization({ name: values.appName, logo: values.appLogo || null });
    toast({ title: 'Ajustes de Negocio Actualizados' });
  };

  const handleLotterySubmit = (values: z.infer<typeof lotterySchema>) => {
    const lotteryData = { ...values, icon: values.icon || 'ticket' };
    if (editingLottery) {
      setLotteries(lotteries.map(l => l.id === editingLottery.id ? { ...l, ...lotteryData, id: l.id } : l));
      toast({ title: 'Lotería Actualizada', description: `La lotería ${values.name} ha sido actualizada.` });
      setEditingLottery(null);
    } else {
      const newLottery: Lottery = { ...lotteryData, id: `L${Date.now()}` };
      setLotteries([...lotteries, newLottery]);
      toast({ title: 'Lotería Añadida', description: `La lotería ${values.name} ha sido creada.` });
    }
    lotteryForm.reset({ name: '', icon: '', numberOfDigits: 2, cost: 1.0, drawTimes: [] });
  };

  const startEditingLottery = (lottery: Lottery) => {
    setEditingLottery(lottery);
    lotteryForm.reset(lottery);
  };

  const cancelEditingLottery = () => {
    setEditingLottery(null);
    lotteryForm.reset({ name: '', icon: '', numberOfDigits: 2, cost: 1.0, drawTimes: [] });
  };

  const deleteLottery = (lotteryId: string) => {
    setLotteries(lotteries.filter(l => l.id !== lotteryId));
    toast({ title: 'Lotería Eliminada', variant: 'destructive' });
    if (editingLottery && editingLottery.id === lotteryId) {
        cancelEditingLottery();
    }
  };

  const handleIconUpload = (event: React.ChangeEvent<HTMLInputElement>, callback: (base64: string) => void) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => { callback(reader.result as string); };
      reader.readAsDataURL(file);
    }
  };
  
  const handleSpecialPlayToggle = (playId: string, enabled: boolean) => {
      setSpecialPlays(prev => prev.map(p => p.id === playId ? { ...p, enabled } : p));
      toast({ title: 'Estado de Jugada Actualizado' });
  };

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <DashboardHeader title="Ajustes" />

      <Card>
        <CardHeader>
          <CardTitle>Ajustes del Negocio</CardTitle>
          <CardDescription>Configura el nombre y logo de tu negocio.</CardDescription>
        </CardHeader>
        <CardContent>
          {isClient && (
            <Form {...businessForm}>
              <form onSubmit={businessForm.handleSubmit(handleBusinessSubmit)} className="space-y-4">
                  <FormField control={businessForm.control} name="appLogo" render={({ field }) => (
                        <FormItem className="flex items-center gap-4">
                        <img src={field.value || '/placeholder.svg'} alt="Logo" className="w-16 h-16 rounded-full object-cover bg-muted"/>
                        <div className="flex-1">
                            <FormLabel>Logo del Negocio</FormLabel>
                            <div className="flex items-center gap-2">
                                <Input type="file" accept="image/*" onChange={(e) => handleIconUpload(e, (base64) => businessForm.setValue('appLogo', base64))} className="hidden" id="business-logo-upload"/>
                                <label htmlFor="business-logo-upload" className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 w-full">
                                    <Upload className="mr-2 h-4 w-4" /> Subir Logo
                                </label>
                            </div>
                        </div>
                        </FormItem>
                    )} />
                <FormField control={businessForm.control} name="appName" render={({ field }) => (<FormItem><FormLabel>Nombre del Negocio</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                <div className="flex justify-end gap-2"><Button type="submit">Guardar Ajustes</Button></div>
              </form>
            </Form>
          )}
        </CardContent>
      </Card>

      <div className="mt-8">
        <h2 className="text-2xl font-bold tracking-tight mb-4">Jugadas Especiales</h2>
        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-3">
            {isClient && specialPlays.map((play) => (
                <Card key={play.id}>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>{play.name}</CardTitle>
                        <Switch checked={play.enabled} onCheckedChange={(checked) => handleSpecialPlayToggle(play.id, checked)} />
                    </CardHeader>
                    <CardContent><SpecialPlayForm play={play} /></CardContent>
                </Card>
            ))}
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 mt-8">
        <Card>
          <CardHeader><CardTitle>{editingLottery ? 'Editando Lotería' : 'Añadir Nueva Lotería'}</CardTitle></CardHeader>
          <CardContent>
            {isClient && (
              <Form {...lotteryForm}>
                <form onSubmit={lotteryForm.handleSubmit(handleLotterySubmit)} className="space-y-4">
                   <FormField control={lotteryForm.control} name="icon" render={({ field }) => (
                        <FormItem className="flex items-center gap-4">
                        <img src={field.value || '/placeholder.svg'} alt="Icono" className="w-16 h-16 rounded-full object-cover bg-muted"/>
                        <div className="flex-1">
                            <FormLabel>Icono</FormLabel>
                            <Input type="file" accept="image/*" onChange={(e) => handleIconUpload(e, (b64) => lotteryForm.setValue('icon', b64))} className="hidden" id="icon-upload"/>
                            <label htmlFor="icon-upload" className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium border border-input bg-background h-10 px-4 py-2 w-full"><Upload className="mr-2 h-4 w-4" />Subir Icono</label>
                        </div>
                        </FormItem>
                    )} />
                  <FormField control={lotteryForm.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nombre</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={lotteryForm.control} name="numberOfDigits" render={({ field }) => (<FormItem><FormLabel>Cifras</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={lotteryForm.control} name="cost" render={({ field }) => (<FormItem><FormLabel>Costo</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                  <div>
                      <FormLabel>Horarios de Sorteos</FormLabel>
                      <div className="space-y-2 pt-2">
                      {drawTimesFields.map((field, index) => (
                          <div key={field.id} className="flex items-center gap-2">
                              <FormField control={lotteryForm.control} name={`drawTimes.${index}`} render={({ field }) => (<FormItem className="flex-1"><FormControl><TimePicker value={field.value} onChange={field.onChange} /></FormControl><FormMessage /></FormItem>)}/>
                              <Button type="button" variant="ghost" size="icon" onClick={() => removeDrawTime(index)}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                      ))}
                      <Button type="button" variant="outline" size="sm" onClick={() => appendDrawTime('12:00 PM')}><PlusCircle className="mr-2 h-4 w-4" />Añadir Hora</Button>
                      </div>
                      <FormMessage>{lotteryForm.formState.errors.drawTimes?.message}</FormMessage>
                  </div>
                  <div className="flex justify-end gap-2">
                      {editingLottery && <Button type="button" variant="outline" onClick={cancelEditingLottery}>Cancelar</Button>}
                      <Button type="submit">{editingLottery ? 'Actualizar Lotería' : 'Guardar Lotería'}</Button>
                  </div>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>

        <Card>
            <CardHeader><CardTitle>Loterías Existentes</CardTitle></CardHeader>
            <CardContent className="space-y-2">
            {isClient && lotteries.map(lottery => (
                <div key={lottery.id} className="flex items-center justify-between p-2 rounded-md border">
                    <div className="flex items-center gap-4">
                        <img src={lottery.icon} alt={lottery.name} className="w-8 h-8 rounded-full"/>
                        <span>{lottery.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon" onClick={() => startEditingLottery(lottery)}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteLottery(lottery.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                    </div>
                </div>
            ))}
            {isClient && lotteries.length === 0 && <p className="text-sm text-muted-foreground text-center">No hay loterías configuradas.</p>}
            </CardContent>
        </Card>
      </div>
    </main>
  );
}
