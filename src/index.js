import AgentAPI from "apminsight";
AgentAPI.config();
import express from "express";
import http from "http";
import { matchesRouter } from "./routes/matches.js";
import { attachWebsocketServer } from "./ws/server.js";
import { securityMiddleware } from "./arcjet.js";
import { commentaryRouter } from "./routes/commentary.js";
const PORT = process.env.PORT;
const HOST = process.env.HOST;

const app = express();
const server = http.createServer(app);
app.use(express.json());

app.get("/", (req, res) => {
	res.json({ status: "ok", message: "Hello from Express!" });
});
app.use(securityMiddleware());

app.use("/matches", matchesRouter);
app.use("/matches/:id/commentary", commentaryRouter);
const { broadcastMatchCreated, broadcastCommentary } =
	await attachWebsocketServer(server);
app.locals.broadcastMatchCreated = broadcastMatchCreated;
app.locals.broadcastCommentary = broadcastCommentary;

server.listen(PORT, HOST, () => {
	const baseUrl =
		HOST === "0.0.0.0" ? `http://localhost:${PORT}` : `http://${HOST}:${PORT}`;
	console.log(`Server listening on ${baseUrl}`);
	console.log(`WebSocket server available at ws://${HOST}:${PORT}/ws`);
});
