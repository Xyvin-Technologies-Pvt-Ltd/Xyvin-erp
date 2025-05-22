import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { XMarkIcon } from '@heroicons/react/24/outline';
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
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose} />

        <div className="inline-block transform overflow-hidden rounded-lg bg-white text-left align-bottom shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
          <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
            <div className="flex items-center justify-between pb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {isEditing ? 'Edit Client' : 'Add New Client'}
              </h3>
              <button
                type="button"
                className="text-gray-400 hover:text-gray-500"
                onClick={onClose}
              >
                <XMarkIcon className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
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
                  className={`mt-1 block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset ${
                    errors.name
                      ? 'ring-red-300 focus:ring-red-500'
                      : 'ring-gray-300 focus:ring-primary-600'
                  } focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6`}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
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
                  className={`mt-1 block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset ${
                    errors.email
                      ? 'ring-red-300 focus:ring-red-500'
                      : 'ring-gray-300 focus:ring-primary-600'
                  } focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6`}
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
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
                  className={`mt-1 block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset ${
                    errors.phone
                      ? 'ring-red-300 focus:ring-red-500'
                      : 'ring-gray-300 focus:ring-primary-600'
                  } focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6`}
                />
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="company" className="block text-sm font-medium text-gray-700">
                  Company Name *
                </label>
                <input
                  type="text"
                  id="company"
                  {...register('company', {
                    required: 'Company name is required',
                  })}
                  className={`mt-1 block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset ${
                    errors.company
                      ? 'ring-red-300 focus:ring-red-500'
                      : 'ring-gray-300 focus:ring-primary-600'
                  } focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6`}
                />
                {errors.company && (
                  <p className="mt-1 text-sm text-red-600">{errors.company.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                  Street Address
                </label>
                <textarea
                  id="address"
                  rows={3}
                  {...register('address')}
                  placeholder="Enter street address"
                  className={`mt-1 block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset ${
                    errors.address
                      ? 'ring-red-300 focus:ring-red-500'
                      : 'ring-gray-300 focus:ring-primary-600'
                  } focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6`}
                />
                {errors.address && (
                  <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>
                )}
              </div>

              <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                <button
                  type="submit"
                  className="inline-flex w-full justify-center rounded-md bg-black px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black sm:col-start-2"
                >
                  {isEditing ? 'Save Changes' : 'Add Client'}
                </button>
                <button
                  type="button"
                  className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:col-start-1 sm:mt-0"
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