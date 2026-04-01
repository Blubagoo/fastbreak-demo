"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { SPORT_OPTIONS } from "@/lib/constants";

const FILTER_OPTIONS = ["All", ...SPORT_OPTIONS] as const;

export function SportFilter() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSport = searchParams.get("sport") ?? "All";

  function handleChange(value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "All") {
      params.set("sport", value);
    } else {
      params.delete("sport");
    }
    router.push(`/?${params.toString()}`);
  }

  return (
    <Select value={currentSport} onValueChange={handleChange}>
      <SelectTrigger className="w-[160px]">
        <SelectValue placeholder="Filter by sport" />
      </SelectTrigger>
      <SelectContent>
        {FILTER_OPTIONS.map((sport) => (
          <SelectItem key={sport} value={sport}>
            {sport}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
