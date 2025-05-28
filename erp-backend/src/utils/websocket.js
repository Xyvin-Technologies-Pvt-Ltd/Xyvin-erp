const WebSocket = require('ws');
const jwt = require('jsonwebtoken');

let wss = null;

const websocketService = {
  init: (server) => {
    if (wss) return wss;

    wss = new WebSocket.Server({ 
      server,
      path: '/websocket'
    });

    wss.on('connection', async (ws, req) => {
      try {
        const token = new URLSearchParams(req.url.split('?')[1]).get('token');

        if (!token) {
          ws.close(1008, 'Authentication required');
          return;
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        ws.userId = decoded.id;

        // Heartbeat to keep connection alive
        ws.isAlive = true;
        ws.on('pong', () => {
          ws.isAlive = true;
        });

        ws.on('error', (error) => {
          console.error('WebSocket error:', error);
        });

        ws.on('close', () => {
          console.log(`WebSocket client disconnected: ${ws.userId}`);
        });

        ws.send(JSON.stringify({
          type: 'connection',
          status: 'success',
          message: 'Connected successfully'
        }));

      } catch (error) {
        console.error('WebSocket authentication error:', error);
        ws.close(1008, 'Authentication failed');
      }
    });

    // Heartbeat interval
    const heartbeatInterval = setInterval(() => {
      wss.clients.forEach((ws) => {
        if (!ws.isAlive) {
          return ws.terminate();
        }
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000);

    wss.on('close', () => {
      clearInterval(heartbeatInterval);
    });

    // Broadcast to all clients
    wss.broadcast = function(data) {
      wss.clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(data));
        }
      });
    };

    // Send to specific user
    wss.sendToUser = function(userId, data) {
      wss.clients.forEach((client) => {
        if (client.userId === userId && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(data));
        }
      });
    };

    return wss;
  },

  getWss: () => wss,

  broadcast: (data) => {
    if (wss) {
      wss.broadcast(data);
    }
  },

  sendToUser: (userId, data) => {
    if (wss) {
      wss.sendToUser(userId, data);
    }
  }
};

module.exports = websocketService;