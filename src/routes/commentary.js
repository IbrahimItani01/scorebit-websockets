import { Router } from "express";
import { db } from "../db/db.js";
import { commentary } from "../db/schema.js";
import { matchIdParamSchema } from "../validation/matches.js";
import { createCommentarySchema } from "../validation/commentary.js";

export const commentaryRouter = Router({ mergeParams: true });

commentaryRouter.get("/", (req, res) => {
	res.status(200).json({ message: "Commentary list" });
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
