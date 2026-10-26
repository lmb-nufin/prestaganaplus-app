import Header from "@/components/header";
import BottomNavBar from "@/components/bottom-nav-bar";
import { AppShell } from "@/components/app-shell";
import { auth } from "@/lib/auth";
import { getIssuancePause } from "@/lib/phone";

// Este layout envuelve todas las páginas protegidas de la aplicación
export default async function AppLayout({ children }: { children: React.ReactNode }) {
    const session = await auth();
    const associateNumber = session?.user?.associateNumber;
    const issuancePause = associateNumber ? await getIssuancePause(associateNumber) : null;

    return (
        <AppShell header={<Header />} footer={<BottomNavBar issuancePause={issuancePause} />}>
            {/* El padding inferior deja ver lo último bajo el botón Vale Nuevo, que sobresale de la barra. */}
            <main className="pb-10 md:pb-0">
                {children}
            </main>
        </AppShell>
    );
}
