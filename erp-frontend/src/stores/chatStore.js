import { create } from 'zustand';
import chatService from '@/api/chat.service';
import api from '@/api/api';
import { io } from 'socket.io-client';

const useChatStore = create((set, get) => ({
  // Basic state
  roles: [
    'Admin',
    'Project Manager',
    'HR Manager',
    'Finance Manager',
    'Employee',
    'Operation Officer'
  ],
  selectedRole: 'Admin',
  users: [],
  conversations: [],
  messages: {},
  activeUser: null,
  isLoading: false,
  error: null,
  socket: null,
  unreadCount: 0,
  isSocketConnected: false,
  typingByUserId: {},

  // Simple actions
  setSelectedRole: (role) => set({ selectedRole: role }),

  // Fetch users by role
  fetchUsers: async () => {
    const role = get().selectedRole;
    set({ isLoading: true, error: null });
    try {
      const users = await chatService.listUsers(role);
      set({ users, isLoading: false });
    } catch (e) {
      set({ error: e.message || 'Failed to load users', isLoading: false });
    }
  },

  // Fetch conversations
  fetchConversations: async () => {
    try {
      const conversations = await chatService.listConversations();
      const totalUnread = conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
      set({ conversations, unreadCount: totalUnread });
      console.log('Conversations updated:', conversations.length, 'Total unread:', totalUnread);
    } catch (e) {
      console.error('Failed to fetch conversations:', e);
    }
  },

  // Open chat with user
  openChatWith: async (user) => {
    console.log('Opening chat with user:', user);
    set({ activeUser: user });
    
    try {
      // Get existing messages
      const msgs = await chatService.getMessages(user._id);
      console.log('Loaded messages for user:', user._id, msgs.length);
      
      // Store messages under the user's ID
      set((state) => ({
        messages: {
          ...state.messages,
          [user._id]: msgs
        }
      }));

      // Mark as read
      await chatService.markRead(user._id);
      
      // Update conversations to refresh unread counts
      get().fetchConversations();
    } catch (e) {
      console.error('Failed to open chat:', e);
    }
  },

  // Send message
  sendMessage: async (content, file) => {
    const user = get().activeUser;
    if (!user) return;
    
    console.log('Sending message to:', user._id, 'Content:', content, 'File:', file);
    
    let payload;
    if (file) {
      const form = new FormData();
      if (content && content.trim()) form.append('content', content.trim());
      form.append('attachment', file);
      payload = form;
    } else {
      if (!content?.trim()) return;
      payload = { content: content.trim() };
    }
    
    try {
      const newMsg = await chatService.sendMessage(user._id, payload);
      console.log('Message sent successfully:', newMsg);
      
      // Add to local state immediately
      set((state) => {
        const currentMessages = state.messages[user._id] || [];
        return {
          messages: {
            ...state.messages,
            [user._id]: [...currentMessages, newMsg]
          }
        };
      });
      
      // Update conversations
      get().fetchConversations();
      
    } catch (e) {
      console.error('Failed to send message:', e);
    }
  },

  // Delete message
  deleteMessage: async (messageId) => {
    try {
      await chatService.deleteMessage(messageId);
      const activeUser = get().activeUser;
      if (activeUser) {
        set((state) => ({
          messages: {
            ...state.messages,
            [activeUser._id]: (state.messages[activeUser._id] || []).filter(msg => msg._id !== messageId)
          }
        }));
      }
    } catch (e) {
      console.error('Failed to delete message:', e);
    }
  },

  // Connect Socket.IO
  connectSocket: () => {
    const existing = get().socket;
    if (existing && existing.connected) {
      console.log('Socket already connected');
      return existing;
    }
    
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token found');
      return null;
    }
    
    let baseOrigin;
    try { 
      baseOrigin = new URL(api.defaults.baseURL).origin; 
    } catch (_) { 
      baseOrigin = window.location.origin; 
    }
    
    console.log('Connecting to Socket.IO at:', baseOrigin);
    
    const socket = io(baseOrigin, {
      transports: ['websocket'],
      auth: { token },
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: Infinity
    });

    // Connection events
    socket.on('connect', () => {
      console.log('✅ Socket.IO connected');
      set({ isSocketConnected: true });
      get().fetchConversations();
    });

    socket.on('connect_error', (error) => {
      console.error('❌ Socket.IO connection error:', error);
      set({ isSocketConnected: false });
    });

    socket.on('disconnect', (reason) => {
      console.log('🔌 Socket.IO disconnected:', reason);
      set({ isSocketConnected: false });
    });

    // Handle incoming messages - FIXED VERSION
    socket.on('chat', (msg) => {
      console.log('📨 Received message via Socket.IO:', msg);
      
      const me = JSON.parse(localStorage.getItem('user'))?._id;
      if (!me) return;
      
      // Determine conversation partner
      const conversationPartnerId = (msg.sender === me) ? msg.recipient : msg.sender;
      console.log('Conversation partner ID:', conversationPartnerId);
      console.log('Current active user:', get().activeUser?._id);
      
      // Add message to state - FIXED LOGIC
      set((state) => {
        const currentMessages = state.messages[conversationPartnerId] || [];
        const messageExists = currentMessages.some(m => m._id === msg._id);
        
        if (messageExists) {
          console.log('Message already exists, skipping');
          return state;
        }
        
        console.log('Adding new message to conversation:', conversationPartnerId);
        const updatedMessages = [...currentMessages, msg];
        
        // Force a complete state update to trigger re-render
        const newState = {
          ...state,
          messages: {
            ...state.messages,
            [conversationPartnerId]: updatedMessages
          }
        };
        
        console.log('New state messages:', newState.messages);
        return newState;
      });
      
      // Update conversations immediately to refresh unread counts
      get().fetchConversations();
      
      // Mark as read if this is the active chat
      const activeUser = get().activeUser;
      if (activeUser && activeUser._id === conversationPartnerId) {
        console.log('Marking message as read');
        chatService.markRead(conversationPartnerId).catch(console.error);
        // Update conversations again after marking as read
        setTimeout(() => get().fetchConversations(), 100);
      }
    });

    // Handle typing
    socket.on('typing', ({ from, isTyping }) => {
      console.log('⌨️ Typing indicator:', { from, isTyping });
      set((state) => ({
        typingByUserId: {
          ...state.typingByUserId,
          [from]: isTyping
        }
      }));
    });

    // Handle notifications
    socket.on('notification', (notification) => {
      console.log('🔔 Notification received:', notification);
    });

    set({ socket });
    return socket;
  },

  // Emit typing
  emitTyping: (isTyping) => {
    const socket = get().socket;
    const activeUser = get().activeUser;
    if (socket && activeUser) {
      socket.emit('typing', { to: activeUser._id, isTyping });
    }
  },

  // Test Socket.IO functionality
  testSocket: () => {
    const socket = get().socket;
    if (socket && socket.connected) {
      console.log('Testing Socket.IO...');
      socket.emit('test', { message: 'Test from chat store' });
      return true;
    } else {
      console.log('Socket not connected for testing');
      return false;
    }
  },

  // Add test message manually
  addTestMessage: (userId) => {
    const testMsg = {
      _id: 'test-' + Date.now(),
      sender: userId,
      recipient: JSON.parse(localStorage.getItem('user'))?._id,
      content: 'Test message ' + new Date().toLocaleTimeString(),
      createdAt: new Date().toISOString()
    };
    
    console.log('Adding test message:', testMsg);
    
    set((state) => {
      const currentMessages = state.messages[userId] || [];
      const updatedMessages = [...currentMessages, testMsg];
      
      return {
        ...state,
        messages: {
          ...state.messages,
          [userId]: updatedMessages
        }
      };
    });
    
    return testMsg;
  },

  // Force refresh messages for a user
  refreshMessages: async (userId) => {
    try {
      const msgs = await chatService.getMessages(userId);
      set((state) => ({
        messages: {
          ...state.messages,
          [userId]: msgs
        }
      }));
      console.log('Messages refreshed for user:', userId, msgs.length);
    } catch (e) {
      console.error('Failed to refresh messages:', e);
    }
  },

  // Disconnect
  disconnectSocket: () => {
    const socket = get().socket;
    if (socket) {
      socket.disconnect();
      set({ socket: null, isSocketConnected: false });
    }
  },

  // Cleanup
  cleanup: () => {
    const socket = get().socket;
    if (socket) {
      socket.disconnect();
    }
    set({
      socket: null,
      isSocketConnected: false,
      activeUser: null,
      messages: {},
      conversations: [],
      users: [],
      unreadCount: 0
    });
  }
}));

export default useChatStore;


