import api from './api';

const BASE_URL = '/clients';

export const clientService = {
  createClient: async (clientData) => {
    try {
      const response = await api.post(BASE_URL, clientData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  getClients: async () => {
    try {
      const response = await api.get(BASE_URL);
      console.log('Raw API response:', response);
      
      // Ensure we're getting the data property from the response
      const data = response.data;
      console.log('Processed API response:', data);
      
      // Validate and transform the data if needed
      if (!Array.isArray(data)) {
        console.warn('API response is not an array:', data);
        return [];
      }
      
      // Map the data to ensure consistent structure
      const processedData = data.map(client => ({
        _id: client._id,
        name: client.name || '',
        email: client.email || '',
        phone: client.phone || '',
        company: client.company || '',
        address: client.address || {},
        projects: client.projects || [],
        status: client.status || 'active',
        createdAt: client.createdAt,
        updatedAt: client.updatedAt
      }));
      
      return processedData;
    } catch (error) {
      console.error('Error fetching clients:', error);
      throw error;
    }
  },

  getClient: async (id) => {
    try {
      const response = await api.get(`${BASE_URL}/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  updateClient: async (id, clientData) => {
    try {
      const response = await api.put(`${BASE_URL}/${id}`, clientData);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  deleteClient: async (id) => {
    try {
      const response = await api.delete(`${BASE_URL}/${id}`);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}; 