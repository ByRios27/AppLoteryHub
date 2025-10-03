'use client';

import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Sale } from '@/lib/data';
import { useStateContext } from '@/context/StateContext';
import { format } from 'date-fns';
import html2canvas from 'html2canvas';
import { Button } from '@/components/ui/button';
import { Share2 } from 'lucide-react';
import { toast } from 'sonner';

interface ReceiptProps {
  sale: Sale;
}

// Componente para generar y mostrar el QR como una imagen PNG
const QrCodeGenerator: React.FC<{ text: string }> = ({ text }) => {
    const [imageUrl, setImageUrl] = useState('');

    useEffect(() => {
        if (text) {
            QRCode.toDataURL(text, { width: 96, margin: 1 }, (error, url) => {
                if (error) {
                    console.error('Error generating QR Code:', error);
                } else {
                    setImageUrl(url);
                }
            });
        }
    }, [text]);

    if (!imageUrl) {
        return <div className="w-24 h-24 bg-gray-200 rounded animate-pulse" />;
    }

    return <img src={imageUrl} alt="Sale QR Code" className="w-24 h-24" />;
};


const Receipt: React.FC<ReceiptProps> = ({ sale }) => {
  const { businessSettings, sellerId, lotteries } = useStateContext();
  const receiptRef = useRef<HTMLDivElement>(null);

  // Crear un objeto de verificación o un simple string para el QR
  const qrCodeValue = JSON.stringify({
      saleId: sale.id,
      lottery: sale.draws.map(d => lotteries.find(l => l.id === d.lotteryId)?.name).join(', '),
      date: sale.soldAt
  });

  const handleShare = async () => {
    if (receiptRef.current) {
      const canvas = await html2canvas(receiptRef.current);
      canvas.toBlob(async (blob) => {
        if (blob) {
          try {
            // 1. Try to share
            await navigator.share({
              files: [new File([blob], 'receipt.png', { type: 'image/png' })],
              title: 'Comprobante de Venta',
              text: 'Aquí está tu comprobante de venta.',
            });
          } catch (error) {
            console.error('Error sharing:', error);
            try {
                // 2. Try to copy to clipboard
                await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
                toast.success("Recibo copiado al portapapeles.");
            } catch (copyError) {
                console.error('Error copying to clipboard:', copyError);
                // 3. Fallback to download
                try {
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(blob);
                    link.download = 'receipt.png';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    URL.revokeObjectURL(link.href);
                    toast.info("Recibo descargado como imagen.");
                } catch (downloadError) {
                    console.error('Error downloading:', downloadError);
                    toast.error("No se pudo compartir, copiar ni descargar el recibo.");
                }
            }
          }
        }
      });
    }
  };

  return (
    <div className="relative">
        <div ref={receiptRef} id="receipt" className="bg-white text-black p-4 font-mono text-sm w-80 mx-auto border-2 border-dashed border-gray-400">
        <header className="text-center mb-4">
            <div className="flex items-center justify-center gap-2">
                {businessSettings.logo && <img src={businessSettings.logo} alt="App Logo" className="h-10 w-10 object-contain" />}
                <h1 className="text-xl font-bold font-headline">{businessSettings.name}</h1>
            </div>
            <p>Comprobante de Venta</p>
        </header>

        <div className="space-y-1 text-xs">
            <p><strong>Ticket ID:</strong> {sale.id}</p>
            <p><strong>Fecha y Hora:</strong> {format(new Date(sale.soldAt), "dd/MM/yyyy HH:mm:ss")}</p>
            <p><strong>Vendedor:</strong> {sellerId}</p>
            <p><strong>Cliente:</strong> {sale.customerName}</p>
            {sale.customerPhone && <p><strong>Teléfono:</strong> {sale.customerPhone}</p>}
            <div>
                <strong>Sorteos:</strong>
                {sale.draws.map(draw => {
                    const lottery = lotteries.find(l => l.id === draw.lotteryId);
                    return (
                        <p key={`${draw.lotteryId}-${draw.drawTime}`}>{lottery?.name} ({draw.drawTime})</p>
                    )
                })}
            </div>
        </div>

        <div className="border-t border-b border-dashed border-gray-400 my-2 py-2">
            <div className="grid grid-cols-3 font-bold">
            <span>Número</span>
            <span className="text-center">Fracc.</span>
            <span className="text-right">Monto</span>
            </div>
            {sale.tickets.map((ticket) => (
            <div key={ticket.id} className="grid grid-cols-3">
                <span>{ticket.ticketNumber}</span>
                <span className="text-center">{`x${Array.isArray(ticket.fractions) ? ticket.fractions.join('/') : ticket.fractions}`}</span>
                <span className="text-right">${ticket.cost.toFixed(2)}</span>
            </div>
            ))}
        </div>

        <div className="text-right font-bold text-base my-2">
            <p>TOTAL: ${sale.totalCost.toFixed(2)}</p>
        </div>

        <footer className="text-center mt-4">
            <div className="flex justify-center">
                <div className="p-2 bg-white inline-block">
                    <QrCodeGenerator text={qrCodeValue} />
                </div>
            </div>
            <p className="text-xs mt-2">¡Gracias por su compra!</p>
            <p className="text-xs italic">Conserve este comprobante.</p>
        </footer>
        </div>
        <div className="absolute top-0 right-0 m-4">
            <Button onClick={handleShare} size="icon" variant="ghost">
                <Share2 className="h-6 w-6 text-gray-600" />
            </Button>
        </div>
    </div>
  );
};

export default Receipt;