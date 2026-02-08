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
	// Validate upgrade requests before WebSocket handshake using Arcjet
	server.on("upgrade", async (req, socket, head) => {
		if (!wsArcjet) {
			wsServer.handleUpgrade(req, socket, head, (ws) =>
				wsServer.emit("connection", ws, req)
			);
			return;
		}
		try {
			const decision = await wsArcjet.protect(req);
			if (decision.isDenied()) {
				const isRate = decision.reason && decision.reason.isRateLimit && decision.reason.isRateLimit();
				const status = isRate ? 429 : 403;
				const statusText = isRate ? "Too Many Requests" : "Forbidden";
				const body = isRate ? "Rate limit exceeded" : "Access denied";
				const res = `HTTP/1.1 ${status} ${statusText}\r\nContent-Type: text/plain; charset=utf-8\r\nContent-Length: ${Buffer.byteLength(body)}\r\nConnection: close\r\n\r\n${body}`;
				socket.write(res);
				socket.destroy();
				return;
			}
			wsServer.handleUpgrade(req, socket, head, (ws) =>
				wsServer.emit("connection", ws, req)
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
		// Arcjet protection moved to the HTTP `upgrade` event to validate
		// requests before the WebSocket handshake.
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
