import { WebSocket, WebSocketServer } from "ws";
import { wsArcjet } from "../arcjet.js";
const sendJSON = (socket, payload) => {
	if (socket.readyState !== WebSocket.OPEN) return;
	socket.send(JSON.stringify(payload));
};
const broadcast = (wsServer, payload) => {
	for (const client of wsServer.clients) {
		if (client.readyState !== WebSocket.OPEN) return;
		client.send(JSON.stringify(payload));
	}
};

export const attachWebsocketServer = async (server) => {
	const wsServer = new WebSocketServer({
		server,
		path: "/ws",
		maxPayload: 1024 * 1024,
	});
	wsServer.on("connection", async (socket, req) => {
		if (wsArcjet) {
			try {
				const decision = await wsArcjet.protect(req);
				if (decision.isDenied()) {
					const code = decision.reason.isRateLimit() ? 1013 : 1008;
					const reason = decision.reason.isRateLimit()
						? "Rate limit exceeded"
						: "Connection denied";
					socket.close(code, reason);
					return;
				}
			} catch (error) {
				console.error("WebSocket security error:", error);
				socket.close(1011, "Server Security error");
				return;
			}
		}
		sendJSON(socket, { type: "welcome" });

		socket.on("error", (error) => {
			console.error("WebSocket error:", error);
		});
	});
	function broadcastMatchCreated(match) {
		broadcast(wsServer, { type: "match_created", data: match });
	}
	return { broadcastMatchCreated };
};
