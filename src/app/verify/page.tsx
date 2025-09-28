'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useStateContext } from '@/context/StateContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Award, Share2, Printer } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import ReceiptComponent from '@/components/receipt';
import { Sale, Lottery } from '@/lib/data';
import * as htmlToImage from 'html-to-image';
import { useToast } from '@/hooks/use-toast';

interface VerificationResult {
  status: 'valid' | 'invalid' | 'winner';
  message: string;
  sale?: Sale;
  lottery?: Lottery;
  prizeTier?: number;
}

function VerifyPageContent() {
  const { sales, winners, lotteries } = useStateContext();
  const [result, setResult] = useState<VerificationResult | null>(null);
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const handleVerification = (saleId: string) => {
    const sale = sales.find(s => s.id === saleId);

    if (!sale) {
      setResult({ status: 'invalid', message: 'Esta venta no se encuentra en el sistema. Verifique el código.' });
      return;
    }
    
    const ticket = sale.tickets[0];
    if (!ticket) {
      setResult({ status: 'invalid', message: 'El boleto asociado a esta venta no es válido.' });
      return;
    }

    const lottery = lotteries.find(l => l.id === sale.lotteryId);
    if (!lottery) {
        setResult({ status: 'invalid', message: 'La lotería para este boleto no fue encontrada.' });
        return;
    }

    const winnerInfo = winners.find(w => sale.tickets.some(t => t.id === w.id));

    if (winnerInfo) {
      setResult({
        status: 'winner',
        message: `¡Boleto Ganador del ${winnerInfo.prizeTier}er Premio!`,
        sale,
        lottery,
        prizeTier: winnerInfo.prizeTier,
      });
    } else {
      setResult({
        status: 'valid',
        message: 'Boleto Válido. No es un ganador en los sorteos finalizados.',
        sale,
        lottery
      });
    }
  };

  useEffect(() => {
    const saleIdFromUrl = searchParams.get('saleId');
    if (saleIdFromUrl) {
      handleVerification(saleIdFromUrl);
    } else {
        setResult({ status: 'invalid', message: 'No se proporcionó un ID de venta para verificar.' });
    }
  }, [searchParams]);

  const handleShare = async () => {
        const receiptElement = document.getElementById('receipt-to-image');
        if (!receiptElement) {
            toast({ title: "Error", description: "No se pudo encontrar el contenido del recibo.", variant: "destructive" });
            return;
        }

        try {
            const dataUrl = await htmlToImage.toPng(receiptElement, { pixelRatio: 2, quality: 1.0 });
            const blob = await (await fetch(dataUrl)).blob();
            const file = new File([blob], "comprobante.png", { type: "image/png" });

            if (navigator.share && navigator.canShare({ files: [file] })) {
                await navigator.share({ files: [file] });
            } else {
                const link = document.createElement('a');
                link.href = dataUrl;
                link.download = 'comprobante.png';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                toast({ title: "Descargado", description: "El recibo se ha descargado como una imagen." });
            }
        } catch (error) {
            console.error('Error al generar o compartir la imagen del recibo', error);
            toast({ title: "Error", description: "No se pudo generar o compartir la imagen del recibo.", variant: "destructive" });
        }
    };
    
    const handlePrint = () => {
        const printContent = document.getElementById("receipt-to-image");
        if (printContent) {
            const styles = Array.from(document.styleSheets).map(s => s.href ? `@import url(${s.href});` : Array.from(s.cssRules).map(r => r.cssText).join('\n')).join('\n');
            const printWindow = window.open('', '', 'height=800,width=800');
            printWindow?.document.write(`<html><head><title>Imprimir Recibo</title><style>${styles}</style></head><body>`);
            printWindow?.document.write(printContent.innerHTML);
            printWindow?.document.write('</body></html>');
            printWindow?.document.close();
            printWindow?.focus();
            setTimeout(() => { printWindow?.print(); }, 500);
        }
    }

  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      {result?.status === 'invalid' && (
        <Card className="w-full max-w-md border-red-500 border-2">
          <CardHeader className="text-center">
            <div className="flex justify-center items-center gap-3 mb-2">
                <XCircle className="h-8 w-8 text-red-500" />
                <CardTitle className="text-2xl text-red-600">Verificación Fallida</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-center text-muted-foreground">{result.message}</p>
          </CardContent>
        </Card>
      )}

      {result?.status && result.status !== 'invalid' && result.sale && result.lottery && (
          <div className="w-full max-w-sm mx-auto bg-white dark:bg-gray-950 rounded-lg shadow-lg overflow-hidden">
            {result.status === 'winner' && (
                <div className="bg-green-500 text-white text-center p-3">
                    <div className="flex justify-center items-center gap-2">
                        <Award className="h-6 w-6" />
                        <h3 className="text-lg font-bold">¡Boleto Ganador!</h3>
                    </div>
                    <p className="text-sm">Premio de {result.prizeTier}er lugar.</p>
                </div>
            )}
            {result.status === 'valid' && (
                 <div className="bg-blue-500 text-white text-center p-3">
                    <div className="flex justify-center items-center gap-2">
                        <CheckCircle className="h-6 w-6" />
                        <h3 className="text-lg font-bold">Boleto Válido</h3>
                    </div>
                </div>
            )}
            <div id="receipt-to-image">
              <ReceiptComponent sale={result.sale} lotteryName={result.lottery.name} drawTime={result.sale.drawTime} />
            </div>
             <div className="bg-gray-50 dark:bg-gray-900 p-3 grid grid-cols-2 gap-3 border-t border-gray-200 dark:border-gray-800">
                <Button variant="secondary" onClick={handleShare}><Share2 className="mr-2 h-4 w-4"/>Compartir</Button>
                <Button onClick={handlePrint}><Printer className="mr-2 h-4 w-4"/>Imprimir</Button>
            </div>
          </div>
      )}

    </main>
  );
}

export default function VerifyPage() {
    return <VerifyPageContent />;
}
