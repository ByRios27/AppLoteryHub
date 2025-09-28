'use client';

import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export default function LotteriesPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Loterías y Sorteos</CardTitle>
        <CardDescription>Aquí se mostrará la lista de loterías disponibles.</CardDescription>
      </CardHeader>
      <CardContent>
        <p>Próximamente: ¡Una lista completa de todas las loterías y sorteos que puedes jugar!</p>
      </CardContent>
    </Card>
  );
}
