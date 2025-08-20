const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
const env = require('../config/env');

let ioInstance = null;

function init(server) {
  if (ioInstance) return ioInstance;

  console.log('Initializing Socket.IO server...');

  const io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true
    },
    transports: ['websocket'],
    pingTimeout: 60000,
    pingInterval: 25000
  });

  // Authenticate sockets using JWT
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.query?.token || (socket.handshake.headers?.authorization || '').replace(/^Bearer\s+/i, '');
      if (!token) {
        console.log('Socket authentication failed: No token provided');
        return next(new Error('Authentication required'));
      }
      
      const decoded = jwt.verify(token, env.JWT_SECRET);
      socket.userId = String(decoded.id);
      console.log(`Socket authenticated for user: ${socket.userId}`);
      return next();
    } catch (err) {
      console.log('Socket authentication failed:', err.message);
      return next(new Error('Authentication failed'));
    }
  });

  io.on('connection', (socket) => {
    console.log(`Socket connected: ${socket.id} for user: ${socket.userId}`);
    
    // Join a private room for direct messaging
    socket.join(socket.userId);
    console.log(`User ${socket.userId} joined room: ${socket.userId}`);

    socket.on('typing', ({ to, isTyping }) => {
      if (!to) return;
      console.log(`User ${socket.userId} typing ${isTyping ? 'started' : 'stopped'} to ${to}`);
      io.to(String(to)).emit('typing', { from: socket.userId, isTyping: !!isTyping });
    });

    socket.on('test', (data) => {
      console.log(`Test message received from ${socket.userId}:`, data);
      // Echo back the test message
      socket.emit('test_response', { 
        message: 'Test message received by backend!',
        originalData: data,
        timestamp: new Date().toISOString()
      });
    });

    socket.on('ping', () => {
      console.log(`Ping received from ${socket.userId}`);
      socket.emit('pong', { timestamp: new Date().toISOString() });
    });

    socket.on('chat', (data) => {
      console.log(`Test chat message received from ${socket.userId}:`, data);
      // Echo back the chat message
      socket.emit('chat_response', { 
        message: 'Chat message received by backend!',
        originalData: data,
        timestamp: new Date().toISOString()
      });
    });

    socket.on('disconnect', (reason) => {
      console.log(`Socket disconnected: ${socket.id} for user: ${socket.userId}, reason: ${reason}`);
    });
  });

  ioInstance = io;
  console.log('Socket.IO server initialized successfully');
  return io;
}

function getIO() {
  return ioInstance;
}

function emitToUser(userId, event, data) {
  if (!ioInstance) {
    console.error('Socket.IO not initialized');
    return;
  }
  
  console.log(`Emitting ${event} to user ${userId}:`, data);
  ioInstance.to(String(userId)).emit(event, data);
}

module.exports = {
  init,
  getIO,
  emitToUser
};


