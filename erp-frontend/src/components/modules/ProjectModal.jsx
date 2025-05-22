import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { useProjectStore } from '@/stores/projectStore';
import { useClientStore } from '@/stores/clientStore';
import { toast } from 'react-hot-toast';

const ProjectModal = ({ isOpen, onClose, project = null }) => {
  const { addProject, updateProject } = useProjectStore();
  const { clients, fetchClients } = useClientStore();
  const isEditing = !!project;

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  useEffect(() => {
    const loadData = async () => {
      try {
        await fetchClients();
      } catch (error) {
        toast.error('Failed to load clients');
      }
    };
    loadData();
  }, [fetchClients]);

  useEffect(() => {
    if (project) {
      const formattedProject = {
        name: project.name,
        description: project.description,
        startDate: project.startDate.split('T')[0],
        endDate: project.endDate ? project.endDate.split('T')[0] : '',
        status: project.status || 'planning',
        clientId: project.client,
        id: project._id || project.id
      };
      console.log('Setting form data:', formattedProject);
      reset(formattedProject);
    } else {
      reset({});
    }
  }, [project, reset]);

  const onSubmit = async (data) => {
    try {
      const formattedData = {
        name: data.name,
        description: data.description,
        startDate: new Date(data.startDate).toISOString(),
        endDate: data.endDate ? new Date(data.endDate).toISOString() : null,
        status: data.status || 'planning',
        client: data.clientId
      };

      console.log('Submitting project data:', formattedData);

      if (isEditing && project) {
        const projectId = project._id || project.id;
        if (!projectId) {
          throw new Error('Project ID is missing');
        }
        console.log('Updating project with ID:', projectId);
        await updateProject(projectId, formattedData);
        toast.success('Project updated successfully');
      } else {
        await addProject(formattedData);
        toast.success('Project added successfully');
      }
      onClose();
    } catch (error) {
      console.error('Error in project form:', error);
      toast.error(error.message || `Failed to ${isEditing ? 'update' : 'add'} project`);
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
                {isEditing ? 'Edit Project' : 'Add New Project'}
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
                  Project Name *
                </label>
                <input
                  type="text"
                  id="name"
                  {...register('name', {
                    required: 'Project name is required',
                    minLength: {
                      value: 3,
                      message: 'Project name must be at least 3 characters',
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
                <label htmlFor="clientId" className="block text-sm font-medium text-gray-700">
                  Client *
                </label>
                <select
                  id="clientId"
                  {...register('clientId', {
                    required: 'Client is required',
                  })}
                  className={`mt-1 block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset ${
                    errors.clientId
                      ? 'ring-red-300 focus:ring-red-500'
                      : 'ring-gray-300 focus:ring-primary-600'
                  } focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6`}
                >
                  <option value="">Select a client</option>
                  {clients.map((client) => (
                    <option key={client._id || client.id} value={client._id || client.id}>
                      {client.name} - {client.company}
                    </option>
                  ))}
                </select>
                {errors.clientId && (
                  <p className="mt-1 text-sm text-red-600">{errors.clientId.message}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
                    Start Date *
                  </label>
                  <input
                    type="date"
                    id="startDate"
                    {...register('startDate', {
                      required: 'Start date is required',
                    })}
                    className={`mt-1 block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset ${
                      errors.startDate
                        ? 'ring-red-300 focus:ring-red-500'
                        : 'ring-gray-300 focus:ring-primary-600'
                    } focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6`}
                  />
                  {errors.startDate && (
                    <p className="mt-1 text-sm text-red-600">{errors.startDate.message}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
                    End Date
                  </label>
                  <input
                    type="date"
                    id="endDate"
                    {...register('endDate')}
                    className="mt-1 block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                  />
                </div>
              </div>

              {isEditing && (
                <div>
                  <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    id="status"
                    {...register('status')}
                    className="mt-1 block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                  >
                    <option value="planning">Planning</option>
                    <option value="in-progress">In Progress</option>
                    <option value="on-hold">On Hold</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>
              )}

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id="description"
                  rows={3}
                  {...register('description')}
                  className="mt-1 block w-full rounded-md border-0 py-1.5 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                />
              </div>

              <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                <button
                  type="submit"
                  className="inline-flex w-full justify-center rounded-md bg-black px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black sm:col-start-2"
                >
                  {isEditing ? 'Save Changes' : 'Add Project'}
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

export default ProjectModal; 