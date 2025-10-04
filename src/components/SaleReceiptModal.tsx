'use client';

import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import Receipt from './receipt';
import { Sale, Lottery, SpecialPlay } from '@/lib/data';
import { X } from 'lucide-react';

export interface SaleReceiptModalProps {
  sale: Sale;
  item: Lottery | SpecialPlay;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SaleReceiptModal({ sale, item, open, onOpenChange }: SaleReceiptModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm p-0">
        <DialogHeader className="p-4 pb-0">
          <DialogTitle>Recibo de Venta</DialogTitle>
          <DialogDescription className="sr-only">
            Este es un recibo de la venta realizada.
          </DialogDescription>
          <DialogClose asChild>
            <Button variant="ghost" size="icon" className="absolute top-2 right-2">
              <X className="h-4 w-4" />
              <span className="sr-only">Cerrar</span>
            </Button>
          </DialogClose>
        </DialogHeader>
        {sale && <Receipt sale={sale} />}
      </DialogContent>
    </Dialog>
  );
}
