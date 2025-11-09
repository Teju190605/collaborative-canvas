## Overview
This app implements an operation-based sync model: every drawing action becomes an immutable operation recorded on the server; clients replay the op stream to reach the same canvas state. Undo/redo are implemented as additional operations that reference previous operation IDs. This yields a consistent, auditable operation log that can be replayed by new clients.

## Data Flow Diagram
User --> Canvas (mouse/touch events) --> Client collects points and batches --> send stroke_chunk and stroke_end messages to server --> Server appends operation(s) to room op-log --> Server broadcasts operations to all clients --> Clients apply operations to local canvas in the order received.

## WebSocket Protocol (message types)
join_room { roomId }
init_state { ops: [] } (server -> client when joining)
cursor_move { userId, x, y, color }
stroke_chunk { tempStrokeId, points: [{x,y}], color, width, mode } // mode: draw|erase
stroke_end { op: { id, userId, type: 'stroke', path, color, width, timestamp } }
undo { userId, targetOpId }
redo { userId, targetOpId }
op { op } // server broadcasts any appended op (stroke, undo, redo)
presence { users: [...] }
Notes: clients send stroke_chunk frequently (batched) while drawing and send a stroke_end containing a finalized operation with a server-unique op id. Server assigns final op IDs or accepts client-provided UUIDs; this implementation uses client UUIDs and server assigns a monotonic sequence to order messages.

## Undo/Redo strategy
Operations are immutable. A stroke op is never removed. An undo op references a target op id.
Applying ops: When rendering, clients compute the effective visible set by replaying ops in chronological sequence. For each stroke op, visible unless there exists a later undo op that references it (and no later redo). redo is another op that restores visibility.
Global effect: Because undo is broadcast as an op, it affects the global canvas (all clients will hide that stroke).
User permissions / UX: In this submission, undo can reference any operation (global undo). For interview/dev conversations it's easy to change to "users can only undo their own ops" by disallowing undo target op ids not owned by the requester.

## Conflict resolution
Overlapping strokes: Last-writer-wins by op timestamp/sequence number. Strokes are composited in order of ops. This matches user expectations — later strokes visually appear on top.
Simultaneous undos: Undo/re-do are ops too; they are ordered by server sequence number. Deterministic rendering is achieved by total ordering on ops.

## Performance decisions
Batching: Points are buffered and sent in stroke_chunk messages every 40-80ms to avoid overwhelming the socket with many tiny messages.
Client-side prediction: When user draws locally we render immediately on the local canvas. Other clients see batched updates; small latency causes temporary differences but the op-based replay resolves ordering.
Path smoothing: Use quadratic Bézier smoothing (short poly -> smooth curve) instead of drawing raw segments for fewer points and better visuals.
Layering for undo/redo: Instead of full image snapshots we keep the operation log and re-render from ops when an undo/redo arrives. To avoid full redraw on each op, we maintain an offscreen compositing canvas and occasionally snapshot after N ops to accelerate replay.
