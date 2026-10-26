import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import Header from '@/components/header';
import BottomNavBar from '@/components/bottom-nav-bar';
import { AppShell } from '@/components/app-shell';

export const ValesDashboardSkeleton = () => {
  return (
    <div className="flex flex-col">
      <header className="shadow-sm">
        <div className="container mx-auto flex h-12 items-center justify-between px-2 md:justify-start md:px-3">
          <Skeleton className="h-6 w-20" />
          <Skeleton className="h-9 w-24 rounded-md hidden md:block" />
        </div>
      </header>

      <main className="flex-grow container mx-auto p-2 md:p-3 md:pb-8">
        <Card className="mb-3 shadow-sm">
          <CardHeader className="p-3">
            <Skeleton className="h-5 w-1/3" />
          </CardHeader>
          <CardContent className="space-y-3 p-3 pt-0">
            {[...Array(3)].map((_, i) => (
               <div key={i} className="flex items-start gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-4 w-1/4" />
                  <Skeleton className="h-3 w-3/4" />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="p-3">
            <Skeleton className="h-5 w-1/4" />
          </CardHeader>
          <CardContent className="p-0 md:p-3 pt-0">
            {/* Skeleton for Table */}
            <div className="hidden md:block space-y-2">
                <div className="h-12 flex justify-between items-center p-4">
                    <Skeleton className="h-4 w-1/6" />
                    <Skeleton className="h-4 w-1/6" />
                    <Skeleton className="h-4 w-1/6" />
                    <Skeleton className="h-4 w-1/6" />
                    <Skeleton className="h-4 w-1/6" />
                    <Skeleton className="h-4 w-1/6" />
                </div>
                {[...Array(3)].map((_, i) => (
                     <div key={i} className="h-16 flex justify-between items-center p-4 border-t">
                        <Skeleton className="h-4 w-1/6" />
                        <Skeleton className="h-4 w-1/6" />
                        <Skeleton className="h-4 w-1/6" />
                        <Skeleton className="h-4 w-1/6" />
                        <Skeleton className="h-4 w-1/6" />
                        <Skeleton className="h-9 w-24 rounded-md" />
                    </div>
                ))}
            </div>
            {/* Skeleton for Mobile Cards */}
             <div className="md:hidden space-y-2 p-2">
                 {[...Array(3)].map((_, i) => (
                    <Card key={i}>
                        <CardContent className="p-3 space-y-2">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-3 w-24" />
                                </div>
                                <Skeleton className="h-6 w-20 rounded-full" />
                            </div>
                            <div className="flex justify-between items-baseline pt-1">
                                <Skeleton className="h-7 w-24" />
                                <Skeleton className="h-3 w-16" />
                            </div>
                        </CardContent>
                        <div className="p-2 border-t">
                             <Skeleton className="h-9 w-full rounded-md" />
                        </div>
                    </Card>
                ))}
             </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};


export default function Loading() {
  return (
    <AppShell header={<Header />} footer={<BottomNavBar />}>
      <main className="pb-8 md:pb-0">
        <ValesDashboardSkeleton />
      </main>
    </AppShell>
  );
}
