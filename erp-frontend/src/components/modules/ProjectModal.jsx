import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { XMarkIcon, UserGroupIcon, CalendarDaysIcon, DocumentTextIcon } from '@heroicons/react/24/outline';
import { useProjectStore } from '@/stores/projectStore';
import { useClientStore } from '@/stores/clientStore';
import { toast } from 'react-hot-toast';
import useHrmStore from '@/stores/useHrmStore';

const ProjectModal = ({ isOpen, onClose, project = null }) => {
  const { addProject, updateProject } = useProjectStore();
  const { clients, fetchClients } = useClientStore();
  const { employees, fetchEmployees } = useHrmStore();
  const isEditing = !!project;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
    watch,
  } = useForm();

  // Watch start date to validate end date
  const watchStartDate = watch('startDate');

  useEffect(() => {
    const loadData = async () => {
      try {
        await fetchClients();
        await fetchEmployees();
      } catch (error) {
        toast.error('Failed to load clients or employees');
      }
    };
    loadData();
  }, [fetchClients, fetchEmployees]);

  useEffect(() => {
    if (project) {
      // Extract client ID properly - handle different client data structures
      let clientId = '';
      if (project.client) {
        if (typeof project.client === 'object') {
          // If client is an object, get its ID
          clientId = project.client._id || project.client.id || project.client.$oid || '';
        } else {
          // If client is just an ID string
          clientId = project.client;
        }
      }

      const formattedProject = {
        name: project.name || '',
        description: project.description || '',
        startDate: project.startDate ? project.startDate.split('T')[0] : '',
        endDate: project.endDate ? project.endDate.split('T')[0] : '',
        status: project.status || 'planning',
        clientId: clientId,
        managerId: project.manager?._id || project.manager?.id || '',
        id: project._id || project.id
      };
      
      console.log('Setting form data:', formattedProject);
      console.log('Available clients:', clients);
      console.log('Project client data:', project.client);
      console.log('Extracted client ID:', clientId);
      
      reset(formattedProject);
    } else {
      reset({
        name: '',
        description: '',
        startDate: '',
        endDate: '',
        status: 'planning',
        clientId: '',
        managerId: ''
      });
    }
  }, [project, reset, clients]);

  const onSubmit = async (data) => {
    try {
      const formattedData = {
        name: data.name.trim(),
        description: data.description?.trim() || '',
        startDate: new Date(data.startDate).toISOString(),
        endDate: data.endDate ? new Date(data.endDate).toISOString() : null,
        status: data.status || 'planning',
        client: data.clientId,
        manager: data.managerId || null
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
        {/* Backdrop */}
        <div 
          className="fixed inset-0 bg-gradient-to-br from-gray-900/80 to-black/80 backdrop-blur-sm transition-opacity" 
          onClick={onClose} 
        />

        {/* Modal */}
        <div className="inline-block transform overflow-hidden rounded-xl bg-white text-left align-bottom shadow-2xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:align-middle">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="flex-shrink-0 w-8 h-8 bg-white/20 rounded-lg backdrop-blur-sm flex items-center justify-center">
                  <DocumentTextIcon className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">
                    {isEditing ? 'Edit Project' : 'Create Project'}
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

          {/* Form */}
          <div className="bg-white px-4 py-4">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Project Name */}
              <div className="space-y-1">
                <label htmlFor="name" className="flex items-center text-sm font-medium text-gray-700">
                  <DocumentTextIcon className="w-4 h-4 mr-1.5 text-gray-500" />
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
                    pattern: {
                      value: /^[a-zA-Z0-9\s\-_.,()]+$/,
                      message: 'Project name contains invalid characters'
                    }
                  })}
                  className={`w-full px-3 py-2 rounded-lg border transition-all duration-200 focus:outline-none text-sm ${
                    errors.name
                      ? 'border-red-300 focus:border-red-500 bg-red-50'
                      : 'border-gray-300 focus:border-blue-500 hover:border-gray-400'
                  }`}
                  placeholder="Enter project name..."
                />
                {errors.name && (
                  <p className="text-xs text-red-600 flex items-center">
                    <span className="w-1 h-1 bg-red-500 rounded-full mr-1.5"></span>
                    {errors.name.message}
                  </p>
                )}
              </div>

              {/* Client Selection */}
              <div className="space-y-1">
                <label htmlFor="clientId" className="flex items-center text-sm font-medium text-gray-700">
                  <UserGroupIcon className="w-4 h-4 mr-1.5 text-gray-500" />
                  Client *
                </label>
                <div className="relative">
                  <select
                    id="clientId"
                    {...register('clientId', {
                      required: 'Client is required',
                    })}
                    className={`w-full px-3 py-2 rounded-lg border transition-all duration-200 focus:outline-none appearance-none bg-white text-sm ${
                      errors.clientId
                        ? 'border-red-300 focus:border-red-500 bg-red-50'
                        : 'border-gray-300 focus:border-blue-500 hover:border-gray-400'
                    }`}
                  >
                    <option value="">Select a client</option>
                    {clients.map((client) => (
                      <option key={client._id || client.id} value={client._id || client.id}>
                        {client.name} {client.company ? `- ${client.company}` : ''}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                {errors.clientId && (
                  <p className="text-xs text-red-600 flex items-center">
                    <span className="w-1 h-1 bg-red-500 rounded-full mr-1.5"></span>
                    {errors.clientId.message}
                  </p>
                )}
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="startDate" className="flex items-center text-sm font-medium text-gray-700">
                    <CalendarDaysIcon className="w-4 h-4 mr-1.5 text-gray-500" />
                    Start Date *
                  </label>
                  <input
                    type="date"
                    id="startDate"
                    {...register('startDate', {
                      required: 'Start date is required',
                    })}
                    className={`w-full px-3 py-2 rounded-lg border transition-all duration-200 focus:outline-none text-sm ${
                      errors.startDate
                        ? 'border-red-300 focus:border-red-500 bg-red-50'
                        : 'border-gray-300 focus:border-blue-500 hover:border-gray-400'
                    }`}
                  />
                  {errors.startDate && (
                    <p className="text-xs text-red-600 flex items-center">
                      <span className="w-1 h-1 bg-red-500 rounded-full mr-1.5"></span>
                      {errors.startDate.message}
                    </p>
                  )}
                </div>

                <div className="space-y-1">
                  <label htmlFor="endDate" className="flex items-center text-sm font-medium text-gray-700">
                    <CalendarDaysIcon className="w-4 h-4 mr-1.5 text-gray-500" />
                    End Date
                  </label>
                  <input
                    type="date"
                    id="endDate"
                    min={watchStartDate}
                    {...register('endDate', {
                      validate: (value) => {
                        if (value && watchStartDate && new Date(value) < new Date(watchStartDate)) {
                          return 'End date must be after start date';
                        }
                        return true;
                      }
                    })}
                    className={`w-full px-3 py-2 rounded-lg border transition-all duration-200 focus:outline-none text-sm ${
                      errors.endDate
                        ? 'border-red-300 focus:border-red-500 bg-red-50'
                        : 'border-gray-300 focus:border-blue-500 hover:border-gray-400'
                    }`}
                  />
                  {errors.endDate && (
                    <p className="text-xs text-red-600 flex items-center">
                      <span className="w-1 h-1 bg-red-500 rounded-full mr-1.5"></span>
                      {errors.endDate.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Status - Show for both add and edit */}
              <div className="space-y-1">
                <label htmlFor="status" className="flex items-center text-sm font-medium text-gray-700">
                  <div className="w-3 h-3 mr-1.5 bg-gradient-to-r from-green-400 to-blue-500 rounded-full"></div>
                  Status
                </label>
                <div className="relative">
                  <select
                    id="status"
                    {...register('status')}
                    className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 hover:border-gray-400 transition-all duration-200 focus:outline-none appearance-none bg-white text-sm"
                  >
                    <option value="planning">Planning</option>
                    <option value="in-progress">In Progress</option>
                    <option value="on-hold">On Hold</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Project Manager */}
              <div className="space-y-1">
                <label htmlFor="managerId" className="flex items-center text-sm font-medium text-gray-700">
                  <UserGroupIcon className="w-4 h-4 mr-1.5 text-gray-500" />
                  Project Manager
                </label>
                <div className="relative">
                  <select
                    id="managerId"
                    {...register('managerId')}
                    className="w-full px-3 py-2 rounded-lg border transition-all duration-200 focus:outline-none appearance-none bg-white text-sm border-gray-300 focus:border-blue-500 hover:border-gray-400"
                  >
                    <option value="">Select a manager </option>
                    {Array.isArray(employees) && employees.map(emp => (
                      <option key={emp._id || emp.id} value={emp._id || emp.id}>
                        {emp.firstName} {emp.lastName} {emp.position?.title ? `- ${emp.position.title}` : ''}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 pointer-events-none">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label htmlFor="description" className="flex items-center text-sm font-medium text-gray-700">
                  <DocumentTextIcon className="w-4 h-4 mr-1.5 text-gray-500" />
                  Description
                </label>
                <textarea
                  id="description"
                  rows={3}
                  {...register('description', {
                    maxLength: {
                      value: 500,
                      message: 'Description must be less than 500 characters'
                    }
                  })}
                  className={`w-full px-3 py-2 rounded-lg border transition-all duration-200 focus:outline-none resize-none text-sm ${
                    errors.description
                      ? 'border-red-300 focus:border-red-500 bg-red-50'
                      : 'border-gray-300 focus:border-blue-500 hover:border-gray-400'
                  }`}
                  placeholder="Enter project description..."
                />
                {errors.description && (
                  <p className="text-xs text-red-600 flex items-center">
                    <span className="w-1 h-1 bg-red-500 rounded-full mr-1.5"></span>
                    {errors.description.message}
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 inline-flex items-center justify-center px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-medium rounded-lg shadow-md hover:shadow-lg disabled:shadow-sm transition-all duration-200 transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed text-sm"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                      {isEditing ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    <>
                      {isEditing ? 'Save Changes' : 'Create Project'}
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className="px-4 py-2.5 bg-white border border-gray-300 hover:border-gray-400 text-gray-700 font-medium rounded-lg shadow-sm hover:shadow-md transition-all duration-200 hover:bg-gray-50 text-sm"
                  onClick={onClose}
                  disabled={isSubmitting}
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