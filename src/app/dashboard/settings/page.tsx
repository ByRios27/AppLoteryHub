
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { UploadCloud, PlusCircle, UserPlus, Save } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { lotteries as initialLotteries, type Lottery } from "@/lib/data";
import { Ticket } from "lucide-react";

const newLotterySchema = z.object({
  name: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  drawTimes: z.string().min(1, "Se requiere al menos un horario de sorteo"),
});

const newUserSchema = z.object({
  username: z.string().min(3, "El nombre de usuario debe tener al menos 3 caracteres"),
  password: z.string().min(6, "La contraseña debe tener al menos 6 caracteres"),
});


export default function SettingsPage() {
  const { toast } = useToast();
  const [lotteries, setLotteries] = useState<Lottery[]>(initialLotteries);
  const [logoFile, setLogoFile] = useState<File | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      toast({
        title: "Archivo listo para subir",
        description: `${file.name} será guardado al hacer clic en \"Guardar Cambios\".`,
      });
    }
  };

  const handleSaveCustomization = () => {
    if (logoFile) {
        toast({
            title: "Personalización Guardada (Simulado)",
            description: `El logo ${logoFile.name} ha sido guardado. La funcionalidad real no está implementada.`,
        });
    } else {
        toast({
            title: "Sin cambios que guardar",
            description: `No has seleccionado un nuevo logo.`,
            variant: 'destructive'
        });
    }
  }
  
  const newLotteryForm = useForm<z.infer<typeof newLotterySchema>>({
    resolver: zodResolver(newLotterySchema),
    defaultValues: { name: "", drawTimes: "" },
  });

  const newUserForm = useForm<z.infer<typeof newUserSchema>>({
    resolver: zodResolver(newUserSchema),
    defaultValues: { username: "", password: "" },
  });
  
  const onNewLotterySubmit = (values: z.infer<typeof newLotterySchema>) => {
     const newLottery: Lottery = {
       id: values.name.toLowerCase().replace(/\s/g, '-'),
       name: values.name,
       Icon: Ticket, // Using a default icon for new lotteries
       drawTimes: values.drawTimes.split(',').map(t => t.trim()),
     };

     setLotteries([...lotteries, newLottery]);

     toast({
        title: "Nuevo Sorteo Añadido (Simulado)",
        description: `El sorteo '${values.name}' con horarios a las ${values.drawTimes} ha sido creado.`,
      });
      newLotteryForm.reset();
  }
  
  const onNewUserSubmit = (values: z.infer<typeof newUserSchema>) => {
     toast({
        title: "Nuevo Usuario Añadido (Simulado)",
        description: `El usuario '${values.username}' ha sido creado.`,
      });
      newUserForm.reset();
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
              Añade nuevos sorteos. Los sorteos existentes se muestran a continuación.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...newLotteryForm}>
                <form onSubmit={newLotteryForm.handleSubmit(onNewLotterySubmit)} className="space-y-4">
                    <div className="grid md:grid-cols-3 gap-4">
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
                            name="drawTimes"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Horarios (separados por coma)</FormLabel>
                                <FormControl>
                                <Input placeholder="Ej: 10:00 AM, 04:00 PM" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                            )}
                        />
                        <div className="md:pt-8">
                             <Button type="submit" className="w-full">
                                <PlusCircle className="mr-2" />
                                Añadir Sorteo
                             </Button>
                        </div>
                    </div>
                </form>
            </Form>
             <div className="mt-6">
                <h3 className="text-lg font-medium">Sorteos Actuales</h3>
                 <ul className="mt-2 list-disc list-inside space-y-1 text-muted-foreground">
                    {lotteries.map(l => <li key={l.id}>{l.name} ({l.drawTimes.join(', ')})</li>)}
                 </ul>
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

  