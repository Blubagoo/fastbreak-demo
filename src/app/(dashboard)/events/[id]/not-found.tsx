import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function EventNotFound() {
  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed p-12 text-center">
        <h2 className="text-xl font-semibold">Event Not Found</h2>
        <p className="text-muted-foreground">
          The event you&apos;re looking for doesn&apos;t exist or has been deleted.
        </p>
        <Link href="/">
          <Button>Back to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
