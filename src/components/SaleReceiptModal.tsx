'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { SaleReceipt } from './SaleReceipt';
import { Sale, Lottery } from '@/lib/data';
import { X } from 'lucide-react';

interface SaleReceiptModalProps {
  sale?: Sale;
  lottery?: Lottery;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SaleReceiptModal({ sale, lottery, open, onOpenChange }: SaleReceiptModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm p-0">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle>Recibo de Venta</DialogTitle>
          <DialogClose asChild>
            <Button variant="ghost" size="icon" className="absolute top-2 right-2">
              <X className="h-4 w-4" />
              <span className="sr-only">Cerrar</span>
            </Button>
          </DialogClose>
        </DialogHeader>
        <SaleReceipt sale={sale} lottery={lottery} />
      </DialogContent>
    </Dialog>
  );
}
