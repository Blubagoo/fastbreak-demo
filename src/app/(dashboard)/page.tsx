import Link from "next/link";
import { getEvents } from "@/actions/events";
import { SearchBar } from "@/components/events/search-bar";
import { SportFilter } from "@/components/events/sport-filter";
import { EventList } from "@/components/events/event-list";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string; sport?: string }>;
}) {
  const { search, sport } = await searchParams;
  const result = await getEvents(search, sport);
  const events = result.success && result.data ? result.data : [];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Events</h1>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchBar />
        <SportFilter />
        <div className="sm:ml-auto">
          <Button render={<Link href="/events/new" />}>
            <PlusIcon data-icon="inline-start" />
            New Event
          </Button>
        </div>
      </div>
      <EventList events={events} />
    </div>
  );
}
