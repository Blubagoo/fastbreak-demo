import Link from "next/link";
import { EventWithVenues } from "@/types";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { PencilIcon, MapPinIcon, CalendarIcon } from "lucide-react";
import { DeleteEventButton } from "@/components/events/delete-event-button";

function formatDateTime(dateTime: string): string {
  try {
    return new Date(dateTime).toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  } catch {
    return dateTime;
  }
}

export function EventCard({ event }: { event: EventWithVenues }) {
  return (
    <Card className="flex flex-col bg-white text-cool-black ring-light-moondust/40">
      <CardHeader>
        <CardTitle className="text-cool-black font-semibold text-sm font-sans">{event.name}</CardTitle>
        <span className="mt-1 inline-flex w-fit items-center rounded-md bg-deep-ocean/10 px-2 py-0.5 text-xs font-medium text-deep-ocean">
          {event.sport_type}
        </span>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-2 text-sm text-crater-gray">
        <div className="flex items-center gap-1.5">
          <CalendarIcon className="size-3.5 shrink-0" />
          <span>{formatDateTime(event.date_time)}</span>
        </div>
        {event.description && (
          <p className="line-clamp-2">{event.description}</p>
        )}
        <div className="flex items-center gap-1.5">
          <MapPinIcon className="size-3.5 shrink-0" />
          <span>
            {event.venues.length} venue{event.venues.length !== 1 ? "s" : ""}
          </span>
        </div>
      </CardContent>
      <CardFooter className="gap-2 border-light-moondust/40 bg-light-gray/30">
        <Button aria-label={`Edit event: ${event.name}`} variant="outline" size="sm" className="border-light-moondust bg-white text-cool-black hover:bg-light-gray/50" render={<Link href={`/events/${event.id}/edit`} />}>
          <PencilIcon data-icon="inline-start" />
          Edit
        </Button>
        <DeleteEventButton eventId={event.id} eventName={event.name} />
      </CardFooter>
    </Card>
  );
}
