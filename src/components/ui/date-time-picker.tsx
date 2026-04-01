"use client";

import * as React from "react";
import { format, parse } from "date-fns";
import { CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

/**
 * Converts a "YYYY-MM-DDTHH:mm" string (datetime-local format) to a Date, or
 * returns undefined if the string is empty/invalid.
 */
function parseDateTimeLocal(value: string): Date | undefined {
  if (!value) return undefined;
  const d = new Date(value);
  return isNaN(d.getTime()) ? undefined : d;
}

/**
 * Formats a Date back to the "YYYY-MM-DDTHH:mm" string that the form schema expects.
 */
function toDateTimeLocal(date: Date): string {
  const pad = (n: number) => n.toString().padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function DateTimePicker({
  value,
  onChange,
  id,
}: {
  value: string;
  onChange: (value: string) => void;
  id?: string;
}) {
  const date = parseDateTimeLocal(value);
  const timeValue = date ? format(date, "HH:mm") : "";

  function handleDateSelect(selected: Date | undefined) {
    if (!selected) return;

    // Preserve existing time, or default to 12:00
    const hours = date ? date.getHours() : 12;
    const minutes = date ? date.getMinutes() : 0;
    selected.setHours(hours, minutes, 0, 0);
    onChange(toDateTimeLocal(selected));
  }

  function handleTimeChange(e: React.ChangeEvent<HTMLInputElement>) {
    const time = e.target.value;
    if (!time) return;

    const base = date ?? new Date();
    const parsed = parse(time, "HH:mm", base);
    base.setHours(parsed.getHours(), parsed.getMinutes(), 0, 0);
    onChange(toDateTimeLocal(base));
  }

  return (
    <div className="flex gap-2">
      <Popover>
        <PopoverTrigger
          render={(props) => (
            <Button
              {...props}
              id={id}
              variant="outline"
              data-empty={!date}
              className="flex-1 justify-start text-left font-normal data-[empty=true]:text-muted-foreground"
            >
              <CalendarIcon className="size-4 shrink-0" />
              {date ? format(date, "MMM d, yyyy") : <span>Pick a date</span>}
            </Button>
          )}
        />
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar mode="single" selected={date} onSelect={handleDateSelect} />
        </PopoverContent>
      </Popover>
      <Input
        type="time"
        value={timeValue}
        onChange={handleTimeChange}
        className="w-[130px]"
        aria-label="Event time"
      />
    </div>
  );
}
