import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export type LoginInput = z.infer<typeof loginSchema>;

export const signupSchema = z
  .object({
    email: z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z
      .string()
      .min(6, "Password must be at least 6 characters"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type SignupInput = z.infer<typeof signupSchema>;

export const eventSchema = z.object({
  name: z.string().min(1, "Name is required"),
  sport_type: z.string().min(1, "Sport type is required"),
  date_time: z.string().min(1, "Date and time is required"),
  description: z.string().optional(),
  venues: z
    .array(
      z.object({
        name: z.string().min(1, "Venue name is required"),
        address: z.string().optional(),
      })
    )
    .min(1, "At least one venue is required"),
});

export type EventInput = z.infer<typeof eventSchema>;
