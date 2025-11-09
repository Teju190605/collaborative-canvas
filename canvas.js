// Drawing tools and Canvas state
const canvas = document.getElementById('drawing-canvas');
const ctx = canvas.getContext('2d');
let drawing = false;
let tool = 'brush';
let color = '#000000';
let strokeWidth = 2;
let points = [];
let erasing = false;

// Layered history for undo/redo
const operationHistory = [];
let historyPointer = -1;

// Used for real-time cursor indicators of other users
const otherUserCursors = {};

// Draw a stroke
function drawLine({points, color, strokeWidth, tool}) {
  ctx.save();
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.globalCompositeOperation = (tool === 'eraser') ? 'destination-out' : 'source-over';
  ctx.strokeStyle = color;
  ctx.lineWidth = strokeWidth;
  ctx.beginPath();
  for (let i = 0; i < points.length; i++) {
    if (i === 0) {
      ctx.moveTo(points[i][0], points[i][1]);
    } else {
      ctx.lineTo(points[i][0], points[i][1]);
    }
  }
  ctx.stroke();
  ctx.restore();
}

// Redraw complete canvas from history for undo/redo
function redrawCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let i = 0; i <= historyPointer; i++) {
    drawLine(operationHistory[i]);
  }
}

// Mouse/touch events
canvas.addEventListener('mousedown', startDraw);
canvas.addEventListener('mousemove', drawMove);
canvas.addEventListener('mouseup', endDraw);
canvas.addEventListener('mouseout', endDraw);

function startDraw(e) {
  drawing = true;
  points = [[e.offsetX, e.offsetY]];
}

function drawMove(e) {
  if (!drawing) return;
  points.push([e.offsetX, e.offsetY]);
  drawLine({points: points.slice(-2), color, strokeWidth, tool}); // Optimized for live preview
  emitDrawing(points[points.length-1]); // Send to peers
}

function endDraw(e) {
  if (!drawing) return;
  drawing = false;
  if (points.length > 1) {
    // Add operation to history stack
    const op = {points: [...points], color, strokeWidth, tool};
    historyPointer++;
    operationHistory.splice(historyPointer);
    operationHistory.push(op);

    emitStroke(op); // Broadcast complete stroke to peers
  }
  points = [];
}

// Toolbar listeners
document.getElementById('brush-btn').onclick = () => { tool = 'brush'; };
document.getElementById('eraser-btn').onclick = () => { tool = 'eraser'; };
document.getElementById('color-picker').oninput = (e) => { color = e.target.value; };
document.getElementById('stroke-width').oninput = (e) => { strokeWidth = parseInt(e.target.value); };

// Redraw when undo/redo
function canvasUndo() {
  if (historyPointer >= 0) {
    historyPointer--;
    redrawCanvas();
    emitUndoRedo('undo');
  }
}
function canvasRedo() {
  if (historyPointer < operationHistory.length - 1) {
    historyPointer++;
    redrawCanvas();
    emitUndoRedo('redo');
  }
}
document.getElementById('undo-btn').onclick = canvasUndo;
document.getElementById('redo-btn').onclick = canvasRedo;

// Draw cursors of other users
function renderOtherCursors() {
  Object.values(otherUserCursors).forEach(cur => {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cur.x, cur.y, 7, 0, 2 * Math.PI, false);
    ctx.fillStyle = cur.color || "#2ecc40";
    ctx.globalAlpha = 0.6;
    ctx.fill();
    ctx.restore();
  });
}

// Export functions for WebSocket integration
window.drawLine = drawLine;
window.redrawCanvas = redrawCanvas;
window.operationHistory = operationHistory;
window.historyPointer = historyPointer;
window.renderOtherCursors = renderOtherCursors;
window.otherUserCursors = otherUserCursors;
window.canvasUndo = canvasUndo;
window.canvasRedo = canvasRedo;
