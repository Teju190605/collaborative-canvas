const WebSocket = require('ws');

const ws = new WebSocket('ws://localhost:3000');

ws.on('open', () => {
  console.log('Client: connected to server');
});

ws.on('message', (msg) => {
  console.log('Client: received', msg.toString());
  // close after receiving initial message
  ws.close();
});

ws.on('close', () => console.log('Client: closed'));
ws.on('error', (err) => console.error('Client: error', err));
