import express from "express";
import { matchesRouter } from "./routes/matches.js";
import { attachWebsocketServer } from "./ws/server.js";
import { securityMiddleware } from "./arcjet.js";
const PORT = process.env.PORT;
const HOST = process.env.HOST;

const app = express();
app.use(express.json());


app.get("/", (req, res) => {
	res.json({ status: "ok", message: "Hello from Express!" });
});
app.use(securityMiddleware());

app.use("/matches", matchesRouter);
app.listen(PORT, () => {
	console.log(`Server listening on http://localhost:${PORT}`);
});
