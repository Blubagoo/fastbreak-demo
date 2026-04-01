export default function NewEventLoading() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="h-8 w-40 animate-pulse rounded bg-muted" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <div className="h-4 w-24 animate-pulse rounded bg-muted" />
          <div className="h-10 w-full animate-pulse rounded bg-muted" />
        </div>
      ))}
      <div className="h-px w-full bg-muted" />
      <div className="space-y-3">
        <div className="h-5 w-20 animate-pulse rounded bg-muted" />
        <div className="rounded-lg border p-4 space-y-3">
          <div className="h-4 w-16 animate-pulse rounded bg-muted" />
          <div className="h-10 w-full animate-pulse rounded bg-muted" />
          <div className="h-10 w-full animate-pulse rounded bg-muted" />
        </div>
      </div>
      <div className="flex justify-end gap-3 pt-4">
        <div className="h-10 w-20 animate-pulse rounded bg-muted" />
        <div className="h-10 w-28 animate-pulse rounded bg-muted" />
      </div>
    </div>
  );
}
