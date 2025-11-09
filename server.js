// server/server.js
const express = require("express");
const http = require("http");
const { WebSocketServer } = require("ws");
const { v4: uuidv4 } = require("uuid");
const Rooms = require("./rooms");

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const PORT = process.env.PORT || 3000;

app.use(express.static("client"));

const rooms = new Rooms();

wss.on("connection", (ws, req) => {
  const userId = uuidv4();
  // for now we use a single default room; later you can parse from query string
  const roomName = "default";
  const room = rooms.getRoom(roomName);

  room.addClient(ws, userId);

  // initial message: include userId and roomName and current state
  const initMsg = {
    type: "init",
    userId,
    roomName: room.name,
    state: room.drawingState.getAllStrokes(),
    clientCount: room.getClientCount(),
  };

  ws.send(JSON.stringify(initMsg));

  console.log(
    `New connection: userId=${userId} room="${room.name}" clients=${room.getClientCount()}`
  );

  ws.on("message", (msg) => {
    try {
      const data = JSON.parse(msg);
      switch (data.type) {
        case "draw":
          // store and broadcast draw
          room.drawingState.addStroke(data.stroke);
          // attach sender id for debugging if not present
          room.broadcast(userId, { ...data, from: userId });
          break;

        case "clear":
          room.drawingState.clear();
          room.broadcast(userId, { type: "clear", from: userId });
          break;

        default:
          console.log(`Unknown message type from ${userId}:`, data.type);
      }
    } catch (err) {
      console.error("Error parsing message from client:", err);
    }
  });

  ws.on("close", () => {
    room.removeClient(userId);
    console.log(`Connection closed: userId=${userId} room="${room.name}" clients=${room.getClientCount()}`);
  });

  ws.on("error", (err) => {
    console.error(`WebSocket error (userId=${userId}):`, err);
  });
});

server.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
