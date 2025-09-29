'use client';

import { useRef } from 'react';
import { useRouter } from 'next/navigation';
import { ImageIcon } from 'lucide-react';

import { useStateContext } from '@/context/StateContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { iconMap } from '@/lib/icon-map';
import { Label } from '@/components/ui/label';

export default function SettingsPage() {
  const { lotteries, setLotteries, appCustomization, setAppCustomization } = useStateContext();
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

  // --- Save Changes ---
  const handleSaveChanges = () => {
    toast({ title: '¡Guardado!', description: 'Los cambios se han guardado con éxito.' });
    router.push('/dashboard');
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
                                onChange={(e) => handleLotteryChange(lottery.id, 'numberOfDigits', parseInt(e.target.value, 10))}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor={`lotteryCost-${lottery.id}`}>Valor</Label>
                            <Input
                                id={`lotteryCost-${lottery.id}`}
                                type="number"
                                value={lottery.cost}
                                onChange={(e) => handleLotteryChange(lottery.id, 'cost', parseInt(e.target.value, 10))}
                            />
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
