import { Router } from "express";
import { db } from "../db/db.js";
import { commentary } from "../db/schema.js";
import { matchIdParamSchema } from "../validation/matches.js";
import {
	createCommentarySchema,
	listCommentaryQuerySchema,
} from "../validation/commentary.js";
import { eq, desc } from "drizzle-orm";
import { MAX_COMMENTARY_LIMIT } from "../shared/constants.js";

export const commentaryRouter = Router({ mergeParams: true });

commentaryRouter.get("/", async (req, res) => {
	// Validate params
	const paramsResult = matchIdParamSchema.safeParse(req.params);
	if (!paramsResult.success) {
		return res.status(400).json({
			error: "Invalid match ID",
			details: paramsResult.error.issues,
		});
	}

	// Validate query
	const queryResult = listCommentaryQuerySchema.safeParse(req.query);
	if (!queryResult.success) {
		return res.status(400).json({
			error: "Invalid query parameters",
			details: queryResult.error.issues,
		});
	}

	const limit = queryResult.data?.limit ?? MAX_COMMENTARY_LIMIT;
	const cappedLimit = Math.min(limit, MAX_COMMENTARY_LIMIT);

	try {
		const result = await db
			.select()
			.from(commentary)
			.where(eq(commentary.matchId, paramsResult.data.id))
			.orderBy(desc(commentary.createdAt))
			.limit(cappedLimit);

		res.status(200).json({ data: result });
	} catch (error) {
		console.error("Failed to fetch commentary", error);
		return res.status(500).json({
			error: "Failed to fetch commentary",
		});
	}
});

commentaryRouter.post("/", async (req, res) => {
	// Validate params
	const paramsResult = matchIdParamSchema.safeParse(req.params);
	if (!paramsResult.success) {
		return res.status(400).json({
			error: "Invalid match ID",
			details: paramsResult.error.issues,
		});
	}
	// Validate body
	const body = createCommentarySchema.safeParse(req.body);
	if (!body.success) {
		return res.status(400).json({
			error: "Invalid commentary payload",
			details: body.error.issues,
		});
	}
	try {
		const { minutes, ...rest } = body.data;

		// Insert into database
		const result = await db
			.insert(commentary)
			.values({
				matchId: paramsResult.data.id,
				minutes,
				...rest,
			})
			.returning();

		res.status(201).json({
			data: result,
		});
	} catch (error) {
		console.error("Failed to create commentary", error);
		return res.status(500).json({
			error: "Failed to create commentary",
		});
	}
});
