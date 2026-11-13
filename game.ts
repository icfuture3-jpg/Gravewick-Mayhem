import { z } from "zod";

export const modeSchema = z.enum(["story", "endless"]);

export const runSchema = z.object({
  score: z.number().int().min(0).max(10_000_000),
  kills: z.number().int().min(0).max(100_000),
  wave: z.number().int().min(0).max(10_000),
});
export type Run = z.infer<typeof runSchema>;

export const rowSchema = z.object({
  name: z.string(),
  score: z.number(),
  kills: z.number(),
  wave: z.number(),
  you: z.boolean(),
});
export type Row = z.infer<typeof rowSchema>;

export type Mode = z.infer<typeof modeSchema>;
