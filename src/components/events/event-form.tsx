"use client";

import { useRouter } from "next/navigation";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { eventSchema, EventInput } from "@/lib/schemas";
import { createEvent, updateEvent } from "@/actions/events";
import { EventWithVenues } from "@/types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { DateTimePicker } from "@/components/ui/date-time-picker";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Field,
  FieldLabel,
  FieldError,
} from "@/components/ui/field";
import { Separator } from "@/components/ui/separator";
import { PlusIcon, Trash2Icon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { SPORT_OPTIONS } from "@/lib/constants";

export function EventForm({
  initialData,
}: {
  initialData?: EventWithVenues;
}) {
  const router = useRouter();
  const isEdit = !!initialData;

  const {
    control,
    handleSubmit,
    register,
    formState: { errors, isSubmitting },
  } = useForm<EventInput>({
    resolver: zodResolver(eventSchema),
    defaultValues: initialData
      ? {
          name: initialData.name,
          sport_type: initialData.sport_type,
          date_time: initialData.date_time.slice(0, 16),
          description: initialData.description ?? "",
          venues: initialData.venues.map((v) => ({
            name: v.name,
            address: v.address ?? "",
          })),
        }
      : {
          name: "",
          sport_type: "",
          date_time: "",
          description: "",
          venues: [{ name: "", address: "" }],
        },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "venues",
  });

  async function onSubmit(data: EventInput) {
    try {
      const result = isEdit
        ? await updateEvent(initialData!.id, data)
        : await createEvent(data);

      if (result.success) {
        toast.success(isEdit ? "Event updated successfully" : "Event created successfully");
        router.push("/");
        router.refresh();
      } else {
        toast.error(result.error ?? "Something went wrong");
      }
    } catch {
      toast.error("Something went wrong");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Name */}
      <Controller
        control={control}
        name="name"
        render={({ field }) => (
          <Field data-invalid={!!errors.name || undefined}>
            <FieldLabel htmlFor="name">Event Name</FieldLabel>
            <Input
              id="name"
              placeholder="e.g. Summer Basketball League"
              {...field}
            />
            <FieldError>{errors.name?.message}</FieldError>
          </Field>
        )}
      />

      {/* Sport Type */}
      <Controller
        control={control}
        name="sport_type"
        render={({ field }) => (
          <Field data-invalid={!!errors.sport_type || undefined}>
            <FieldLabel>Sport Type</FieldLabel>
            <Select value={field.value} onValueChange={field.onChange}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a sport" />
              </SelectTrigger>
              <SelectContent>
                {SPORT_OPTIONS.map((sport) => (
                  <SelectItem key={sport} value={sport}>
                    {sport}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldError>{errors.sport_type?.message}</FieldError>
          </Field>
        )}
      />

      {/* Date & Time */}
      <Controller
        control={control}
        name="date_time"
        render={({ field }) => (
          <Field data-invalid={!!errors.date_time || undefined}>
            <FieldLabel htmlFor="date_time">Date &amp; Time</FieldLabel>
            <DateTimePicker
              id="date_time"
              value={field.value}
              onChange={field.onChange}
            />
            <FieldError>{errors.date_time?.message}</FieldError>
          </Field>
        )}
      />

      {/* Description */}
      <Controller
        control={control}
        name="description"
        render={({ field }) => (
          <Field>
            <FieldLabel htmlFor="description">Description</FieldLabel>
            <Textarea
              id="description"
              placeholder="Describe the event..."
              rows={3}
              {...field}
            />
          </Field>
        )}
      />

      <Separator />

      {/* Venues */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Venues</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ name: "", address: "" })}
          >
            <PlusIcon data-icon="inline-start" />
            Add Venue
          </Button>
        </div>

        {errors.venues?.root && (
          <FieldError>{errors.venues.root.message}</FieldError>
        )}

        {fields.map((field, index) => (
          <div
            key={field.id}
            className="space-y-3 rounded-lg border p-4"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-muted-foreground">
                Venue {index + 1}
              </span>
              {fields.length > 1 && (
                <Button
                  type="button"
                  variant="destructive"
                  size="icon-xs"
                  onClick={() => remove(index)}
                >
                  <Trash2Icon />
                </Button>
              )}
            </div>

            <Field data-invalid={!!errors.venues?.[index]?.name || undefined}>
              <FieldLabel htmlFor={`venues.${index}.name`}>
                Venue Name
              </FieldLabel>
              <Input
                id={`venues.${index}.name`}
                placeholder="e.g. Main Arena"
                {...register(`venues.${index}.name`)}
              />
              <FieldError>
                {errors.venues?.[index]?.name?.message}
              </FieldError>
            </Field>

            <Field>
              <FieldLabel htmlFor={`venues.${index}.address`}>
                Address
              </FieldLabel>
              <Input
                id={`venues.${index}.address`}
                placeholder="e.g. 123 Main St"
                {...register(`venues.${index}.address`)}
              />
            </Field>
          </div>
        ))}
      </div>

      <div className="flex justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2Icon className="animate-spin" data-icon="inline-start" />}
          {isEdit ? "Update Event" : "Create Event"}
        </Button>
      </div>
    </form>
  );
}
