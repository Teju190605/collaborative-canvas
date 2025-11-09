// server/rooms.js
const DrawingState = require("./drawing-state");

class Room {
  constructor(name) {
    this.name = name; // this is the room id/name
    this.clients = new Map(); // clientId -> ws
    this.drawingState = new DrawingState();
    console.log(`Room created: "${this.name}"`);
  }

  addClient(ws, id) {
    this.clients.set(id, ws);
    console.log(`Client ${id} joined room "${this.name}" (clients=${this.clients.size})`);
  }

  removeClient(id) {
    const existed = this.clients.delete(id);
    console.log(
      `Client ${id} left room "${this.name}" (existed=${existed}, clients=${this.clients.size})`
    );
  }

  broadcast(senderId, data) {
    for (const [id, ws] of this.clients.entries()) {
      if (id === senderId) continue;
      // ws.OPEN is not available on the instance in this environment;
      // use the numeric readyState value for OPEN (1) instead.
      if (ws && ws.readyState === 1) {
        ws.send(JSON.stringify(data));
      }
    }
  }

  getClientCount() {
    return this.clients.size;
  }
}

class Rooms {
  constructor() {
    this.rooms = new Map();
  }

  getRoom(name) {
    if (!this.rooms.has(name)) {
      const room = new Room(name);
      this.rooms.set(name, room);
    }
    return this.rooms.get(name);
  }

  listRooms() {
    // useful for debugging
    const out = [];
    for (const [name, room] of this.rooms.entries()) {
      out.push({ name, clients: room.getClientCount() });
    }
    return out;
  }
}

module.exports = Rooms;
