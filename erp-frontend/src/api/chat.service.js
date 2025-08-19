import api from './api';

const chatService = {
  listUsers: async (role) => {
    const res = await api.get('/chat/users', { params: role ? { role } : {} });
    return res.data?.data || [];
  },
  listConversations: async () => {
    const res = await api.get('/chat/conversations');
    return res.data?.data || [];
  },
  getMessages: async (userId) => {
    const res = await api.get(`/chat/messages/${userId}`);
    return res.data?.data || [];
  },
  sendMessage: async (userId, payload) => {
    // payload can be { content } or FormData with content + attachment
    const isFormData = typeof FormData !== 'undefined' && payload instanceof FormData;
    const res = await api.post(`/chat/messages/${userId}`, payload, isFormData ? {
      headers: { 'Content-Type': 'multipart/form-data' }
    } : undefined);
    return res.data?.data;
  },
  markRead: async (userId) => {
    const res = await api.put(`/chat/read/${userId}`);
    return res.data;
  },
  deleteMessage: async (messageId) => {
    const res = await api.delete(`/chat/messages/${messageId}`);
    return res.data;
  }
};

export default chatService;


