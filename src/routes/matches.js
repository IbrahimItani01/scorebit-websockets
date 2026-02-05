import { Router } from "express";
import { db } from "../db/db.js";
import { matches } from "../db/schema.js";
import { getMatchStatus } from "../utils/match-status.js";
import { createMatchSchema } from "../validation/matches.js";

export const matchesRouter = Router();

matchesRouter.get("/", (req, res) => {
	res.status(200).json({ message: "Matches list!" });
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
		return res.status(201).json({ data: event });
	} catch (error) {
		return res
			.status(500)
			.json({ error: "Internal Server Error", details: JSON.stringify(error) });
	}
});
