"use server";

import { createClient } from "@/lib/supabase/server";
import { safeAction, createSafeAction } from "@/lib/safe-action";
import { loginSchema, signupSchema } from "@/lib/schemas";

export const login = createSafeAction(loginSchema, async (data) => {
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: data.email,
    password: data.password,
  });
  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
});

export const signup = createSafeAction(signupSchema, async (data) => {
  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: data.email,
    password: data.password,
  });
  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
});

export async function logout() {
  return safeAction(async () => {
    const supabase = await createClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      return { success: false as const, error: error.message };
    }
    return { success: true as const };
  });
}

export async function loginWithGoogle() {
  return safeAction(async () => {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/callback`,
      },
    });
    if (error || !data.url) {
      return { success: false as const, error: error?.message ?? "Failed to initiate Google login" };
    }
    return { success: true as const, data: { url: data.url } };
  });
}
