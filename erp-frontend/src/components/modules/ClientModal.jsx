import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { 
  XMarkIcon, 
  UserIcon,
  EnvelopeIcon,
  PhoneIcon,
  BuildingOfficeIcon,
  MapPinIcon 
} from '@heroicons/react/24/outline';
import { useClientStore } from '@/stores/clientStore';
import { toast } from 'react-hot-toast';

const ClientModal = ({ isOpen, onClose, client = null }) => {
  const { createClient, updateClient } = useClientStore();
  const isEditing = !!client;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  useEffect(() => {
    if (client) {
      // Format the client data for editing, excluding _id
      const formattedClient = {
        name: client.name,
        email: client.email,
        phone: client.phone,
        company: client.company,
        address: client.address?.street || ''
      };
      console.log('Setting form data:', formattedClient);
      reset(formattedClient);
    } else {
      reset({});
    }
  }, [client, reset]);

  const onSubmit = async (data) => {
    try {
      // Format the data to match backend requirements
      const formattedData = {
        name: data.name,
        email: data.email,
        phone: data.phone,
        company: data.company,
        address: {
          street: String(data.address || '').trim()
        }
      };

      console.log('Submitting data:', formattedData);

      if (isEditing && client) {
        // Use _id or id, whichever is available
        const clientId = client._id || client.id;
        if (!clientId) {
          throw new Error('Client ID is missing');
        }
        console.log('Updating client with ID:', clientId);
        await updateClient(clientId, formattedData);
        toast.success('Client updated successfully');
      } else {
        await createClient(formattedData);
        toast.success('Client added successfully');
      }
      onClose();
    } catch (error) {
      console.error('Error in client form:', error);
      toast.error(error.message || `Failed to ${isEditing ? 'update' : 'add'} client`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm transition-opacity" 
          onClick={onClose} 
        />

        {/* Modal */}
        <div className="inline-block transform overflow-hidden rounded-xl bg-white text-left shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-2xl">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="flex-shrink-0 w-8 h-8 bg-white/20 rounded-lg backdrop-blur-sm flex items-center justify-center">
                  <UserIcon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {isEditing ? 'Edit Client' : 'Add New Client'}
                  </h3>
                </div>
              </div>
              <button
                type="button"
                className="text-white/80 hover:text-white hover:bg-white/20 rounded-lg p-1.5 transition-all duration-200"
                onClick={onClose}
              >
                <XMarkIcon className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Form Content */}
          <div className="bg-white px-4 py-4">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Basic Information */}
              <div className="space-y-4">
                <h4 className="text-sm font-semibold text-gray-900 pb-2 border-b">Basic Information</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label htmlFor="name" className="flex items-center text-sm font-medium text-gray-700">
                      <UserIcon className="w-4 h-4 mr-1.5 text-gray-500" />
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      {...register('name', {
                        required: 'Name is required',
                        minLength: {
                          value: 2,
                          message: 'Name must be at least 2 characters',
                        },
                      })}
                      className={`w-full px-3 py-2 rounded-lg border transition-all duration-200 focus:outline-none text-sm ${
                        errors.name
                          ? 'border-red-300 focus:border-red-500 bg-red-50'
                          : 'border-gray-300 focus:border-purple-500 hover:border-gray-400'
                      }`}
                    />
                    {errors.name && (
                      <p className="text-xs text-red-600 flex items-center">
                        <span className="w-1 h-1 bg-red-500 rounded-full mr-1.5"></span>
                        {errors.name.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="email" className="flex items-center text-sm font-medium text-gray-700">
                      <EnvelopeIcon className="w-4 h-4 mr-1.5 text-gray-500" />
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      {...register('email', {
                        required: 'Email is required',
                        pattern: {
                          value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                          message: 'Invalid email address',
                        },
                      })}
                      className={`w-full px-3 py-2 rounded-lg border transition-all duration-200 focus:outline-none text-sm ${
                        errors.email
                          ? 'border-red-300 focus:border-red-500 bg-red-50'
                          : 'border-gray-300 focus:border-purple-500 hover:border-gray-400'
                      }`}
                    />
                    {errors.email && (
                      <p className="text-xs text-red-600 flex items-center">
                        <span className="w-1 h-1 bg-red-500 rounded-full mr-1.5"></span>
                        {errors.email.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="phone" className="flex items-center text-sm font-medium text-gray-700">
                      <PhoneIcon className="w-4 h-4 mr-1.5 text-gray-500" />
                      Phone Number *
                    </label>
                    <input
                      type="tel"
                      id="phone"
                      {...register('phone', {
                        required: 'Phone number is required',
                        pattern: {
                          value: /^[0-9+\-() ]{10,}$/,
                          message: 'Invalid phone number',
                        },
                      })}
                      className={`w-full px-3 py-2 rounded-lg border transition-all duration-200 focus:outline-none text-sm ${
                        errors.phone
                          ? 'border-red-300 focus:border-red-500 bg-red-50'
                          : 'border-gray-300 focus:border-purple-500 hover:border-gray-400'
                      }`}
                    />
                    {errors.phone && (
                      <p className="text-xs text-red-600 flex items-center">
                        <span className="w-1 h-1 bg-red-500 rounded-full mr-1.5"></span>
                        {errors.phone.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="company" className="flex items-center text-sm font-medium text-gray-700">
                      <BuildingOfficeIcon className="w-4 h-4 mr-1.5 text-gray-500" />
                      Company Name *
                    </label>
                    <input
                      type="text"
                      id="company"
                      {...register('company', {
                        required: 'Company name is required',
                      })}
                      className={`w-full px-3 py-2 rounded-lg border transition-all duration-200 focus:outline-none text-sm ${
                        errors.company
                          ? 'border-red-300 focus:border-red-500 bg-red-50'
                          : 'border-gray-300 focus:border-purple-500 hover:border-gray-400'
                      }`}
                    />
                    {errors.company && (
                      <p className="text-xs text-red-600 flex items-center">
                        <span className="w-1 h-1 bg-red-500 rounded-full mr-1.5"></span>
                        {errors.company.message}
                      </p>
                    )}
                  </div>

                  <div className="col-span-2 space-y-1">
                    <label htmlFor="address" className="flex items-center text-sm font-medium text-gray-700">
                      <MapPinIcon className="w-4 h-4 mr-1.5 text-gray-500" />
                      Street Address
                    </label>
                    <textarea
                      id="address"
                      rows={3}
                      {...register('address')}
                      placeholder="Enter street address"
                      className={`w-full px-3 py-2 rounded-lg border transition-all duration-200 focus:outline-none text-sm resize-none ${
                        errors.address
                          ? 'border-red-300 focus:border-red-500 bg-red-50'
                          : 'border-gray-300 focus:border-purple-500 hover:border-gray-400'
                      }`}
                    />
                    {errors.address && (
                      <p className="text-xs text-red-600 flex items-center">
                        <span className="w-1 h-1 bg-red-500 rounded-full mr-1.5"></span>
                        {errors.address.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  className="flex-1 inline-flex items-center justify-center px-4 py-2.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-medium rounded-lg shadow-md hover:shadow-lg disabled:shadow-sm transition-all duration-200 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed text-sm"
                >
                  {isEditing ? 'Save Changes' : 'Add Client'}
                </button>
                <button
                  type="button"
                  className="px-4 py-2.5 bg-white border border-gray-300 hover:border-gray-400 text-gray-700 font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-200 hover:bg-gray-50 text-sm"
                  onClick={onClose}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientModal; 