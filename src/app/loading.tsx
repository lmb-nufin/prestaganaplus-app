const LoadingSpinner = () => {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background" role="status" aria-label="Cargando">
      <div className="h-10 w-10 animate-spin rounded-full border-2 border-muted border-t-primary" />
    </div>
  );
};

export default function Loading() {
  return <LoadingSpinner />;
}
