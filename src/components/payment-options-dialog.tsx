'use client';

import { Dialog, DialogContent, DialogTrigger } from "./ui/dialog";
import { Button } from "./ui/button";
import { CreditCard, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { PaymentOptionsModal } from "./payment-options-modal";

interface PaymentOptionsDialogProps {
  paymentReferences: {
    stpClabe: string;
    cieConvenio: string;
    cieReference: string;
    payCashReference: string;
  };
  /** Solo estilo del botón (dashboard): ancho completo, 50px y verde. El diálogo no cambia. */
  prominent?: boolean;
}

export function PaymentOptionsDialog({ paymentReferences, prominent = false }: PaymentOptionsDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          className={cn(
            "w-full",
            prominent
              ? "h-[50px] rounded-[14px] bg-[#2F8F3E] font-headline text-[15px] font-semibold text-white hover:bg-[#287A35]"
              : "bg-accent hover:bg-accent/90 text-accent-foreground"
          )}
          size={prominent ? undefined : "sm"}
        >
          {prominent ? <CreditCard className="mr-1" /> : <Wallet className="mr-2" />}
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
