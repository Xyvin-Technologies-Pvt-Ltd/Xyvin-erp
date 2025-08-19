import { create } from 'zustand';
import chatService from '@/api/chat.service';
import api from '@/api/api';

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

      set((state) => {
        const conversations = Array.isArray(state.conversations) ? [...state.conversations] : [];
        const index = conversations.findIndex((c) => c.user && c.user._id === user._id);
        if (index >= 0) {
          const updated = { ...conversations[index], unreadCount: 0 };
          conversations[index] = updated;
        }
        const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
        return { conversations, unreadCount: totalUnread };
      });

      await chatService.markRead(user._id);
      get().fetchConversations();
    } catch (e) {
      // ignore
    }
  },

  sendMessage: async (content, file) => {
    const user = get().activeUser;
    if (!user) return;
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
    const newMsg = await chatService.sendMessage(user._id, payload);
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
    // Build a robust WebSocket URL with fallback to API origin
    let baseWsUrl;
    const configuredBase = import.meta.env.VITE_WS_URL;
    if (configuredBase && typeof configuredBase === 'string') {
      try {
        baseWsUrl = new URL(configuredBase).origin.replace(/^http/, 'ws');
      } catch (_) {
        baseWsUrl = configuredBase.replace(/^http/, 'ws');
      }
    } else {
      try {
        const origin = new URL(api.defaults.baseURL).origin; // e.g. http://localhost:8080
        baseWsUrl = origin.replace(/^http/, 'ws');
      } catch (_) {
        // Final fallback to current origin
        baseWsUrl = window.location.origin.replace(/^http/, 'ws');
      }
    }
    const wsUrl = `${baseWsUrl}/websocket?token=${token}`;
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

          set((state) => {
            const conversations = Array.isArray(state.conversations) ? [...state.conversations] : [];
            const index = conversations.findIndex((c) => c.user && c.user._id === msg.sender);
            const isActiveChat = !!(active && active._id === msg.sender);
            if (index >= 0) {
              const updated = { ...conversations[index] };
              updated.lastMessage = msg;
              updated.unreadCount = (updated.unreadCount || 0) + (isActiveChat ? 0 : 1);
              conversations[index] = updated;
            } else {
              conversations.unshift({
                user: { _id: msg.sender },
                lastMessage: msg,
                unreadCount: isActiveChat ? 0 : 1
              });
            }
            const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);
            return { conversations, unreadCount: totalUnread };
          });

          if (active && active._id === msg.sender) {
            await chatService.markRead(msg.sender);
          }
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


