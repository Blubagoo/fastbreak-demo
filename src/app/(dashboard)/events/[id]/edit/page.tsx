import { getEventById } from "@/actions/events";
import { EventForm } from "@/components/events/event-form";

export default async function EditEventPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const result = await getEventById(id);

  if (!result.success || !result.data) {
    return (
      <div className="mx-auto max-w-2xl">
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed p-12 text-center">
          <h1 className="text-xl font-semibold">Event Not Found</h1>
          <p className="mt-2 text-muted-foreground">
            {result.error ?? "The event you are looking for does not exist."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">Edit Event</h1>
      <EventForm initialData={result.data} />
    </div>
  );
}
