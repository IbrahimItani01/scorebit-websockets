import express from "express";
import { matchesRouter } from "./routes/matches.js";
const app = express();
app.use(express.json());
const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
	res.json({ status: "ok", message: "Hello from Express!" });
});
app.use("/matches", matchesRouter);
app.listen(PORT, () => {
	console.log(`Server listening on http://localhost:${PORT}`);
});
