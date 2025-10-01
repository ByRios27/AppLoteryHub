'use client';

import React from 'react';
import QRCode from 'react-qr-code';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Share2 } from 'lucide-react';
import { Sale, Lottery, SpecialPlay } from '@/lib/data';
import { useStateContext } from '@/context/StateContext';

interface SaleReceiptProps {
  sale?: Sale;
  item?: Lottery | SpecialPlay;
}

export function SaleReceipt({ sale, item: initialItem }: SaleReceiptProps) {
  const { appCustomization, lotteries, specialPlays } = useStateContext();

  // Determine the item based on the sale's first draw if no initial item is provided
  const item = React.useMemo(() => {
    if (initialItem) return initialItem;
    if (!sale || !sale.draws || sale.draws.length === 0) return undefined;
    const primaryLotteryId = sale.draws[0].lotteryId;
    return lotteries.find(l => l.id === primaryLotteryId) || specialPlays.find(sp => sp.id === primaryLotteryId);
  }, [initialItem, sale, lotteries, specialPlays]);

  if (!sale || !item) {
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
  const isSpecialPlay = 'appliesTo' in item;

  const firstTicketNumber = sale.tickets && sale.tickets.length > 0 ? sale.tickets[0].ticketNumber : 'N/A';
  const ticketValue = JSON.stringify({ saleId: sale.id, ticketNumber: firstTicketNumber });

  const handleShare = () => {
    if (navigator.share) {
      let text = `*${appName} - Recibo de Venta*\n\n`;
      text += `*Jugada:* ${item.name}\n`;
      text += `*Cliente:* ${sale.customerName || 'N/A'}\n\n`;
      
      text += `*Números Jugados:*\n`;
      sale.tickets.forEach(t => {
          text += `- ${t.ticketNumber} (Costo: $${t.cost.toFixed(2)})\n`;
      });
      text += '\n';

      if (isSpecialPlay) {
          text += `*Sorteos Incluidos:*\n`;
          sale.draws.forEach(d => {
              const lotteryName = lotteries.find(l => l.id === d.lotteryId)?.name || 'Desconocido';
              text += `- ${lotteryName} (${d.drawTime})\n`;
          });
      } else {
          const drawTimes = sale.draws.map(d => d.drawTime).join(', ');
          text += `*Sorteo:* ${drawTimes}\n`;
      }

      text += `\n*Total Pagado:* $${sale.totalCost.toFixed(2)}\n`;
      text += `*ID Ticket:* ${sale.id}\n`;
      text += `Vendido el: ${new Date(sale.soldAt).toLocaleString()}\n`;

      navigator.share({
        title: `${appName} - Recibo de Venta`,
        text: text,
      }).catch(console.error);
    } else {
      alert('La función de compartir no es compatible con tu navegador.');
    }
  };

  const formatFractions = (fractions: any): string => {
    if (fractions === null || fractions === undefined) return 'N/A';
    if (Array.isArray(fractions)) return fractions.join(', ');
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
            <span className="font-semibold">Jugada:</span>
            <span>{item.name}</span>
          </div>

          {isSpecialPlay ? (
            <div>
              <span className="font-semibold">Sorteos Incluidos:</span>
              {sale.draws.map(draw => {
                const lotteryName = lotteries.find(l => l.id === draw.lotteryId)?.name || 'Sorteo Desconocido';
                return <div key={`${draw.lotteryId}-${draw.drawTime}`} className="text-xs flex justify-between"><span>- {lotteryName}</span><span>{draw.drawTime}</span></div>;
              })}
            </div>
          ) : (
            <div className="flex justify-between">
              <span className="font-semibold">Sorteo:</span>
              <span>{sale.draws.map(d => d.drawTime).join(', ')}</span>
            </div>
          )}

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
