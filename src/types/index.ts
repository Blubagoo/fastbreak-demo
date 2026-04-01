// Event type matching Supabase events table
export type Event = {
  id: string;
  user_id: string;
  name: string;
  sport_type: string;
  date_time: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

// Venue type matching Supabase venues table
export type Venue = {
  id: string;
  event_id: string;
  name: string;
  address: string | null;
  created_at: string;
};

// Event with nested venues array (from join query)
export type EventWithVenues = Event & {
  venues: Venue[];
};

// Generic response envelope for server actions
export type ActionResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};
