'use client';

import { Dialog, DialogContent, DialogTrigger } from "./ui/dialog";
import { Button } from "./ui/button";
import { Wallet } from "lucide-react";
import { PaymentOptionsModal } from "./payment-options-modal";

interface PaymentOptionsDialogProps {
  paymentReferences: {
    stpClabe: string;
    cieConvenio: string;
    cieReference: string;
    payCashReference: string;
  }
}

export function PaymentOptionsDialog({ paymentReferences }: PaymentOptionsDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="w-full bg-accent hover:bg-accent/90 text-accent-foreground" size="sm">
          <Wallet className="mr-2" />
          Pagar Ahora
        </Button>
      </DialogTrigger>
      <DialogContent className="w-[calc(100%-2rem)] max-w-sm overflow-hidden rounded-2xl p-0">
        <PaymentOptionsModal
          stpClabe={paymentReferences.stpClabe}
          cieConvenio={paymentReferences.cieConvenio}
          cieReference={paymentReferences.cieReference}
          payCashReference={paymentReferences.payCashReference}
        />
      </DialogContent>
    </Dialog>
  );
}
