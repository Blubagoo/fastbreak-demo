import { z } from "zod";
import { ActionResponse } from "@/types";

/**
 * Wraps any async operation in a try/catch that returns a consistent ActionResponse.
 * Use this for every server action so error shape is uniform across the app.
 */
export async function safeAction<T>(
  fn: () => Promise<ActionResponse<T>>
): Promise<ActionResponse<T>> {
  try {
    return await fn();
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Something went wrong",
    };
  }
}

/**
 * Wraps a Zod-validated action: validates input first, then runs the handler
 * inside safeAction. Use for form submissions.
 */
export function createSafeAction<TInput, TOutput>(
  schema: z.Schema<TInput>,
  handler: (validatedData: TInput) => Promise<ActionResponse<TOutput>>
) {
  return async (data: TInput): Promise<ActionResponse<TOutput>> => {
    const validation = schema.safeParse(data);
    if (!validation.success) {
      return {
        success: false,
        error: "Validation failed",
        fieldErrors: validation.error.flatten().fieldErrors as Record<
          string,
          string[]
        >,
      };
    }
    return safeAction(() => handler(validation.data));
  };
}
