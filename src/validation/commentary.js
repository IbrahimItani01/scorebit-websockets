import { z } from "zod";

// Query schema for listing commentaries
export const listCommentaryQuerySchema = z.object({
	limit: z.coerce.number().int().positive().max(100).optional(),
});

// Schema for creating a commentary
export const createCommentarySchema = z.object({
	minutes: z.coerce.number().int().nonnegative(),
	sequence: z.number().int().optional(),
	period: z.string().optional(),
	eventType: z.string().optional(),
	actor: z.string().optional(),
	team: z.string().optional(),
	message: z.string().min(1),
	metadata: z.record(z.string(), z.any()).optional(),
	tags: z.array(z.string()).optional(),
});
