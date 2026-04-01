import Link from "next/link";
import { EventWithVenues } from "@/types";
import { EventCard } from "@/components/events/event-card";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";

export function EventList({ events }: { events: EventWithVenues[] }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-end">
        <Button render={<Link href="/events/new" />}>
          <PlusIcon data-icon="inline-start" />
          New Event
        </Button>
      </div>

      {events.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center">
          <p className="text-muted-foreground">
            No events found. Create your first event!
          </p>
          <Button
            variant="outline"
            className="mt-4"
            render={<Link href="/events/new" />}
          >
            <PlusIcon data-icon="inline-start" />
            Create Event
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {events.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>
      )}
    </div>
  );
}
