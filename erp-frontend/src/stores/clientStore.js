import { create } from 'zustand';
import { clientService } from '../api/client.service';
import { projectService } from '../api/project.service';

const useClientStore = create((set, get) => ({
  clients: [],
  selectedClient: null,
  loading: false,
  error: null,

  // Fetch all clients
  fetchClients: async () => {
    set({ loading: true, error: null });
    try {
      const clients = await clientService.getClients();
      console.log('Fetched clients:', clients);

      // Ensure we have an array and all clients have required fields
      const validClients = Array.isArray(clients) ? clients.map(client => ({
        ...client,
        projects: client.projects || []
      })) : [];

      set({ clients: validClients, loading: false });
      return validClients;
    } catch (error) {
      console.error('Error in fetchClients:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Fetch single client
  fetchClient: async (id) => {
    set({ loading: true, error: null });
    try {
      const client = await clientService.getClient(id);
      set({ selectedClient: client, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  // Create client
  createClient: async (clientData) => {
    set({ loading: true, error: null });
    try {
      const newClient = await clientService.createClient(clientData);
      console.log('New client created:', newClient);

      if (newClient) {
        set((state) => {
          const updatedClients = [...state.clients, newClient];
          console.log('Updated clients list:', updatedClients);
          return {
            clients: updatedClients,
            loading: false
          };
        });
      }

      return newClient;
    } catch (error) {
      console.error('Error in createClient:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Update client
  updateClient: async (id, clientData) => {
    if (!id) {
      throw new Error('Client ID is required for update');
    }

    console.log('Updating client:', { id, data: clientData });
    set({ loading: true, error: null });

    try {
      const updatedClient = await clientService.updateClient(id, clientData);
      console.log('Updated client response:', updatedClient);

      if (updatedClient) {
        set((state) => {
          const updatedClients = state.clients.map((client) =>
            (client._id === id || client.id === id) ? updatedClient : client
          );
          console.log('Updated clients list:', updatedClients);
          return {
            clients: updatedClients,
            selectedClient: updatedClient,
            loading: false
          };
        });
      }

      return updatedClient;
    } catch (error) {
      console.error('Error in updateClient:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Delete client
  deleteClient: async (id) => {
    if (!id) {
      throw new Error('Client ID is required for deletion');
    }

    set({ loading: true, error: null });
    try {
      const result = await clientService.deleteClient(id);
      console.log('Client deletion result:', result);

      set((state) => {
        const updatedClients = state.clients.filter((client) =>
          client._id !== id && client.id !== id
        );
        console.log('Updated clients list after deletion:', updatedClients);
        return {
          clients: updatedClients,
          loading: false
        };
      });
    } catch (error) {
      console.error('Error in deleteClient:', error);
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  // Clear selected client
  clearSelectedClient: () => set({ selectedClient: null }),

  // Clear error
  clearError: () => set({ error: null })
}));

export { useClientStore }; 