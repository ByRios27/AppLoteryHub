'use client';

import { useState, useEffect, useRef } from 'react';
import { Html5Qrcode, Html5QrcodeScannerState } from 'html5-qrcode';
import { Award, CheckCircle, XCircle, Camera, Upload, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import ReceiptComponent from '@/components/receipt';
import { Sale } from '@/lib/data'; // We only use the type here
import { useToast } from '@/hooks/use-toast';

// Define a structure for the public-facing sale data
interface PublicSale extends Omit<Sale, 'lotteryId'> {
    lotteryName: string;
}

// We need to fetch winner info separately but securely.
// For now, this component will only validate and display the receipt.
// Winner status can be added later by enhancing the API.

const qrcodeRegionId = "qr-scanner-region";

function VerifyPageContent() {
    const [scanResult, setScanResult] = useState<PublicSale | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const html5QrCodeRef = useRef<Html5Qrcode | null>(null);
    const { toast } = useToast();

    const clearState = () => {
        setScanResult(null);
        setError(null);
        setIsLoading(false);
    };

    const startScanner = () => {
        if (html5QrCodeRef.current?.getState() === Html5QrcodeScannerState.SCANNING) {
            return;
        }

        clearState();

        Html5Qrcode.getCameras().then(cameras => {
            if (cameras && cameras.length) {
                const cameraId = cameras[0].id;
                html5QrCodeRef.current?.start(
                    cameraId,
                    { fps: 10, qrbox: { width: 250, height: 250 } },
                    (decodedText, decodedResult) => { // Success callback
                        html5QrCodeRef.current?.stop();
                        handleScanSuccess(decodedText);
                    },
                    (errorMessage) => { // Error callback (optional)
                       // This is called frequently, so we don't log it to avoid spam.
                    }
                ).catch(err => {
                    setError("No se pudo iniciar el escáner. Revisa los permisos de la cámara.");
                });
            } else {
                setError("No se encontraron cámaras en este dispositivo.");
            }
        }).catch(err => {
            setError("Error al acceder a la cámara. Por favor, concede los permisos necesarios.");
        });
    };

    const stopScanner = () => {
        if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
            html5QrCodeRef.current.stop().catch(err => {
                console.error("Error al detener el escáner:", err);
            });
        }
    };
    
    const handleScanSuccess = async (decodedText: string) => {
        setIsLoading(true);
        setError(null);
        try {
            const data = JSON.parse(decodedText);
            const saleId = data.saleId;

            if (!saleId) {
                throw new Error("El código QR no contiene un ID de venta válido.");
            }

            const response = await fetch(`/api/sales?saleId=${saleId}`);
            
            if (response.ok) {
                const saleData: PublicSale = await response.json();
                setScanResult(saleData);
            } else {
                const errorData = await response.json();
                throw new Error(errorData.message || "No se pudo verificar el boleto.");
            }

        } catch (e: any) {
            setError(e.message || "El código QR es inválido o no se pudo procesar.");
            setScanResult(null);
        } finally {
            setIsLoading(false);
        }
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        stopScanner();
        clearState();
        setIsLoading(true);
        try {
            await html5QrCodeRef.current?.scanFile(file, true)
                .then(decodedText => {
                    handleScanSuccess(decodedText);
                })
                .catch(err => {
                    setError("No se pudo encontrar un código QR en la imagen seleccionada.");
                });
        } catch (e: any) {
            setError(e.message || "Error al procesar la imagen.");
        } finally {
             setIsLoading(false);
             // Reset the file input so the same file can be selected again
             event.target.value = '';
        }
    };

    // Initialize and cleanup the scanner
    useEffect(() => {
        if (!html5QrCodeRef.current) {
            html5QrCodeRef.current = new Html5Qrcode(qrcodeRegionId);
        }
        // Cleanup function to stop the scanner when the component unmounts
        return () => {
           stopScanner();
        };
    }, []);


    return (
        <main className="flex flex-col items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4 space-y-4">
            <Card className="w-full max-w-lg shadow-lg">
                <CardHeader>
                    <CardTitle className="text-center text-2xl font-headline">Verificador de Boletos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div id={qrcodeRegionId} className="w-full border-2 border-dashed rounded-lg p-2" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        <Button onClick={startScanner}><Camera className="mr-2 h-4 w-4" /> Escanear con Cámara</Button>
                        <Button asChild variant="secondary">
                            <label htmlFor="qr-file-input">
                                <Upload className="mr-2 h-4 w-4" /> Subir Imagen
                                <input id="qr-file-input" type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                            </label>
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {isLoading && (
                <div className="flex items-center space-x-2 text-muted-foreground">
                    <RefreshCw className="h-5 w-5 animate-spin" />
                    <span>Verificando...</span>
                </div>
            )}

            {error && (
                <Card className="w-full max-w-lg border-red-500 border-2">
                    <CardHeader className="text-center">
                         <div className="flex justify-center items-center gap-3">
                            <XCircle className="h-8 w-8 text-red-500" />
                            <CardTitle className="text-2xl text-red-600">Boleto Inválido</CardTitle>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <p className="text-center text-muted-foreground">{error}</p>
                    </CardContent>
                </Card>
            )}

            {scanResult && (
                 <div className="w-full max-w-sm mx-auto bg-white dark:bg-gray-950 rounded-lg shadow-lg overflow-hidden">
                    <div className="bg-green-500 text-white text-center p-3">
                        <div className="flex justify-center items-center gap-2">
                            <CheckCircle className="h-6 w-6" />
                            <h3 className="text-lg font-bold">Boleto Válido</h3>
                        </div>
                    </div>
                    <ReceiptComponent sale={scanResult} lotteryName={scanResult.lotteryName} drawTime={scanResult.drawTime} />
                </div>
            )}

        </main>
    );
}

export default function VerifyPage() {
    return <VerifyPageContent />;
}
