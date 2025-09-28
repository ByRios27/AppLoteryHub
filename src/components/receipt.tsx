'use client';

import React from 'react';
import { QRCode } from 'react-qr-code';
import { Sale } from '@/lib/data';
import { useStateContext } from '@/context/StateContext';

interface ReceiptProps {
  sale: Sale;
  lotteryName: string;
  drawTime: string;
}

const Receipt: React.FC<ReceiptProps> = ({ sale, lotteryName, drawTime }) => {
  const { appCustomization, sellerId } = useStateContext();

  return (
    <div id="receipt" className="bg-white text-black p-4 font-mono text-sm w-80 mx-auto border-2 border-dashed border-gray-400">
      <header className="text-center mb-4">
        <div className="flex items-center justify-center gap-2">
            {appCustomization.appLogo && <img src={appCustomization.appLogo} alt="App Logo" className="h-10 w-10 object-contain" />}
            <h1 className="text-xl font-bold font-headline">{appCustomization.appName}</h1>
        </div>
        <p>Comprobante de Venta</p>
      </header>

      <div className="space-y-1 text-xs">
        <p><strong>Ticket ID:</strong> {sale.id}</p>
        <p><strong>Fecha y Hora:</strong> {new Date(sale.timestamp).toLocaleString()}</p>
        <p><strong>Vendedor:</strong> {sellerId}</p>
        <p><strong>Cliente:</strong> {sale.customerName}</p>
        <p><strong>Teléfono:</strong> {sale.customerPhone}</p>
        <p><strong>Sorteo:</strong> {lotteryName} ({drawTime})</p>
      </div>

      <div className="border-t border-b border-dashed border-gray-400 my-2 py-2">
        <div className="grid grid-cols-3 font-bold">
          <span>Número</span>
          <span className="text-center">Cantidad</span>
          <span className="text-right">Total</span>
        </div>
        {sale.numbers.map((item, index) => (
          <div key={index} className="grid grid-cols-3">
            <span>{item.number}</span>
            <span className="text-center">{`x${item.quantity}`}</span>
            <span className="text-right">${item.amount.toFixed(2)}</span>
          </div>
        ))}
      </div>

      <div className="text-right font-bold text-base my-2">
        <p>TOTAL: ${sale.totalAmount.toFixed(2)}</p>
      </div>

      <footer className="text-center mt-4">
        <div className="flex justify-center">
            <div className="p-2 bg-white inline-block">
                <QRCode value={sale.id} size={96} />
            </div>
        </div>
        <p className="text-xs mt-2">¡Gracias por su compra!</p>
      </footer>
    </div>
  );
};

export default Receipt;
