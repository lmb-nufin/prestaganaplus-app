'use client';

import Header from "@/components/header";
import BottomNavBar from "@/components/bottom-nav-bar";

// Este layout envuelve todas las páginas protegidas de la aplicación
export default function AppLayout({ children }: { children: React.ReactNode }) {

    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            {/* La etiqueta main ahora vive aquí y envuelve a todos los children */}
            <main className="flex-1">
                {children}
            </main>
            <BottomNavBar />
        </div>
    );
}
