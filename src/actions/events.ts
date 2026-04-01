"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { safeAction, createSafeAction } from "@/lib/safe-action";
import { eventSchema, EventInput } from "@/lib/schemas";
import { EventWithVenues } from "@/types";

export async function getEvents(search?: string, sport?: string) {
  return safeAction(async () => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false as const, error: "Not authenticated" };
    }

    let query = supabase
      .from("events")
      .select("*, venues(*)")
      .eq("user_id", user.id)
      .order("date_time", { ascending: true });

    if (search && search.trim().length > 0) {
      const sanitized = search.trim().substring(0, 100);
      query = query.ilike("name", `%${sanitized}%`);
    }
    if (sport && sport.trim().length > 0) {
      query = query.eq("sport_type", sport.trim());
    }

    const { data, error } = await query;
    if (error) {
      return { success: false as const, error: error.message };
    }
    return { success: true as const, data: data as EventWithVenues[] };
  });
}

export async function getEventById(id: string) {
  return safeAction(async () => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false as const, error: "Not authenticated" };
    }

    const { data, error } = await supabase
      .from("events")
      .select("*, venues(*)")
      .eq("id", id)
      .eq("user_id", user.id)
      .single();

    if (error) {
      return { success: false as const, error: error.message };
    }
    return { success: true as const, data: data as EventWithVenues };
  });
}

export const createEvent = createSafeAction(eventSchema, async (data) => {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  const { data: event, error: eventError } = await supabase
    .from("events")
    .insert({
      user_id: user.id,
      name: data.name,
      sport_type: data.sport_type,
      date_time: data.date_time,
      description: data.description || null,
    })
    .select()
    .single();

  if (eventError || !event) {
    return {
      success: false,
      error: eventError?.message ?? "Failed to create event",
    };
  }

  const venues = data.venues.map((v) => ({
    event_id: event.id,
    name: v.name,
    address: v.address || null,
  }));

  const { error: venueError } = await supabase.from("venues").insert(venues);
  if (venueError) {
    return { success: false, error: venueError.message };
  }

  revalidatePath("/");
  return getEventById(event.id);
});

export async function updateEvent(id: string, data: EventInput) {
  return safeAction(async () => {
    const parsed = eventSchema.safeParse(data);
    if (!parsed.success) {
      return {
        success: false as const,
        error: "Validation failed",
        fieldErrors: parsed.error.flatten().fieldErrors as Record<string, string[]>,
      };
    }

    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false as const, error: "Not authenticated" };
    }

    const input = parsed.data;

    const { error: eventError } = await supabase
      .from("events")
      .update({
        name: input.name,
        sport_type: input.sport_type,
        date_time: input.date_time,
        description: input.description || null,
      })
      .eq("id", id)
      .eq("user_id", user.id);

    if (eventError) {
      return { success: false as const, error: eventError.message };
    }

    const { error: deleteError } = await supabase
      .from("venues")
      .delete()
      .eq("event_id", id);

    if (deleteError) {
      return { success: false as const, error: deleteError.message };
    }

    const venues = input.venues.map((v) => ({
      event_id: id,
      name: v.name,
      address: v.address || null,
    }));

    const { error: venueError } = await supabase
      .from("venues")
      .insert(venues);

    if (venueError) {
      return { success: false as const, error: venueError.message };
    }

    revalidatePath("/");
    return getEventById(id);
  });
}

export async function deleteEvent(id: string) {
  return safeAction(async () => {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return { success: false as const, error: "Not authenticated" };
    }

    const { error } = await supabase
      .from("events")
      .delete()
      .eq("id", id)
      .eq("user_id", user.id);

    if (error) {
      return { success: false as const, error: error.message };
    }

    revalidatePath("/");
    return { success: true as const };
  });
}
