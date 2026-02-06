import { WebSocket, WebSocketServer } from "ws";
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

export const attachWebsocketServer = (server) => {
	const wsServer = new WebSocketServer({
		server,
		path: "/ws",
		maxPayload: 1024 * 1024,
	});
	wsServer.on("connection", (socket) => {
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
