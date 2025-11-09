# collaborative-canvas
## Quick start


## 1. Install dependencies
npm install

## 2. Start server
npm start

## 3. Open two or more browsers to http:// 172.29.26.48:3000/client/index.html (or use two tabs)

## How to test with multiple users
Open multiple tabs or different browsers and join the same room (default room id shown in the UI). Each user gets a color and can draw simultaneously.
Cursor positions and strokes synchronize in realtime.
Use the Undo / Redo buttons to perform global undo/redo. (Operations are recorded server-side and broadcast.)

## Known limitations
Persistence: current implementation keeps state in-memory. A server restart wipes the canvas.
No authentication — users are assigned random nicknames.
When many thousands of operations accumulate performance may degrade; server-side pruning / snapshots recommended.

## Time spent
Approximately: 12-16 hours (design, implementation, testing, docs).
