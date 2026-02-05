import { z } from "zod";

// Query schema for listing matches
export const listMatchesQuerySchema = z.object({
	limit: z.coerce.number().int().positive().max(100).optional(),
});

// Match status constants (values in lowercase)
export const MATCH_STATUS = {
	SCHEDULED: "scheduled",
	LIVE: "live",
	FINISHED: "finished",
};

// Params schema for match id
export const matchIdParamSchema = z.object({
	id: z.coerce.number().int().positive(),
});

// ISO 8601 regex (allows Z or timezone offsets)
const isoDateRegex =
	/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/;

// Create match schema
export const createMatchSchema = z
	.object({
		sport: z.string().min(1).trim(),
		homeTeam: z.string().min(1).trim(),
		awayTeam: z.string().min(1).trim(),
		startTime: z.string().refine((v) => isoDateRegex.test(v), {
			message: "startTime must be a valid ISO date string",
		}),
		endTime: z.string().refine((v) => isoDateRegex.test(v), {
			message: "endTime must be a valid ISO date string",
		}),
		homeScore: z.coerce.number().int().nonnegative().optional(),
		awayScore: z.coerce.number().int().nonnegative().optional(),
	})
	.superRefine((data, ctx) => {
		const start = new Date(data.startTime);
		const end = new Date(data.endTime);
		if (isNaN(start.getTime())) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["startTime"],
				message: "startTime must be a valid ISO date",
			});
			return;
		}
		if (isNaN(end.getTime())) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["endTime"],
				message: "endTime must be a valid ISO date",
			});
			return;
		}
		if (end.getTime() <= start.getTime()) {
			ctx.addIssue({
				code: z.ZodIssueCode.custom,
				path: ["endTime"],
				message: "endTime must be after startTime",
			});
		}
	});

// Update score schema
export const updateScoreSchema = z.object({
	homeScore: z.coerce.number().int().nonnegative(),
	awayScore: z.coerce.number().int().nonnegative(),
});

export default {
	listMatchesQuerySchema,
	MATCH_STATUS,
	matchIdParamSchema,
	createMatchSchema,
	updateScoreSchema,
};
