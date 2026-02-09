import { WebSocket, WebSocketServer } from "ws";
import { wsArcjet } from "../arcjet.js";

const matchSubscribers = new Map();

const subscribe = (matchId, socket) => {
	if (!matchSubscribers.has(matchId)) {
		matchSubscribers.set(matchId, new Set());
	}
	matchSubscribers.get(matchId).add(socket);
};

const unsubscribe = (matchId, socket) => {
	const subscribers = matchSubscribers.get(matchId);
	if (!subscribers) return;
	subscribers.delete(socket);
	if (subscribers.size === 0) {
		matchSubscribers.delete(matchId);
	}
};

const cleanupSubscriptions = (socket) => {
	for (const matchId of socket.subscriptions) {
		unsubscribe(matchId, socket);
	}
};

const sendJSON = (socket, payload) => {
	if (socket.readyState !== WebSocket.OPEN) return;
	socket.send(JSON.stringify(payload));
};
const broadcastToAll = (wsServer, payload) => {
	for (const client of wsServer.clients) {
		if (client.readyState !== WebSocket.OPEN) continue;
		client.send(JSON.stringify(payload));
	}
};
const broadcastToMatch = (matchId, payload) => {
	const subscribers = matchSubscribers.get(matchId);
	if (!subscribers || subscribers.size === 0) return;
	const message = JSON.stringify(payload);
	for (const client of subscribers) {
		if (client.readyState === WebSocket.OPEN) {
			client.send(message);
		}
	}
};

const handleMessage = (socket, data) => {
	let message;
	try {
		message = JSON.parse(data.toString());
	} catch (error) {
		sendJSON(socket, { type: "error", message: "Invalid JSON" });
		return; // Added: should return after error
	}

	// Fixed: compare with string literals, not function references
	if (message?.type === "subscribe" && Number.isInteger(message.matchId)) {
		subscribe(message.matchId, socket);
		socket.subscriptions.add(message.matchId);
		sendJSON(socket, { type: "subscribed", matchId: message.matchId });
		return;
	}

	if (message?.type === "unsubscribe" && Number.isInteger(message.matchId)) {
		unsubscribe(message.matchId, socket);
		socket.subscriptions.delete(message.matchId);
		sendJSON(socket, { type: "unsubscribed", matchId: message.matchId });
		return;
	}
};
export const attachWebsocketServer = async (server) => {
	const wsServer = new WebSocketServer({
		noServer: true, // Changed: don't let ws handle upgrades automatically
		path: "/ws",
		maxPayload: 1024 * 1024,
	});

	// Validate upgrade requests before WebSocket handshake using Arcjet
	server.on("upgrade", async (req, socket, head) => {
		// Check if this upgrade request is for our WebSocket path
		const pathname = new URL(req.url, `http://${req.headers.host}`).pathname;
		if (pathname !== "/ws") {
			// Not our WebSocket path, ignore it
			return;
		}

		if (!wsArcjet) {
			wsServer.handleUpgrade(req, socket, head, (ws) =>
				wsServer.emit("connection", ws, req),
			);
			return;
		}

		try {
			const decision = await wsArcjet.protect(req);
			if (decision.isDenied()) {
				const isRate =
					decision.reason &&
					decision.reason.isRateLimit &&
					decision.reason.isRateLimit();
				const status = isRate ? 429 : 403;
				const statusText = isRate ? "Too Many Requests" : "Forbidden";
				const body = isRate ? "Rate limit exceeded" : "Access denied";
				const res = `HTTP/1.1 ${status} ${statusText}\r\nContent-Type: text/plain; charset=utf-8\r\nContent-Length: ${Buffer.byteLength(body)}\r\nConnection: close\r\n\r\n${body}`;
				socket.write(res);
				socket.destroy();
				return;
			}

			wsServer.handleUpgrade(req, socket, head, (ws) =>
				wsServer.emit("connection", ws, req),
			);
		} catch (error) {
			console.error("WebSocket security error:", error);
			try {
				const body = "Server Security error";
				const res = `HTTP/1.1 500 Internal Server Error\r\nContent-Type: text/plain; charset=utf-8\r\nContent-Length: ${Buffer.byteLength(body)}\r\nConnection: close\r\n\r\n${body}`;
				socket.write(res);
			} catch (e) {}
			socket.destroy();
		}
	});

	wsServer.on("connection", async (socket, req) => {
		socket.subscriptions = new Set();

		sendJSON(socket, { type: "welcome" });

		socket.on("message", (data) => {
			handleMessage(socket, data);
		});

		socket.on("error", (error) => {
			socket.terminate();
			console.error("WebSocket error:", error);
		});

		socket.on("close", () => {
			cleanupSubscriptions(socket);
		});
	});

	function broadcastMatchCreated(match) {
		broadcastToAll(wsServer, { type: "match_created", data: match });
	}

	function broadcastCommentary(matchId, comments) {
		broadcastToMatch(matchId, { type: "commentary", data: comments }); // Fixed: was "comment"
	}

	return { broadcastMatchCreated, broadcastCommentary };
};
