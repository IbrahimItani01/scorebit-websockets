import express from "express";
import http from "http";
import { matchesRouter } from "./routes/matches.js";
import { attachWebsocketServer } from "./ws/server.js";
const PORT = process.env.PORT;
const HOST = process.env.HOST;

const app = express();
const server = http.createServer(app);
app.use(express.json());

app.get("/", (req, res) => {
	res.json({ status: "ok", message: "Hello from Express!" });
});
app.use("/matches", matchesRouter);

const { broadcastMatchCreated } = attachWebsocketServer(server);
app.locals.broadcastMatchCreated = broadcastMatchCreated;

server.listen(PORT, HOST, () => {
	const baseUrl =
		HOST === "0.0.0.0" ? `http://localhost:${PORT}` : `http://${HOST}:${PORT}`;
	console.log(`Server listening on ${baseUrl}`);
	console.log(`WebSocket server available at ws://${HOST}:${PORT}/ws`);
});
