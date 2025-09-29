'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ImageIcon, PlusCircle, Trash2 } from 'lucide-react';

import { useStateContext } from '@/context/StateContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { iconMap } from '@/lib/icon-map';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { type SpecialPlay } from '@/lib/data';

export default function SettingsPage() {
  const { lotteries, setLotteries, specialPlays, setSpecialPlays, appCustomization, setAppCustomization } = useStateContext();
  const router = useRouter();
  const { toast } = useToast();
  
  const fileInputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const appLogoInputRef = useRef<HTMLInputElement | null>(null);

  // --- Handlers for App Customization ---
  const handleAppNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAppCustomization(prev => ({ ...prev, appName: e.target.value }));
  };

  const handleAppLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAppCustomization(prev => ({ ...prev, appLogo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  // --- Handlers for Lottery ---
  const handleLotteryChange = (id: string, field: string, value: string | number) => {
    const updatedLotteries = lotteries.map((lottery) =>
      lottery.id === id ? { ...lottery, [field]: value } : lottery
    );
    setLotteries(updatedLotteries);
  };

  const handleLotteryIconFileChange = (e: React.ChangeEvent<HTMLInputElement>, id: string) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const updatedLotteries = lotteries.map((lottery) =>
          lottery.id === id ? { ...lottery, icon: reader.result as string } : lottery
        );
        setLotteries(updatedLotteries);
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = (id: string) => {
    fileInputRefs.current[id]?.click();
  };

  // --- Handlers for Special Plays ---
    const handleSpecialPlayChange = (id: string, field: string, value: any) => {
        setSpecialPlays(prev => prev.map(sp => sp.id === id ? { ...sp, [field]: value } : sp));
    };

    const handleSpecialPlayIconChange = (e: React.ChangeEvent<HTMLInputElement>, id: string) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setSpecialPlays(prev => prev.map(sp => sp.id === id ? { ...sp, icon: reader.result as string } : sp));
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSpecialPlayAppliesToChange = (playId: string, lotteryId: string, drawTime: string, checked: boolean) => {
        setSpecialPlays(prevPlays => prevPlays.map(play => {
            if (play.id === playId) {
                const lotteryIndex = play.appliesTo.findIndex(a => a.lotteryId === lotteryId);
                if (lotteryIndex > -1) {
                    const newDrawTimes = checked 
                        ? [...play.appliesTo[lotteryIndex].drawTimes, drawTime] 
                        : play.appliesTo[lotteryIndex].drawTimes.filter(t => t !== drawTime);
                    const newAppliesTo = [...play.appliesTo];
                    if (newDrawTimes.length === 0) {
                        newAppliesTo.splice(lotteryIndex, 1);
                    } else {
                        newAppliesTo[lotteryIndex] = { ...newAppliesTo[lotteryIndex], drawTimes: newDrawTimes };
                    }
                    return { ...play, appliesTo: newAppliesTo };
                } else if (checked) {
                    return { ...play, appliesTo: [...play.appliesTo, { lotteryId, drawTimes: [drawTime] }] };
                }
            }
            return play;
        }));
    };

    const addNewSpecialPlay = () => {
        const newPlay: SpecialPlay = {
            id: `sp-${Date.now()}`,
            name: 'Nueva Jugada',
            icon: 'Ticket',
            numberOfDigits: 2,
            cost: 1.00,
            appliesTo: [],
        };
        setSpecialPlays(prev => [...prev, newPlay]);
    };

    const removeSpecialPlay = (id: string) => {
        setSpecialPlays(prev => prev.filter(sp => sp.id !== id));
    };


  // --- Save Changes ---
  const handleSaveChanges = () => {
    toast({ title: '¡Guardado!', description: 'Los cambios se han guardado con éxito.' });
    router.push('/dashboard/lotteries');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-6 font-headline">Ajustes Generales</h1>
        <div className="space-y-8">
          
          {/* Card for App Customization */}
          <Card>
            <CardHeader>
              <CardTitle className='font-headline'>Personalización de la App</CardTitle>
              <CardDescription>Cambia el nombre y el logo de tu aplicación.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="appName">Nombre de la App</Label>
                <Input
                  id="appName"
                  value={appCustomization.appName}
                  onChange={handleAppNameChange}
                />
              </div>
              <div className="space-y-2">
                <Label>Logo de la App</Label>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 flex items-center justify-center rounded-lg bg-card overflow-hidden border">
                    {appCustomization.appLogo ? (
                        <img src={appCustomization.appLogo} alt="App Logo" className="w-full h-full object-cover" />
                    ) : (
                        <ImageIcon className="w-8 h-8 text-muted-foreground" />
                    )}
                  </div>
                  <Button onClick={() => appLogoInputRef.current?.click()} variant="outline">
                    Cambiar Logo
                  </Button>
                  <Input
                    type="file"
                    className="hidden"
                    ref={appLogoInputRef}
                    onChange={handleAppLogoChange}
                    accept="image/*"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Card for Lotteries */}
          <Card>
            <CardHeader>
              <CardTitle className='font-headline'>Gestionar Loterías</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {lotteries.map((lottery) => {
                const Icon = lottery.icon.startsWith('data:image')
                  ? null
                  : iconMap[lottery.icon as keyof typeof iconMap] || iconMap.Ticket;

                return (
                  <div key={lottery.id} className="p-3 rounded-lg bg-card-foreground/5 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                        <div className="w-12 h-12 flex items-center justify-center rounded-full bg-card overflow-hidden">
                            {Icon ? (
                            <Icon className="w-8 h-8 text-primary" />
                            ) : (
                            <img src={lottery.icon} alt={lottery.name} className="w-full h-full object-cover" />
                            )}
                        </div>
                        <span className="font-medium text-foreground">{lottery.name}</span>
                        </div>
                        <Button onClick={() => triggerFileInput(lottery.id)} variant="outline">
                        Cambiar Icono
                        </Button>
                        <Input
                        type="file"
                        className="hidden"
                        ref={(el) => (fileInputRefs.current[lottery.id] = el)}
                        onChange={(e) => handleLotteryIconFileChange(e, lottery.id)}
                        />
                    </div>
                    <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                        <div className="space-y-2">
                            <Label htmlFor={`lotteryName-${lottery.id}`}>Nombre</Label>
                            <Input
                                id={`lotteryName-${lottery.id}`}
                                value={lottery.name}
                                onChange={(e) => handleLotteryChange(lottery.id, 'name', e.target.value)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor={`lotteryDigits-${lottery.id}`}>Cifras</Label>
                            <Input
                                id={`lotteryDigits-${lottery.id}`}
                                type="number"
                                value={lottery.numberOfDigits}
                                onChange={(e) => handleLotteryChange(lottery.id, 'numberOfDigits', parseInt(e.target.value, 10) || 0)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor={`lotteryCost-${lottery.id}`}>Valor</Label>
                            <Input
                                id={`lotteryCost-${lottery.id}`}
                                type="number"
                                step="0.01"
                                value={lottery.cost}
                                onChange={(e) => handleLotteryChange(lottery.id, 'cost', parseFloat(e.target.value) || 0)}
                            />
                        </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

           {/* Card for Special Plays */}
          <Card>
            <CardHeader className="flex-row items-center justify-between">
                <div>
                    <CardTitle className='font-headline'>Jugadas Especiales</CardTitle>
                    <CardDescription>Crea y configura jugadas que aplican a múltiples sorteos.</CardDescription>
                </div>
                <Button onClick={addNewSpecialPlay}><PlusCircle className="mr-2 h-4 w-4"/>Añadir Jugada</Button>
            </CardHeader>
            <CardContent className="space-y-4">
              {specialPlays.map((play) => {
                const Icon = play.icon.startsWith('data:image')
                  ? null
                  : iconMap[play.icon as keyof typeof iconMap] || iconMap.Ticket;

                return (
                  <div key={play.id} className="p-3 rounded-lg bg-card-foreground/5 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 flex items-center justify-center rounded-full bg-card overflow-hidden">
                                {Icon ? (
                                <Icon className="w-8 h-8 text-primary" />
                                ) : (
                                <img src={play.icon} alt={play.name} className="w-full h-full object-cover" />
                                )}
                            </div>
                            <Input
                                value={play.name}
                                onChange={(e) => handleSpecialPlayChange(play.id, 'name', e.target.value)}
                                className="text-base font-medium" />
                        </div>
                        <div className="flex items-center gap-2">
                            <Button onClick={() => triggerFileInput(play.id)} variant="outline" size="sm">Cambiar Icono</Button>
                             <Button onClick={() => removeSpecialPlay(play.id)} variant="destructive" size="icon">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </div>
                        <Input
                            type="file"
                            className="hidden"
                            ref={(el) => (fileInputRefs.current[play.id] = el)}
                            onChange={(e) => handleSpecialPlayIconChange(e, play.id)}
                            accept="image/*"
                        />
                    </div>
                    <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                        <div className="space-y-2">
                            <Label>Cifras</Label>
                            <Input
                                type="number"
                                value={play.numberOfDigits}
                                onChange={(e) => handleSpecialPlayChange(play.id, 'numberOfDigits', parseInt(e.target.value, 10) || 0)}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Valor</Label>
                            <Input
                                type="number"
                                step="0.01"
                                value={play.cost}
                                onChange={(e) => handleSpecialPlayChange(play.id, 'cost', parseFloat(e.target.value) || 0)}
                            />
                        </div>
                    </div>
                     <div>
                        <Label className="text-base font-medium">Aplicar a Sorteos:</Label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-2">
                            {lotteries.map(lottery => (
                                <div key={lottery.id}>
                                    <p className="font-semibold">{lottery.name}</p>
                                    <div className="space-y-1 mt-1">
                                        {lottery.drawTimes.map(time => {
                                             const isChecked = play.appliesTo.some(a => a.lotteryId === lottery.id && a.drawTimes.includes(time));
                                             return (
                                                <div key={time} className="flex items-center gap-2">
                                                    <Checkbox 
                                                        id={`${play.id}-${lottery.id}-${time}`}
                                                        checked={isChecked}
                                                        onCheckedChange={(checked) => handleSpecialPlayAppliesToChange(play.id, lottery.id, time, !!checked)}
                                                    />
                                                    <Label htmlFor={`${play.id}-${lottery.id}-${time}`}>{time}</Label>
                                                </div>
                                            )
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          <div className="flex justify-end">
            <Button onClick={handleSaveChanges} size="lg">Guardar Cambios</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
