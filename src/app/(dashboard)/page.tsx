import { getEvents } from "@/actions/events";
import { SearchBar } from "@/components/events/search-bar";
import { SportFilter } from "@/components/events/sport-filter";
import { EventList } from "@/components/events/event-list";

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
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Events</h1>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchBar />
        <SportFilter />
      </div>
      <EventList events={events} />
    </div>
  );
}
