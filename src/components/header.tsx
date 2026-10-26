'use client';

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Menu, Home, List, LogOut, LifeBuoy, UserCircle, Bell, ArrowLeft } from "lucide-react";
import Logo from "./logo";
import { cn } from "@/lib/utils";
import { performSignOut } from "@/app/actions";
import { useNotifications } from "@/context/notifications-context";

const navItems = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/vales", label: "Vales", icon: List },
  { href: "/notificaciones", label: "Notificaciones", icon: Bell },
  { href: "/perfil", label: "Perfil", icon: UserCircle },
  { href: "/soporte", label: "Soporte", icon: LifeBuoy },
];

const mainPages = navItems.map(item => item.href);

const NavLink = ({ href, label, icon: Icon, onClick }) => {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link href={href} passHref>
      <Button
        variant={isActive ? "secondary" : "ghost"}
        className="w-full justify-start gap-2"
        onClick={onClick}
      >
        <Icon className="h-4 w-4" />
        {label}
      </Button>
    </Link>
  );
};

export default function Header() {
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const { unreadCount } = useNotifications();
  const pathname = usePathname();
  const router = useRouter();

  const isSubPage = !mainPages.includes(pathname);

  const BellIconWithBadge = () => (
    <div className="relative">
      <Bell className="size-6" />
      {unreadCount > 0 && (
        <span 
            className="absolute top-0 right-0 flex h-3 min-w-3 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold leading-none text-white ring-1 ring-background"
            style={{ transform: 'translate(40%, -40%)' }}
        >
          {unreadCount}
        </span>
      )}
    </div>
  );

  // Va dentro de AppShell: no es fixed ni sticky, así que en iPhone no se desfasa al hacer scroll.
  return (
    <header className="relative z-50 w-full flex-shrink-0 border-b bg-background">
      <div className="container flex h-14 items-center px-2 md:px-4">
        
        {/* --- VISTA MÓVIL --- */}
        <div className="flex w-full items-center justify-between md:hidden">
            <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
              <SheetTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <Menu className="size-6" />
                    <span className="sr-only">Abrir menú</span>
                  </Button>
              </SheetTrigger>
              <SheetContent side="left" className="flex flex-col p-0">
                <SheetHeader className="p-4 border-b">
                  <SheetTitle>
                      <Link href="/" onClick={() => setIsSheetOpen(false)}><Logo /></Link>
                  </SheetTitle>
                </SheetHeader>
                <div className="flex-1">
                  <nav className="flex flex-col gap-1 p-4">
                    {navItems.map((item) => <NavLink key={item.href} {...item} onClick={() => setIsSheetOpen(false)} />)}
                  </nav>
                </div>
                <div className="p-4 mt-auto border-t">
                    <form action={performSignOut}>
                      <Button type="submit" variant="ghost" className="w-full justify-start gap-2">
                          <LogOut className="h-4 w-4" />
                          Cerrar Sesión
                      </Button>
                    </form>
                </div>
              </SheetContent>
            </Sheet>
            
            <Link href="/" className="absolute left-1/2 -translate-x-1/2"><Logo /></Link>

            <div className="flex items-center">
              {isSubPage ? (
                  <Button variant="ghost" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="size-6" />
                    <span className="sr-only">Regresar</span>
                  </Button>
              ) : (
                <Link href="/notificaciones" passHref>
                  <Button asChild variant="ghost" size="icon">
                    <div><BellIconWithBadge /><span className="sr-only">Notificaciones</span></div>
                  </Button>
                </Link>
              )}
            </div>
        </div>

        {/* --- VISTA DE ESCRITORIO --- */}
        <div className="hidden w-full items-center justify-between md:flex">
           <Link href="/" className="mr-4"><Logo /></Link>
           <nav className="flex flex-1 items-center gap-4 text-sm lg:gap-6">
            {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn("transition-colors hover:text-foreground/80", pathname === item.href ? "text-foreground" : "text-foreground/60")}
                >
                  {item.label}
                </Link>
            ))}
          </nav>
            <div className="flex items-center gap-2">
                <Link href="/notificaciones" passHref>
                    <Button asChild variant="ghost" size="icon">
                      <div><BellIconWithBadge /><span className="sr-only">Notificaciones</span></div>
                    </Button>
                </Link>
               <form action={performSignOut}>
                <Button type="submit" variant="outline" size="sm">
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar Sesión
                </Button>
              </form>
            </div>
        </div>
      </div>
    </header>
  );
}
