import { create } from 'zustand';
import chatService from '@/api/chat.service';

const useChatStore = create((set, get) => ({
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
  ws: null,
  unreadCount: 0,

  setSelectedRole: (role) => set({ selectedRole: role }),

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

  fetchConversations: async () => {
    try {
      const conversations = await chatService.listConversations();
      const totalUnread = conversations.reduce((sum, conv) => sum + (conv.unreadCount || 0), 0);
      set({ conversations, unreadCount: totalUnread });
    } catch (e) {}
  },

  openChatWith: async (user) => {
    set({ activeUser: user });
    try {
      const msgs = await chatService.getMessages(user._id);
      set((state) => ({ messages: { ...state.messages, [user._id]: msgs } }));
      await chatService.markRead(user._id);
      // Update unread count after marking as read
      get().fetchConversations();
    } catch (e) {
      // ignore
    }
  },

  sendMessage: async (content) => {
    const user = get().activeUser;
    if (!user || !content?.trim()) return;
    const newMsg = await chatService.sendMessage(user._id, content.trim());
    set((state) => ({
      messages: {
        ...state.messages,
        [user._id]: [...(state.messages[user._id] || []), newMsg]
      }
    }));
  },

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

  connectWebSocket: () => {
    const existing = get().ws;
    if (existing) return existing;
    const token = localStorage.getItem('token');
    if (!token) return null;
    const wsUrl = `${import.meta.env.VITE_WS_URL}/websocket?token=${token}`.replace(/^http/, 'ws');
    const ws = new WebSocket(wsUrl);
    ws.onopen = () => {};
    ws.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'chat') {
          const msg = data.data;
          const active = get().activeUser;
          set((state) => ({
            messages: {
              ...state.messages,
              [msg.sender]: [...(state.messages[msg.sender] || []), msg]
            }
          }));
          if (active && active._id === msg.sender) {
            await chatService.markRead(msg.sender);
          }
          // Update unread count when new message arrives
          get().fetchConversations();
        }
        if (data.type === 'notification') {
          
        }
      } catch (e) {}
    };
    ws.onclose = () => {
      set({ ws: null });
      setTimeout(get().connectWebSocket, 3000);
    };
    set({ ws });
    return ws;
  }
}));

export default useChatStore;


