'use client';

import React from 'react';
import QRCode from 'react-qr-code';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Sale, Lottery } from '@/lib/data';
import { useStateContext } from '@/context/StateContext';

interface SaleReceiptProps {
  sale: Sale;
  lottery: Lottery;
}

export function SaleReceipt({ sale, lottery }: SaleReceiptProps) {
  const { appCustomization } = useStateContext();

  const { appName, appLogo } = appCustomization;
  const ticketValue = JSON.stringify({ saleId: sale.id, ticketNumber: sale.tickets[0].ticketNumber });

  return (
    <Card className="w-full max-w-sm mx-auto font-sans text-sm">
      <CardHeader className="text-center p-4">
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
            <span>{sale.drawTime}</span>
          </div>
          <div className="flex justify-between">
            <span className="font-semibold">Cliente:</span>
            <span>{sale.customerName || 'N/A'}</span>
          </div>
          <Separator className="my-2" />
          {sale.tickets.map((ticket, index) => (
            <div key={index}>
              <div className="flex justify-between font-bold text-base">
                <span className="font-semibold">Número:</span>
                <span>{ticket.ticketNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Fracciones:</span>
                <span>{ticket.fractions.join(', ')}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-semibold">Costo:</span>
                <span>${(ticket.fractions.length * 0.20).toFixed(2)}</span>
              </div>
            </div>
          ))}
          <Separator className="my-2" />
          <div className="flex justify-between font-bold text-lg">
            <span>Total Pagado:</span>
            <span>${sale.totalCost.toFixed(2)}</span>
          </div>
          <Separator className="my-2" />
          <div className="text-center text-xs text-muted-foreground pt-2">
            <p>Vendido el: {new Date(sale.soldAt).toLocaleString()}</p>
            <p>ID Ticket: {sale.id}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}