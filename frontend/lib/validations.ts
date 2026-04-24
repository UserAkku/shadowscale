import { z } from "zod";

export const urlSchema = z.object({
  url: z.string().url("Please enter a valid URL starting with http:// or https://")
});

export const authSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(6, "Password must be at least 6 characters")
});
