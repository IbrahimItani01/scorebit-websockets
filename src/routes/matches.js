import { Router } from "express";
import { db } from "../db/db.js";
import { matches } from "../db/schema.js";
import { getMatchStatus } from "../utils/match-status.js";
import {
	createMatchSchema,
	listMatchesQuerySchema,
} from "../validation/matches.js";
import { MAX_MATCHES_LIMIT } from "../shared/constants.js";
import { desc } from "drizzle-orm";

export const matchesRouter = Router();

matchesRouter.get("/", async (req, res) => {
	const parsedMatches = listMatchesQuerySchema.safeParse(req.query);
	if (!parsedMatches.success) {
		return res.status(400).json({
			error: "Invalid Query Parameters",
			details: JSON.stringify(parsedMatches.error),
		});
	}
	const limit = Math.min(parsedMatches.data.limit ?? 50, MAX_MATCHES_LIMIT);
	try {
		const matchesData = await db
			.select()
			.from(matches)
			.orderBy(desc(matches.createdAt))
			.limit(limit);
		return res.json({ data: matchesData });
	} catch (error) {
		return res
			.status(500)
			.json({ error: "Internal Server Error", details: JSON.stringify(error.message) });
	}
});

matchesRouter.post("/", async (req, res) => {
	const parsedMatchData = createMatchSchema.safeParse(req.body);
	if (!parsedMatchData.success) {
		return res.status(400).json({
			error: "Invalid Payload",
			details: JSON.stringify(parsedMatchData.error),
		});
	}
	const {
		data: { startTime, endTime, homeScore, awayScore },
	} = parsedMatchData;
	try {
		const [event] = await db
			.insert(matches)
			.values({
				...parsedMatchData.data,
				startTime: new Date(startTime),
				endTime: new Date(endTime),
				homeScore: homeScore ?? 0,
				awayScore: awayScore ?? 0,
				status: getMatchStatus(startTime, endTime),
			})
			.returning();
		if(res.app.locals.broadcastMatchCreated) {
			res.app.locals.broadcastMatchCreated(event);
		}
		return res.status(201).json({ data: event });
	} catch (error) {
		return res
			.status(500)
			.json({ error: "Internal Server Error", details: JSON.stringify(error.message) });
	}
});
