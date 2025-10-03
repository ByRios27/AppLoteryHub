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

const lotterySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'El nombre es requerido.'),
  icon: z.string().optional(),
  numberOfDigits: z.coerce.number().min(1, 'Mínimo 1 dígito.').max(10, 'Máximo 10 dígitos.'),
  cost: z.coerce.number().min(0, 'El costo no puede ser negativo.'),
  drawTimes: z.array(z.string()).min(1, 'Debe haber al menos un sorteo.').max(4, 'No más de 4 sorteos.'),
});

const specialPlaySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'El nombre es requerido.'),
  icon: z.string().optional(),
  numberOfDigits: z.coerce.number().min(1, 'Mínimo 1 dígito.').max(10, 'Máximo 10 dígitos.'),
  cost: z.coerce.number().min(0, 'El costo no puede ser negativo.'),
});

export default function SettingsPage() {
  const { lotteries, setLotteries, specialPlays, setSpecialPlays } = useStateContext();
  const { toast } = useToast();
  const [editingLottery, setEditingLottery] = useState<Lottery | null>(null);
  const [editingSpecialPlay, setEditingSpecialPlay] = useState<SpecialPlay | null>(null);
  const [paletEnabled, setPaletEnabled] = useState(false);
  const [tripletaEnabled, setTripletaEnabled] = useState(false);
  const [armaTuSuerteEnabled, setArmaTuSuerteEnabled] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const lotteryForm = useForm<z.infer<typeof lotterySchema>>({
    resolver: zodResolver(lotterySchema),
    defaultValues: { name: '', icon: '', numberOfDigits: 2, cost: 1.0, drawTimes: [] },
  });

  const specialPlayForm = useForm<z.infer<typeof specialPlaySchema>>({
    resolver: zodResolver(specialPlaySchema),
    defaultValues: { name: '', icon: '', numberOfDigits: 2, cost: 1.0 },
  });

  const { fields: drawTimesFields, append: appendDrawTime, remove: removeDrawTime } = useFieldArray({
    control: lotteryForm.control,
    name: 'drawTimes',
  });

  const handleLotterySubmit = (values: z.infer<typeof lotterySchema>) => {
    const lotteryData = { ...values, icon: values.icon || 'ticket' };
    if (editingLottery) {
      // Update existing lottery
      setLotteries(lotteries.map(l => l.id === editingLottery.id ? { ...l, ...lotteryData, id: l.id } : l));
      toast({ title: 'Lotería Actualizada', description: `La lotería ${values.name} ha sido actualizada.` });
      setEditingLottery(null);
    } else {
      // Add new lottery
      const newLottery: Lottery = { ...lotteryData, id: `L${Date.now()}` };
      setLotteries([...lotteries, newLottery]);
      toast({ title: 'Lotería Añadida', description: `La lotería ${values.name} ha sido creada.` });
    }
    lotteryForm.reset({ name: '', icon: '', numberOfDigits: 2, cost: 1.0, drawTimes: [] });
  };

  const handleSpecialPlaySubmit = (values: z.infer<typeof specialPlaySchema>) => {
    const specialPlayData = { ...values, icon: values.icon || 'ticket' };
    if (editingSpecialPlay) {
      setSpecialPlays(specialPlays.map(sp => sp.id === editingSpecialPlay.id ? { ...sp, ...specialPlayData, id: sp.id } : sp));
      toast({ title: 'Jugada Especial Actualizada', description: `La jugada ${values.name} ha sido actualizada.` });
      setEditingSpecialPlay(null);
    } else {
      const newSpecialPlay: SpecialPlay = { ...specialPlayData, id: `SP${Date.now()}` };
      setSpecialPlays([...specialPlays, newSpecialPlay]);
      toast({ title: 'Jugada Especial Añadida', description: `La jugada ${values.name} ha sido creada.` });
    }
    specialPlayForm.reset({ name: '', icon: '', numberOfDigits: 2, cost: 1.0 });
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
  };

  const startEditingSpecialPlay = (specialPlay: SpecialPlay) => {
    setEditingSpecialPlay(specialPlay);
    specialPlayForm.reset(specialPlay);
  };

  const cancelEditingSpecialPlay = () => {
    setEditingSpecialPlay(null);
    specialPlayForm.reset({ name: '', icon: '', numberOfDigits: 2, cost: 1.0 });
  };

  const deleteSpecialPlay = (specialPlayId: string) => {
    setSpecialPlays(specialPlays.filter(sp => sp.id !== specialPlayId));
    toast({ title: 'Jugada Especial Eliminada', variant: 'destructive' });
  };
  
  const handleIconUpload = (event: React.ChangeEvent<HTMLInputElement>, formType: 'lottery' | 'specialPlay') => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        if (formType === 'lottery') {
            lotteryForm.setValue('icon', base64String);
        } else {
            specialPlayForm.setValue('icon', base64String);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <DashboardHeader title="Ajustes de Negocio" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{editingLottery ? 'Editando Lotería' : 'Añadir Nueva Lotería'}</CardTitle>
            <CardDescription>{editingLottery ? 'Modifica los detalles de la lotería.' : 'Configura una nueva lotería para vender boletos.'}</CardDescription>
          </CardHeader>
          <CardContent>
           {isClient && (
            <Form {...lotteryForm}>
              <form onSubmit={lotteryForm.handleSubmit(handleLotterySubmit)} className="space-y-4">
                 <FormField
                    control={lotteryForm.control}
                    name="icon"
                    render={({ field }) => (
                        <FormItem className="flex items-center gap-4">
                        <img src={field.value || '/placeholder.svg'} alt="Icono Lotería" className="w-16 h-16 rounded-full object-cover bg-muted"/>
                        <div className="flex-1">
                            <FormLabel>Icono de la Lotería</FormLabel>
                            <div className="flex items-center gap-2">
                                <Input type="file" accept="image/*" onChange={(e) => handleIconUpload(e, 'lottery')} className="hidden" id="icon-upload"/>
                                <label htmlFor="icon-upload" className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 w-full">
                                    <Upload className="mr-2 h-4 w-4" /> Subir Icono
                                </label>
                            </div>
                            <FormMessage />
                        </div>
                        </FormItem>
                    )}
                 />
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
                             <FormField
                                control={lotteryForm.control}
                                name={`drawTimes.${index}`}
                                render={({ field }) => (
                                <FormItem className="flex-1">
                                    <FormControl>
                                    <TimePicker 
                                        value={field.value} 
                                        onChange={field.onChange} 
                                    />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <Button type="button" variant="ghost" size="icon" onClick={() => removeDrawTime(index)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                    ))}
                     {drawTimesFields.length < 4 && (
                         <Button type="button" variant="outline" size="sm" onClick={() => appendDrawTime('12:00 PM')}><PlusCircle className="mr-2 h-4 w-4" />Añadir Hora</Button>
                    )}
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
            <CardHeader>
                <CardTitle>Loterías Existentes</CardTitle>
                <CardDescription>Gestiona las loterías de tu sistema.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
            {lotteries.map(lottery => (
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
            {lotteries.length === 0 && <p className="text-sm text-muted-foreground text-center">No hay loterías configuradas.</p>}
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Jugadas Especiales</CardTitle>
                <CardDescription>Activa o desactiva las jugadas especiales predefinidas.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isClient && (
                <>
                  <div className="flex items-center justify-between rounded-lg border p-3">
                      <FormLabel htmlFor="palet-switch">
                          Palet
                      </FormLabel>
                      <Switch
                          id="palet-switch"
                          checked={paletEnabled}
                          onCheckedChange={setPaletEnabled}
                      />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-3">
                      <FormLabel htmlFor="tripleta-switch">
                          Tripleta
                      </FormLabel>
                      <Switch
                          id="tripleta-switch"
                          checked={tripletaEnabled}
                          onCheckedChange={setTripletaEnabled}
                      />
                  </div>
                  <div className="flex items-center justify-between rounded-lg border p-3">
                      <FormLabel htmlFor="arma-tu-suerte-switch">
                          Arma tu suerte
                      </FormLabel>
                      <Switch
                          id="arma-tu-suerte-switch"
                          checked={armaTuSuerteEnabled}
                          onCheckedChange={setArmaTuSuerteEnabled}
                      />
                  </div>
                </>
              )}
            </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle>{editingSpecialPlay ? 'Editando Jugada Especial' : 'Añadir Jugada Especial'}</CardTitle>
            <CardDescription>{editingSpecialPlay ? 'Modifica los detalles.' : 'Crea una nueva jugada especial.'}</CardDescription>
          </CardHeader>
          <CardContent>
            {isClient && (
              <Form {...specialPlayForm}>
                <form onSubmit={specialPlayForm.handleSubmit(handleSpecialPlaySubmit)} className="space-y-4">
                  <FormField
                      control={specialPlayForm.control}
                      name="icon"
                      render={({ field }) => (
                          <FormItem className="flex items-center gap-4">
                          <img src={field.value || '/placeholder.svg'} alt="Icono Jugada" className="w-16 h-16 rounded-full object-cover bg-muted"/>
                          <div className="flex-1">
                              <FormLabel>Icono de la Jugada</FormLabel>
                              <div className="flex items-center gap-2">
                                  <Input type="file" accept="image/*" onChange={(e) => handleIconUpload(e, 'specialPlay')} className="hidden" id="icon-upload-special"/>
                                  <label htmlFor="icon-upload-special" className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 w-full">
                                      <Upload className="mr-2 h-4 w-4" /> Subir Icono
                                  </label>
                              </div>
                              <FormMessage />
                          </div>
                          </FormItem>
                      )}
                  />
                  <FormField control={specialPlayForm.control} name="name" render={({ field }) => (<FormItem><FormLabel>Nombre</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                  <div className="grid grid-cols-2 gap-4">
                    <FormField control={specialPlayForm.control} name="numberOfDigits" render={({ field }) => (<FormItem><FormLabel>Cifras</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>)} />
                    <FormField control={specialPlayForm.control} name="cost" render={({ field }) => (<FormItem><FormLabel>Costo</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem>)} />
                  </div>
                  <div className="flex justify-end gap-2">
                    {editingSpecialPlay && <Button type="button" variant="outline" onClick={cancelEditingSpecialPlay}>Cancelar</Button>}
                    <Button type="submit">{editingSpecialPlay ? 'Actualizar Jugada' : 'Guardar Jugada'}</Button>
                  </div>
                </form>
              </Form>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Jugadas Especiales Existentes</CardTitle>
            <CardDescription>Gestiona las jugadas especiales de tu sistema.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {specialPlays.map(sp => (
              <div key={sp.id} className="flex items-center justify-between p-2 rounded-md border">
                <div className="flex items-center gap-4">
                    <img src={sp.icon} alt={sp.name} className="w-8 h-8 rounded-full"/>
                    <span>{sp.name}</span>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => startEditingSpecialPlay(sp)}><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" onClick={() => deleteSpecialPlay(sp.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </div>
            ))}
            {specialPlays.length === 0 && <p className="text-sm text-muted-foreground text-center">No hay jugadas especiales.</p>}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
