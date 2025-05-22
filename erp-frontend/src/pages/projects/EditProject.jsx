import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useProjectStore } from '@/stores/projectStore';
import { useClientStore } from '@/stores/clientStore';
import { toast } from 'react-hot-toast';

const EditProject = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { updateProject, getProject } = useProjectStore();
  const { clients, fetchClients } = useClientStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  useEffect(() => {
    const loadData = async () => {
      try {
        const [projectData] = await Promise.all([
          getProject(id),
          fetchClients(),
        ]);
        
        // Format dates for the form
        const formattedData = {
          ...projectData,
          startDate: projectData.startDate.split('T')[0],
          endDate: projectData.endDate ? projectData.endDate.split('T')[0] : '',
        };
        
        reset(formattedData);
      } catch (error) {
        toast.error('Failed to load project data');
        navigate('/projects/list');
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [id, getProject, fetchClients, reset, navigate]);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    try {
      await updateProject(id, {
        ...data,
        startDate: new Date(data.startDate).toISOString(),
        endDate: data.endDate ? new Date(data.endDate).toISOString() : null,
      });
      toast.success('Project updated successfully');
      navigate('/projects/list');
    } catch (error) {
      toast.error(error.message || 'Failed to update project');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-semibold text-gray-900">Edit Project</h1>
      </div>

      <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl md:col-span-2">
        <form onSubmit={handleSubmit(onSubmit)} className="px-4 py-6 sm:p-8">
          <div className="grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
            <div className="sm:col-span-4">
              <label
                htmlFor="name"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                Project Name *
              </label>
              <div className="mt-2">
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
                  className={`block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ${
                    errors.name
                      ? 'ring-red-300 focus:ring-red-500'
                      : 'ring-gray-300 focus:ring-primary-600'
                  } placeholder:text-gray-400 focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6`}
                />
                {errors.name && (
                  <p className="mt-2 text-sm text-red-600">{errors.name.message}</p>
                )}
              </div>
            </div>

            <div className="sm:col-span-4">
              <label
                htmlFor="clientId"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                Client *
              </label>
              <div className="mt-2">
                <select
                  id="clientId"
                  {...register('clientId', {
                    required: 'Client is required',
                  })}
                  className={`block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ${
                    errors.clientId
                      ? 'ring-red-300 focus:ring-red-500'
                      : 'ring-gray-300 focus:ring-primary-600'
                  } focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6`}
                >
                  <option value="">Select a client</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name} - {client.company}
                    </option>
                  ))}
                </select>
                {errors.clientId && (
                  <p className="mt-2 text-sm text-red-600">
                    {errors.clientId.message}
                  </p>
                )}
              </div>
            </div>

            <div className="sm:col-span-3">
              <label
                htmlFor="startDate"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                Start Date *
              </label>
              <div className="mt-2">
                <input
                  type="date"
                  id="startDate"
                  {...register('startDate', {
                    required: 'Start date is required',
                  })}
                  className={`block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ${
                    errors.startDate
                      ? 'ring-red-300 focus:ring-red-500'
                      : 'ring-gray-300 focus:ring-primary-600'
                  } focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6`}
                />
                {errors.startDate && (
                  <p className="mt-2 text-sm text-red-600">
                    {errors.startDate.message}
                  </p>
                )}
              </div>
            </div>

            <div className="sm:col-span-3">
              <label
                htmlFor="endDate"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                End Date
              </label>
              <div className="mt-2">
                <input
                  type="date"
                  id="endDate"
                  {...register('endDate')}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                />
              </div>
            </div>

            <div className="sm:col-span-4">
              <label
                htmlFor="status"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                Status *
              </label>
              <div className="mt-2">
                <select
                  id="status"
                  {...register('status', {
                    required: 'Status is required',
                  })}
                  className={`block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ${
                    errors.status
                      ? 'ring-red-300 focus:ring-red-500'
                      : 'ring-gray-300 focus:ring-primary-600'
                  } focus:ring-2 focus:ring-inset sm:text-sm sm:leading-6`}
                >
                  <option value="pending">Pending</option>
                  <option value="in_progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="on_hold">On Hold</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                {errors.status && (
                  <p className="mt-2 text-sm text-red-600">
                    {errors.status.message}
                  </p>
                )}
              </div>
            </div>

            <div className="sm:col-span-6">
              <label
                htmlFor="description"
                className="block text-sm font-medium leading-6 text-gray-900"
              >
                Description
              </label>
              <div className="mt-2">
                <textarea
                  id="description"
                  rows={4}
                  {...register('description')}
                  className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-primary-600 sm:text-sm sm:leading-6"
                />
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-x-6">
            <button
              type="button"
              onClick={() => navigate('/projects/list')}
              className="text-sm font-semibold leading-6 text-gray-900"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex justify-center rounded-md bg-primary-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-primary-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary-600 disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProject; 