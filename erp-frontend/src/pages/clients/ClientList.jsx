import { useState, useEffect } from 'react';
import { 
  PencilIcon, 
  TrashIcon, 
  PlusIcon,
  EnvelopeIcon,
  PhoneIcon,
  BuildingOfficeIcon,
  UserIcon
} from '@heroicons/react/24/outline';
import { useClientStore } from '@/stores/clientStore';
import { toast } from 'react-hot-toast';
import ClientModal from '@/components/modules/ClientModal';
import DeleteConfirmationModal from '@/components/common/DeleteConfirmationModal';

const ClientList = () => {
  const { clients, fetchClients, deleteClient } = useClientStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState(null);

  useEffect(() => {
    const loadClients = async () => {
      try {
        await fetchClients();
      } catch (error) {
        console.error('Error loading clients:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadClients();
  }, [fetchClients]);

  const handleDelete = async (client) => {
    setClientToDelete(client);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!clientToDelete) return;
    
    try {
      await deleteClient(clientToDelete._id);
      toast.success('Client deleted successfully');
      setDeleteModalOpen(false);
      setClientToDelete(null);
    } catch (error) {
      console.error('Error deleting client:', error);
      toast.error('Failed to delete client');
    }
  };

  const handleEdit = (client) => {
    setSelectedClient(client);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedClient(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedClient(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-gradient-to-br from-gray-50 to-white">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600 mx-auto"></div>
          <p className="text-gray-500 font-medium">Loading clients...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8 min-h-screen">
        <div className="flex justify-between items-center">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
              Clients
            </h1>
            <p className="text-gray-600">Manage and organize all your company clients</p>
          </div>
          <button
            onClick={handleAdd}
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
            Add Client
          </button>
        </div>

        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-gray-200 min-w-[800px]">
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Phone
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Projects
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-gray-600 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {clients.map((client, index) => (
                  <tr 
                    key={client._id} 
                    className={`hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-full flex items-center justify-center">
                          <UserIcon className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="text-sm font-semibold text-gray-900">{client.name}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-blue-50 to-indigo-100 rounded-lg flex items-center justify-center">
                          <EnvelopeIcon className="w-3 h-3 text-blue-600" />
                        </div>
                        <span className="text-sm text-gray-600">{client.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-green-50 to-emerald-100 rounded-lg flex items-center justify-center">
                          <PhoneIcon className="w-3 h-3 text-green-600" />
                        </div>
                        <span className="text-sm text-gray-600">{client.phone}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-purple-50 to-violet-100 rounded-lg flex items-center justify-center">
                          <BuildingOfficeIcon className="w-3 h-3 text-purple-600" />
                        </div>
                        <span className="text-sm text-gray-600">{client.company}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-700 border border-blue-200">
                        {client.projects?.length || 0} Projects
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <div className="flex justify-end space-x-2">
                        <button
                          onClick={() => handleEdit(client)}
                          className="group p-1.5 rounded-lg hover:bg-gray-50 transition-all duration-200"
                          title="Edit Client"
                        >
                          <PencilIcon className="h-4 w-4 text-gray-400 group-hover:text-gray-700" />
                        </button>
                        <button
                          onClick={() => handleDelete(client)}
                          className="group p-1.5 rounded-lg hover:bg-red-50 transition-all duration-200"
                          title="Delete Client"
                        >
                          <TrashIcon className="h-4 w-4 text-gray-400 group-hover:text-red-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {clients.length === 0 && (
                  <tr>
                    <td colSpan="6" className="px-6 py-16 text-center">
                      <div className="space-y-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto">
                          <PlusIcon className="w-8 h-8 text-gray-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">No clients found</h3>
                          <p className="text-gray-500 mt-1">Get started by adding your first client</p>
                        </div>
                        <button
                          onClick={handleAdd}
                          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
                        >
                          <PlusIcon className="w-4 h-4 mr-2" />
                          Add Client
                        </button>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <ClientModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        client={selectedClient}
      />

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setClientToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Delete Client"
        message={`Are you sure you want to delete ${clientToDelete?.name}? This action cannot be undone.`}
        itemName={clientToDelete?.name}
      />
    </>
  );
};

export default ClientList; 