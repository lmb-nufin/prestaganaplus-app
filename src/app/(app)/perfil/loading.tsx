
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="p-4 md:p-6 lg:p-8">
      <Card className="max-w-md mx-auto shadow-sm">
        <CardHeader className="items-center text-center p-4">
          <Skeleton className="h-20 w-20 rounded-full mb-2" />
          <Skeleton className="h-7 w-48 mt-2" />
          <Skeleton className="h-4 w-32 mt-1" />
        </CardHeader>
        <CardContent className="p-4 pt-0 space-y-4">
          <div className="flex items-center gap-4 py-2 border-b border-dashed">
            <Skeleton className="h-5 w-5" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-4 w-32" />
            </div>
          </div>
          <div className="flex items-center gap-4 py-2 border-b border-dashed">
            <Skeleton className="h-5 w-5" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-48" />
            </div>
          </div>
          <div className="flex items-center gap-4 py-2 border-b border-dashed">
            <Skeleton className="h-5 w-5" />
            <div className="flex-1 space-y-1.5">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-28" />
            </div>
          </div>
          <div className="mt-6 pt-2">
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
