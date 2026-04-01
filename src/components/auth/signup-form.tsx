"use client";

import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { signupSchema, type SignupInput } from "@/lib/schemas";
import { signup } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Field, FieldLabel, FieldError } from "@/components/ui/field";

export function SignupForm() {
  const form = useForm<SignupInput>({
    resolver: zodResolver(signupSchema),
    defaultValues: { email: "", password: "", confirmPassword: "" },
  });

  const { isSubmitting } = form.formState;

  async function onSubmit(data: SignupInput) {
    const result = await signup(data);
    if (result.success) {
      toast.success("Account created successfully");
    } else {
      toast.error(result.error ?? "Signup failed");
    }
  }

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="text-center text-xl">Create an account</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-6">
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <Field data-invalid={!!form.formState.errors.email}>
            <FieldLabel htmlFor="signup-email">Email</FieldLabel>
            <Controller
              control={form.control}
              name="email"
              render={({ field }) => (
                <Input
                  id="signup-email"
                  type="email"
                  placeholder="you@example.com"
                  {...field}
                />
              )}
            />
            <FieldError>{form.formState.errors.email?.message}</FieldError>
          </Field>

          <Field data-invalid={!!form.formState.errors.password}>
            <FieldLabel htmlFor="signup-password">Password</FieldLabel>
            <Controller
              control={form.control}
              name="password"
              render={({ field }) => (
                <Input
                  id="signup-password"
                  type="password"
                  placeholder="At least 6 characters"
                  {...field}
                />
              )}
            />
            <FieldError>{form.formState.errors.password?.message}</FieldError>
          </Field>

          <Field data-invalid={!!form.formState.errors.confirmPassword}>
            <FieldLabel htmlFor="signup-confirm-password">Confirm Password</FieldLabel>
            <Controller
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <Input
                  id="signup-confirm-password"
                  type="password"
                  placeholder="Repeat your password"
                  {...field}
                />
              )}
            />
            <FieldError>{form.formState.errors.confirmPassword?.message}</FieldError>
          </Field>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? "Creating account..." : "Sign up"}
          </Button>
        </form>

        <p className="text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="text-primary underline underline-offset-4 hover:text-primary/80">
            Log in
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
