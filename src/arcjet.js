import arcjet, {
	shield,
	detectBot,
	tokenBucket,
	slidingWindow,
} from "@arcjet/node";

const arcjetKey = process.env.ARCJET_KEY;
const mode = process.env.ARCJET_MODE === "DRY_RUN" ? "DRY_RUN" : "LIVE";

if (!arcjetKey)
	throw new Error("ARCJET_KEY is not defined in environment variables");

export const httpArcjet = arcjet
	? arcjet({
			key: arcjetKey,
			rules: [
				shield({ mode }),
				// Create a bot detection rule
				detectBot({
					mode,
					allow: ["CATEGORY:SEARCH_ENGINE", "CATEGORY:PREVIEW"],
				}),
				slidingWindow({
					mode,
					interval: "10s",
					max: 50,
				}),
			],
		})
	: null;

export const wsArcjet = arcjet
	? arcjet({
			key: arcjetKey,
			rules: [
				shield({ mode }),
				// Create a bot detection rule
				detectBot({
					mode,
					allow: ["CATEGORY:SEARCH_ENGINE", "CATEGORY:PREVIEW"],
				}),
				slidingWindow({
					mode,
					interval: "2s",
					max: 5,
				}),
			],
		})
	: null;

export const securityMiddleware = () => {
	return async function (req, res, next) {
		if (!httpArcjet) return next();
		try {
			const decision = await httpArcjet.protect(req);
			if (decision.isDenied()) {
				if (decision.reason.isRateLimit()) {
					return res.status(429).json({ error: "Too many requests" });
				}

				return res.status(403).json({ error: "Forbidden" });
			}
		} catch (error) {
			console.error("Error in Arcjet middleware:", error);
			return res.status(503).json({ error: "Service unavailable" });
		}
		next();
	};
};
