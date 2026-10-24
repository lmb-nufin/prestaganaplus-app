import Link from 'next/link';
import { redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

import { auth } from '@/lib/auth';
import { getPhoneOfferOption } from '@/lib/phone';
import { PhoneOfferView } from '@/components/phone-offer';
import { Button } from '@/components/ui/button';

export default async function PhoneOfferPage() {
  const session = await auth();
  const associateNumber = session?.user?.associateNumber;
  if (!associateNumber) {
    redirect('/login');
  }

  // Solo la UX: requestPhone vuelve a validar todo antes de crear la solicitud.
  const option = await getPhoneOfferOption(associateNumber);

  return (
    <div className="flex min-h-screen flex-col bg-indigo-50/40">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container flex h-14 items-center px-4">
          <Button variant="ghost" asChild size="sm">
            <Link href="/vales/nuevo">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a Vale Nuevo
            </Link>
          </Button>
        </div>
      </header>
      <main className="w-full flex-grow">
        <div className="mx-auto w-full max-w-md px-2 py-4">
          <PhoneOfferView option={option} />
        </div>
      </main>
    </div>
  );
}
