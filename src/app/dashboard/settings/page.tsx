
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { UploadCloud, PlusCircle, UserPlus, Save, Trash2, Pencil } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { useStateContext } from "@/context/StateContext"; // Importar el contexto
import { type Lottery } from "@/lib/data";
import { iconMap } from "@/lib/icon-map";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { generateTimeSlots } from "@/lib/time-slots";

const newLotterySchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  drawTimes: z.array(z.string()).min(1, "Se requiere al menos un horario de sorteo").max(4, "Se permiten como máximo 4 horarios"),
  numberOfDigits: z.number().min(2).max(5),
});

const newUserSchema = z.object({
  username: z.string().min(3, "El nombre de usuario debe tener al menos 3 caracteres"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});


export default function SettingsPage() {
  const { lotteries, setLotteries } = useStateContext(); // Usar el estado global
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [appName, setAppName] = useState("Lotto Hub");
  const timeSlots = generateTimeSlots();

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      toast.info("Archivo listo para subir", {
        description: `${file.name} será guardado al hacer clic en \"Guardar Cambios.\"`,
      });
    }
  };

  const handleSaveCustomization = () => {
    toast.success("Personalización Guardada", {
        description: `El título de la aplicación y el logo han sido guardados.`,
    });
  }
  
  const newLotteryForm = useForm<z.infer<typeof newLotterySchema>>({
    resolver: zodResolver(newLotterySchema),
    defaultValues: { name: "", drawTimes: [], numberOfDigits: 4 },
  });

  const newUserForm = useForm<z.infer<typeof newUserSchema>>({
    resolver: zodResolver(newUserSchema),
    defaultValues: { username: "", password: "" },
  });
  
  const onNewLotterySubmit = (values: z.infer<typeof newLotterySchema>) => {
     const newLottery: Lottery = {
       id: values.name.toLowerCase().replace(/\s/g, '-'),
       name: values.name,
       icon: 'Ticket', 
       drawTimes: values.drawTimes.filter(t => t && t !== 'none'),
       numberOfDigits: values.numberOfDigits,
     };

     setLotteries([...lotteries, newLottery]);

     toast.success("Nuevo Sorteo Añadido", {
        description: `El sorteo '${values.name}' ha sido creado.`,
      });
      newLotteryForm.reset();
  }
  
  const onNewUserSubmit = (values: z.infer<typeof newUserSchema>) => {
     toast.success("Nuevo Usuario Añadido", {
        description: `El usuario '${values.username}' ha sido creado.`,
      });
      newUserForm.reset();
  }

  const handleLotteryUpdate = (index: number, field: keyof Lottery, value: string | string[] | number) => {
    const updatedLotteries = lotteries.map((lottery, i) => {
      if (i === index) {
        return { ...lottery, [field]: value };
      }
      return lottery;
    });
    setLotteries(updatedLotteries);
  };

  const handleLotteryIconUpload = (e: React.ChangeEvent<HTMLInputElement>, lotteryIndex: number) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        handleLotteryUpdate(lotteryIndex, 'icon', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveLottery = (lotteryName: string) => {
    // Como ahora usamos el contexto, el guardado es implícito.
    // La notificación confirma la acción del usuario.
    toast.success("Cambios Guardados", {
        description: `Los cambios en el sorteo '${lotteryName}' han sido guardados.`,
    });
  }

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <div className="flex items-center">
        <h1 className="text-3xl font-bold font-headline">Ajustes</h1>
      </div>
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Personalización de la App</CardTitle>
            <CardDescription>
              Modifica la apariencia de tu aplicación.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="app-name">Título de la Aplicación</Label>
                <Input
                id="app-name"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
                />
            </div>
             <div className="space-y-2">
                <label className="font-medium">Logo de la App</label>
                <div className="flex items-center gap-4">
                    <div className="relative flex-1">
                      <Input
                        id="logo-upload"
                        type="file"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={handleFileUpload}
                        accept="image/png, image/jpeg, image/svg+xml"
                      />
                      <Button variant="outline" asChild className="pointer-events-none w-full">
                        <div>
                         <UploadCloud className="mr-2" />
                         <span>{logoFile ? logoFile.name : 'Subir Logo'}</span>
                        </div>
                      </Button>
                    </div>
                </div>
                 <p className="text-sm text-muted-foreground">Sube un nuevo logo. Tamaño recomendado: 128x128px.</p>
             </div>
          </CardContent>
          <CardFooter>
            <Button onClick={handleSaveCustomization}>
                <Save className="mr-2" />
                Guardar Cambios
            </Button>
          </CardFooter>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Gestión de Sorteos</CardTitle>
            <CardDescription>
              Añade nuevos sorteos o modifica los existentes.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
                <div>
                    <h3 className="text-lg font-medium mb-4">Añadir Nuevo Sorteo</h3>
                    <Form {...newLotteryForm}>
                        <form onSubmit={newLotteryForm.handleSubmit(onNewLotterySubmit)} className="space-y-4">
                            <div className="grid md:grid-cols-2 gap-4">
                                <FormField
                                    control={newLotteryForm.control}
                                    name="name"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Nombre del Sorteo</FormLabel>
                                        <FormControl>
                                        <Input placeholder="Ej: Millonario del Atardecer" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                                <FormField
                                    control={newLotteryForm.control}
                                    name="numberOfDigits"
                                    render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Cifras</FormLabel>
                                        <Select onValueChange={(value) => field.onChange(parseInt(value, 10))} defaultValue={String(field.value)}>
                                            <FormControl>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecciona las cifras" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                {[2, 3, 4, 5].map(digits => (
                                                    <SelectItem key={digits} value={String(digits)}>{`${digits} cifras`}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <FormMessage />
                                    </FormItem>
                                    )}
                                />
                            </div>
                            <div className="grid md:grid-cols-4 gap-4">
                                {[...Array(4)].map((_, index) => (
                                    <FormField
                                        key={index}
                                        control={newLotteryForm.control}
                                        name={`drawTimes.${index}` as const}
                                        render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Horario {index + 1}</FormLabel>
                                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Selecciona un horario" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="none">Ninguno</SelectItem>
                                                    {generateTimeSlots().map(slot => (
                                                        <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                            <FormMessage />
                                        </FormItem>
                                        )}
                                    />
                                ))}
                            </div>
                             <Button type="submit" className="w-full">
                                <PlusCircle className="mr-2" />
                                Añadir Sorteo
                             </Button>
                        </form>
                    </Form>
                </div>
                
                <Separator />

                <div>
                    <h3 className="text-lg font-medium mb-4">Sorteos Actuales</h3>
                    <div className="grid gap-4 md:grid-cols-2">
                        {lotteries.map((lottery, index) => {
                            const Icon = iconMap[lottery.icon];
                            return (
                                <Card key={lottery.id}>
                                    <CardHeader className="flex flex-row items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            {lottery.icon.startsWith('data:') ? (
                                                <img src={lottery.icon} alt={lottery.name} className="h-6 w-6" />
                                            ) : (
                                                Icon && <Icon className="h-6 w-6 text-primary" />
                                            )}
                                            <CardTitle className="text-xl font-semibold">{lottery.name}</CardTitle>
                                        </div>
                                         <Button variant="ghost" size="icon" disabled>
                                            <Trash2 className="h-4 w-4 text-destructive" />
                                         </Button>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor={`name-${lottery.id}`}>Nombre del Sorteo</Label>
                                            <Input 
                                                id={`name-${lottery.id}`} 
                                                value={lottery.name}
                                                onChange={(e) => handleLotteryUpdate(index, 'name', e.target.value)}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Cifras</Label>
                                            <Select onValueChange={(value) => handleLotteryUpdate(index, 'numberOfDigits', parseInt(value, 10))} value={String(lottery.numberOfDigits)}>
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecciona las cifras" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    {[2, 3, 4, 5].map(digits => (
                                                        <SelectItem key={digits} value={String(digits)}>{`${digits} cifras`}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Horarios</Label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {[...Array(4)].map((_, timeIndex) => (
                                                    <Select 
                                                        key={timeIndex} 
                                                        onValueChange={(value) => {
                                                            const newDrawTimes = [...(lottery.drawTimes || [])];
                                                            newDrawTimes[timeIndex] = value;
                                                            handleLotteryUpdate(index, 'drawTimes', newDrawTimes.filter(t => t && t !== 'none'));
                                                        }} 
                                                        value={lottery.drawTimes?.[timeIndex] || ""}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder={`Horario ${timeIndex+1}`} />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            <SelectItem value="none">Ninguno</SelectItem>
                                                            {generateTimeSlots().map(slot => (
                                                                <SelectItem key={slot} value={slot}>{slot}</SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <Label htmlFor={`logo-${lottery.id}`}>Logo del Sorteo</Label>
                                            <div className="flex items-center gap-4">
                                                <div className="relative flex-1">
                                                    <Input
                                                        id={`logo-${lottery.id}`}
                                                        type="file"
                                                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                        onChange={(e) => handleLotteryIconUpload(e, index)}
                                                        accept="image/png, image/jpeg, image/svg+xml"
                                                    />
                                                    <Button variant="outline" asChild className="pointer-events-none w-full">
                                                        <div>
                                                            <UploadCloud className="mr-2" />
                                                            <span>{'Subir nuevo logo'}</span>
                                                        </div>
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    </CardContent>
                                    <CardFooter>
                                        <Button onClick={() => handleSaveLottery(lottery.name)}>
                                            <Save className="mr-2 h-4 w-4"/>
                                            Guardar Cambios
                                        </Button>
                                    </CardFooter>
                                </Card>
                            )
                        })}
                    </div>
                </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Gestión de Usuarios</CardTitle>
            <CardDescription>
              Añade nuevos usuarios al sistema.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...newUserForm}>
                <form onSubmit={newUserForm.handleSubmit(onNewUserSubmit)} className="space-y-4">
                    <div className="grid md:grid-cols-3 gap-4">
                        <FormField
                            control={newUserForm.control}
                            name="username"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nombre de usuario</FormLabel>
                                <FormControl>
                                <Input placeholder="Ej: usuario01" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={newUserForm.control}
                            name="password"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Contraseña</FormLabel>
                                <FormControl>
                                <Input type="password" placeholder="••••••••" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <div className="md:pt-8">
                             <Button type="submit" className="w-full">
                                <UserPlus className="mr-2" />
                                Añadir Usuario
                             </Button>
                        </div>
                    </div>
                </form>
            </Form>
          </CardContent>
        </Card>

      </div>
    </main>
  );
}
