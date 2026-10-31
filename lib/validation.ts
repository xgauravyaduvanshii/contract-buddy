import { z } from "zod";

export const emailSchema = z.string().email("Enter a valid email");

export const signupSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  email: emailSchema,
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
  company: z.string().max(160).optional(),
});

export const signinSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required"),
});

export const forgotSchema = z.object({
  email: emailSchema,
});

export const verifyOtpSchema = z.object({
  email: emailSchema,
  code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code"),
});

export const resetSchema = z.object({
  email: emailSchema,
  code: z.string().regex(/^\d{6}$/, "Enter the 6-digit code"),
  password: z.string().min(8, "Password must be at least 8 characters").max(200),
});

export function firstZodError(err: z.ZodError): string {
  const issue = err.issues?.[0];
  return issue ? issue.message : "Invalid input";
}
