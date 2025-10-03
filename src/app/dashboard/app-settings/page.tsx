'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import DashboardHeader from '@/components/ui/DashboardHeader';
import { toast } from 'sonner';

export default function AjustesPage() {
  const [use2FA, setUse2FA] = useState(false);

  const handleCreateBackup = () => {
    // Lógica para crear y descargar el backup
    toast.info("Función no implementada todavía.", {
      description: "La creación de copias de seguridad estará disponible pronto.",
    });
  };

  const handleRestoreBackup = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Lógica para leer y restaurar el backup
      toast.info(`Archivo "${file.name}" seleccionado.`, {
        description: "La restauración desde copia de seguridad aún no está implementada.",
      });
    }
  };

  return (
    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
      <DashboardHeader title="Ajustes de la Cuenta" />
      
      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Perfil de Usuario</CardTitle>
            <CardDescription>Gestiona tu información personal y de acceso.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Nombre de Usuario</Label>
              <Input id="username" placeholder="Tu nombre de usuario" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input id="email" type="email" placeholder="tu@email.com" />
            </div>
             <Button>Actualizar Perfil</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cambiar Contraseña</CardTitle>
            <CardDescription>Para mayor seguridad, te recomendamos cambiar tu contraseña periódicamente.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="current-password">Contraseña Actual</Label>
              <Input id="current-password" type="password" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">Nueva Contraseña</Label>
              <Input id="new-password" type="password" />
            </div>
             <Button>Cambiar Contraseña</Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Seguridad</CardTitle>
            <CardDescription>Añade una capa extra de seguridad a tu cuenta.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between space-x-2">
              <Label htmlFor="2fa-switch" className="flex flex-col space-y-1">
                <span>Autenticación de Dos Factores (2FA)</span>
                <span className="font-normal leading-snug text-muted-foreground">
                  Requiere un código de verificación adicional al iniciar sesión.
                </span>
              </Label>
              <Switch
                id="2fa-switch"
                checked={use2FA}
                onCheckedChange={setUse2FA}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Copia de Seguridad y Restauración</CardTitle>
            <CardDescription>Crea y restaura copias de seguridad de todos tus datos.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Crear Copia de Seguridad</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Descarga un archivo con todos tus datos: ajustes, sorteos, ventas, etc. Guárdalo en un lugar seguro.
              </p>
              <Button onClick={handleCreateBackup}>Descargar Copia de Seguridad</Button>
            </div>
            <Separator />
            <div>
              <Label htmlFor="backup-file">Restaurar desde Copia de Seguridad</Label>
              <p className="text-sm text-muted-foreground mb-2">
                Selecciona un archivo de respaldo para restaurar la aplicación. Se sobrescribirán todos los datos actuales.
              </p>
              <Input id="backup-file" type="file" accept=".json" onChange={handleRestoreBackup} />
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
