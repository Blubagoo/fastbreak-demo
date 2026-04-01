"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function EditEventError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    if (process.env.NODE_ENV === "development") {
      console.error(error);
    }
  }, [error]);

  return (
    <div className="mx-auto max-w-2xl">
      <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed p-12 text-center">
        <h2 className="text-xl font-semibold">Failed to load event</h2>
        <p className="text-muted-foreground">
          {error.message || "An unexpected error occurred."}
        </p>
        <div className="flex gap-3">
          <Link href="/">
            <Button variant="outline">Back to Dashboard</Button>
          </Link>
          <Button onClick={reset}>Try again</Button>
        </div>
      </div>
    </div>
  );
}
