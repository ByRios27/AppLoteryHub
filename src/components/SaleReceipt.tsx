'use client';

import React from 'react';
import QRCode from 'react-qr-code';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Share2 } from 'lucide-react';
import { Sale, Lottery } from '@/lib/data';
import { useStateContext } from '@/context/StateContext';

interface SaleReceiptProps {
  sale?: Sale;
  lottery?: Lottery;
}

export function SaleReceipt({ sale, lottery }: SaleReceiptProps) {
  const { appCustomization } = useStateContext();

  if (!sale || !lottery) {
    return (
      <Card className="w-full max-w-sm mx-auto font-sans text-sm">
        <CardHeader className="text-center p-4">
          <CardTitle className="font-headline text-lg">Recibo no disponible</CardTitle>
        </CardHeader>
        <CardContent className="p-4">
          <p>Los datos para generar el recibo no están completos o son incorrectos.</p>
        </CardContent>
      </Card>
    );
  }

  const { appName, appLogo } = appCustomization;
  
  const firstTicketNumber = sale.tickets && sale.tickets.length > 0 ? sale.tickets[0].ticketNumber : 'N/A';
  const ticketValue = JSON.stringify({ saleId: sale.id, ticketNumber: firstTicketNumber });

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `${appName} - Recibo de Venta`,
        text: `Tu recibo para la lotería ${lottery.name}.`,
        url: window.location.href,
      }).catch(console.error);
    } else {
      alert('La función de compartir no es compatible con tu navegador.');
    }
  };

  const formatFractions = (fractions: any): string => {
    if (fractions === null || fractions === undefined) {
      return 'N/A';
    }
    if (Array.isArray(fractions)) {
      return fractions.join(', ');
    }
    if (typeof fractions === 'string') {
      return fractions.split(',').map(item => item.trim()).join(', ');
    }
    if (typeof fractions === 'number') {
      return fractions.toString();
    }
    return String(fractions);
  };

  return (
    <Card className="w-full max-w-sm mx-auto font-sans text-sm">
      <CardHeader className="text-center p-4 relative">
        <div className="absolute top-4 right-4">
          <Button variant="ghost" size="icon" onClick={handleShare}>
            <Share2 className="h-5 w-5" />
            <span className="sr-only">Compartir</span>
          </Button>
        </div>
        <div className="flex items-center justify-center gap-2 mb-2">
          {appLogo && <img src={appLogo} alt="Logo" className="h-8 w-8" />}
          <CardTitle className="font-headline text-lg">{appName}</CardTitle>
        </div>
        <p className="text-xs text-muted-foreground">Recibo de Venta</p>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="flex justify-center mb-4">
          <div style={{ background: 'white', padding: '8px' }}>
            <QRCode value={ticketValue} size={100} />
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="font-semibold">Lotería:</span>
            <span>{lottery.name}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">Sorteo:</span>
            <span>{sale.draws && sale.draws.length > 0 ? sale.draws.map(d => d.drawTime).join(', ') : 'N/A'}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">Cliente:</span>
            <span>{sale.customerName || 'N/A'}</span>
          </div>
          <Separator className="my-2" />
          
          {sale.tickets && sale.tickets.length > 0 ? (
            sale.tickets.map((ticket, index) => (
              <div key={index}>
                <div className="flex justify-between font-bold text-base">
                  <span className="font-semibold">Número:</span>
                  <span>{ticket.ticketNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Fracciones:</span>
                  <span>{formatFractions(ticket.fractions)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="font-semibold">Costo:</span>
                  <span>${(ticket.cost).toFixed(2)}</span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-center text-muted-foreground">No hay jugadas en este recibo.</p>
          )}

          <Separator className="my-2" />
          <div className="flex justify-between font-bold text-lg">
            <span>Total Pagado:</span>
            <span>${sale.totalCost ? sale.totalCost.toFixed(2) : '0.00'}</span>
          </div>
          <Separator className="my-2" />
          <div className="text-center text-xs text-muted-foreground pt-2">
            <p>Vendido el: {sale.soldAt ? new Date(sale.soldAt).toLocaleString() : 'N/A'}</p>
            <p>ID Vendedor: {sale.sellerId || 'N/A'}</p>
            <p>ID Ticket: {sale.id}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
