// You may supplement this with more advanced logic for persistence/history (optional for bonus)
const roomHistories = {};

function addStroke(roomId, stroke) {
  if (!roomHistories[roomId]) roomHistories[roomId] = [];
  roomHistories[roomId].push(stroke);
}

function getHistory(roomId) {
  return roomHistories[roomId] || [];
}

module.exports = { addStroke, getHistory };
