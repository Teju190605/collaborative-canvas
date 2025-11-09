// Socket.io setup and sync logic
const socket = io();

// Room and user state
let currentRoom = null;
let userName = null;

// Join room
document.getElementById('join-btn').onclick = () => {
  userName = document.getElementById('username').value || 'Guest_' + Math.floor(Math.random() * 9999);
  currentRoom = document.getElementById('roomid').value || 'default';
  socket.emit('joinRoom', {roomId: currentRoom, userName});
};

// Receive strokes from others
socket.on('drawing', (data) => {
  // Add to history and redraw if it's a new stroke
  window.operationHistory.push(data);
  window.historyPointer = window.operationHistory.length - 1;
  window.redrawCanvas();
});

// Receive other user cursors
socket.on('cursorMove', (info) => {
  window.otherUserCursors[info.userId] = {x: info.x, y: info.y, color: info.color};
  window.renderOtherCursors();
});

function emitDrawing(pos) {
  if (!currentRoom) return;
  socket.emit('cursorMove', {
    roomId: currentRoom,
    userId: socket.id,
    x: pos[0],
    y: pos[1],
    color
  });
}
// Emit finished stroke globally
function emitStroke(stroke) {
  if (!currentRoom) return;
  socket.emit('drawing', {...stroke, roomId: currentRoom, userId: socket.id});
}

// Sync online users
socket.on('userList', (users) => {
  const onlineDiv = document.getElementById('online-users');
  onlineDiv.innerHTML = 'Online: ' +
    users.map(u => `<span style="color:${userColor(u.socketId)}">${u.userName}</span>`).join(', ');
});

// Helper to assign colors to users by socketId
function userColor(socketId) {
  const hash = Array.from(socketId).reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const palette = ["#f44336","#e91e63","#2196f3","#009688","#4caf50","#795548","#607d8b"];
  return palette[hash % palette.length];
}

// Undo/Redo broadcast and global sync
function emitUndoRedo(action) {
  socket.emit('undoRedo', {roomId: currentRoom, action});
}
socket.on('undoRedo', ({action}) => {
  if (action === 'undo') window.canvasUndo();
  if (action === 'redo') window.canvasRedo();
});
