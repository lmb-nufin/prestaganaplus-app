'use client';

import Header from "@/components/header";
import BottomNavBar from "@/components/bottom-nav-bar";

// Este layout envuelve todas las páginas protegidas de la aplicación
export default function AppLayout({ children }: { children: React.ReactNode }) {

    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            {/* El padding inferior deja libre la barra de navegación fija (y la zona del indicador de inicio en iPhone). */}
            <main className="flex-1 pb-[calc(6rem+env(safe-area-inset-bottom))] md:pb-0">
                {children}
            </main>
            <BottomNavBar />
        </div>
    );
}
