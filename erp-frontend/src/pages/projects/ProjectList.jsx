import { useState, useEffect } from 'react';
import { PencilIcon, TrashIcon, PlusIcon, UserGroupIcon, Squares2X2Icon, ChevronLeftIcon, ChevronRightIcon } from '@heroicons/react/24/outline';
import { useProjectStore } from '@/stores/projectStore';
import { useClientStore } from '@/stores/clientStore';
import { toast } from 'react-hot-toast';
import ProjectModal from '@/components/modules/ProjectModal';
import { useNavigate } from 'react-router-dom';
import { useTable, usePagination } from 'react-table';
import { useMemo } from 'react';
import DeleteConfirmationModal from '@/components/common/DeleteConfirmationModal';
import useAuthStore from '@/stores/auth.store';

const ProjectList = () => {
  const navigate = useNavigate();
  const { projects, fetchProjects, deleteProject } = useProjectStore();
  const { clients, fetchClients } = useClientStore();
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null); 
  const [tableData, setTableData] = useState([]);

  const canAddProjects = user?.role === 'ERP System Administrator' || user?.role === 'Operation Officer';

  useEffect(() => {
    const loadData = async () => {
      try {
        const [projectsData, clientsData] = await Promise.all([fetchProjects(), fetchClients()]);
        console.log('Loaded projects:', projectsData);
        console.log('Loaded clients:', clientsData);
        console.log('Projects with client details:', projectsData.map(p => ({
          id: p._id,
          name: p.name,
          client: p.client,
          company: p.client?.company // Check if company exists
        })));
        console.log('Current projects state:', projects.map(p => ({
          id: p._id,
          name: p.name,
          client: p.client,
          company: p.client?.company
        })));
        setTableData(projectsData);
      } catch (error) {
        console.error('Error loading data:', error);
        toast.error('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [fetchProjects, fetchClients]);

  const handleDelete = async (id) => {
    if (!id) {
      toast.error('Project ID is missing');
      return;
    }
    
    // Find the project to delete for displaying its name in the modal
    const project = projects.find(p => (p._id === id || p.id === id));
    setProjectToDelete(project);
    setDeleteModalOpen(true);
  };
  
  const confirmDelete = async () => {
    if (!projectToDelete || (!projectToDelete._id && !projectToDelete.id)) {
      toast.error('Invalid project data');
      return;
    }
    
    try {
      const projectId = projectToDelete._id || projectToDelete.id;
      console.log('Deleting project:', projectId);
      await deleteProject(projectId);
      toast.success('Project deleted successfully');
    } catch (error) {
      console.error('Error deleting project:', error);
      toast.error('Failed to delete project');
    } finally {
      setDeleteModalOpen(false);
      setProjectToDelete(null);
    }
  };

  // Add this helper function to count unique assignees
  const getUniqueAssigneesCount = (project) => {
    if (!project.tasks || project.tasks.length === 0) return 0;
    
    // Create a Set to track unique assignee IDs
    const uniqueAssignees = new Set();
    
    // Loop through all tasks and add assignee IDs to the set
    project.tasks.forEach(task => {
      if (task.assignee && task.assignee.id) {
        uniqueAssignees.add(task.assignee.id);
      }
    });
    
    return uniqueAssignees.size;
  };

  const handleEdit = (project) => {
    if (!project || (!project.id && !project._id)) {
      toast.error('Invalid project data');
      return;
    }
    console.log('Editing project:', project);
    setSelectedProject(project);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedProject(null);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedProject(null);
  };

  // Fixed getClientName function to handle the client object properly
  const getClientName = (clientData) => {
    if (!clientData) return 'N/A';
    
    // If clientData is already an object with name property, return it directly
    if (typeof clientData === 'object' && clientData.name) {
      return clientData.name;
    }
    
    // Otherwise, try to find the client by ID
    const clientId = clientData?.$oid || clientData;
    const client = clients.find(c => 
      (c._id?.$oid || c._id) === clientId || 
      (c.id?.$oid || c.id) === clientId
    );
    return client ? client.name : 'N/A';
  };

  // Enhanced status styling function
  const getStatusStyle = (status) => {
    const statusMap = {
      'completed': 'bg-gradient-to-r from-green-50 to-emerald-50 text-emerald-700 border border-emerald-200',
      'in_progress': 'bg-gradient-to-r from-blue-50 to-indigo-50 text-indigo-700 border border-indigo-200',
      'in-progress': 'bg-gradient-to-r from-blue-50 to-indigo-50 text-indigo-700 border border-indigo-200',
      'pending': 'bg-gradient-to-r from-yellow-50 to-amber-50 text-amber-700 border border-amber-200',
      'on_hold': 'bg-gradient-to-r from-orange-50 to-orange-50 text-orange-700 border border-orange-200',
      'cancelled': 'bg-gradient-to-r from-red-50 to-rose-50 text-red-700 border border-red-200',
      'planning': 'bg-gradient-to-r from-purple-50 to-violet-50 text-purple-700 border border-purple-200'
    };
    return statusMap[status] || 'bg-gradient-to-r from-gray-50 to-slate-50 text-gray-700 border border-gray-200';
  };

  const columns = useMemo(
    () => [
      {
        Header: 'Project Name',
        accessor: 'name',
        Cell: ({ value, row }) => (
          <button
            onClick={() => navigate(`/projects/details/${row.original._id || row.original.id}`)}
            className="group flex items-center space-x-1 text-left"
          >
            <div className="flex-shrink-0 w-1.5 h-1.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
            <span className="text-xs font-semibold text-gray-900 group-hover:text-blue-600 transition-colors duration-200 truncate">
              {value}
            </span>
          </button>
        )
      },
      {
        Header: 'Company',
        accessor: row => row.client?.company || 'N/A',
        Cell: ({ value }) => (
          <div className="flex items-center space-x-1">
            <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
              <span className="text-xs font-medium text-gray-600">
                {value && value !== 'N/A' ? value.charAt(0).toUpperCase() : '?'}
              </span>
            </div>
            <span className="text-xs font-medium text-gray-700 truncate">{value || 'N/A'}</span>
          </div>
        )
      },
      {
        Header: 'Client',
        accessor: 'client',
        Cell: ({ value }) => (
          <div className="flex items-center space-x-1">
            <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-full flex items-center justify-center">
              <UserGroupIcon className="w-3 h-3 text-blue-600" />
            </div>
            <span className="text-xs font-medium text-gray-700 truncate">{getClientName(value)}</span>
          </div>
        )
      },
      {
        Header: 'Start Date',
        accessor: 'startDate',
        Cell: ({ value }) => (
          <div className="flex items-center space-x-1">
            <div className="flex-shrink-0 w-1.5 h-1.5 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full"></div>
            <span className="text-xs font-medium text-gray-900">
              {new Date(value).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: '2-digit' 
              })}
            </span>
          </div>
        )
      },
      {
        Header: 'End Date',
        accessor: 'endDate',
        Cell: ({ value }) => (
          <div className="flex items-center space-x-1">
            <div className={`flex-shrink-0 w-1.5 h-1.5 rounded-full ${
              value ? 'bg-gradient-to-r from-red-400 to-rose-500' : 'bg-gradient-to-r from-gray-300 to-gray-400'
            }`}></div>
            <span className="text-xs font-medium text-gray-900">
              {value ? new Date(value).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: '2-digit' 
              }) : (
                <span className="text-gray-500 italic text-xs">Ongoing</span>
              )}
            </span>
          </div>
        )
      },
      {
        Header: 'Status',
        accessor: 'status',
        Cell: ({ value }) => (
          <span
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold shadow-sm ${getStatusStyle(value)}`}
          >
            <div className="w-1 h-1 rounded-full bg-current mr-1"></div>
            {value?.replace('_', ' ').replace('-', ' ').toUpperCase() || 'UNKNOWN'}
          </span>
        )
      },
      {
        Header: 'Project Manager',
        accessor: 'manager',
        Cell: ({ value }) => (
          <div className="flex items-center space-x-1">
            <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-purple-100 to-indigo-200 rounded-full flex items-center justify-center">
              <span className="text-xs font-medium text-purple-600">
                {value?.firstName?.[0] || value?.name?.[0] || '?'}
              </span>
            </div>
            <span className="text-xs font-medium text-gray-700 truncate">
              {value ? `${value.firstName || value.name} ${value.lastName || ''}`.trim() : 'Not Assigned'}
            </span>
          </div>
        )
      },
      {
        Header: 'Team',
        accessor: row => getUniqueAssigneesCount(row),
        Cell: ({ value }) => (
          <div className="flex items-center space-x-1">
            <div className="flex -space-x-1">
              {[...Array(Math.min(value, 3))].map((_, i) => (
                <div
                  key={i}
                  className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-300 to-gray-400 border-2 border-white flex items-center justify-center"
                >
                  <UserGroupIcon className="w-3 h-3 text-gray-600" />
                </div>
              ))}
              {value > 3 && (
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 border-2 border-white flex items-center justify-center">
                  <span className="text-xs font-semibold text-gray-600">+{value - 3}</span>
                </div>
              )}
            </div>
            <span className="text-xs font-medium text-gray-600">
              {value}
            </span>
          </div>
        )
      },
      {
        Header: 'Actions',
        Cell: ({ row }) => {
          const projectId = row.original._id || row.original.id;
          return (
            <div className="flex items-center space-x-1">
              <button
                onClick={() => navigate(`/projects/kanban/${projectId}`)}
                className="group p-1.5 rounded-lg hover:bg-blue-50 transition-all duration-200"
                title="View Kanban Board"
              >
                <Squares2X2Icon className="h-4 w-4 text-gray-400 group-hover:text-blue-600" />
              </button>
              
              <button
                onClick={() => handleEdit(row.original)}
                className="group p-1.5 rounded-lg hover:bg-gray-50 transition-all duration-200"
                title="Edit Project"
              >
                <PencilIcon className="h-4 w-4 text-gray-400 group-hover:text-gray-700" />
              </button>
              
              <button
                onClick={() => handleDelete(projectId)}
                className="group p-1.5 rounded-lg hover:bg-red-50 transition-all duration-200"
                title="Delete Project"
              >
                <TrashIcon className="h-4 w-4 text-gray-400 group-hover:text-red-600" />
              </button>
            </div>
          );
        }
      }
    ],
    [navigate, clients]
  );

  const data = useMemo(() => projects, [projects]);

  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    page,
    prepareRow,
    canPreviousPage,
    canNextPage,
    pageOptions,
    pageCount,
    gotoPage,
    nextPage,
    previousPage,
    setPageSize,
    state: { pageIndex, pageSize }
  } = useTable(
    {
      columns,
      data,
      initialState: { pageIndex: 0, pageSize: 10 }
    },
    usePagination
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-gradient-to-br from-gray-50 to-white">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600 mx-auto"></div>
          <p className="text-gray-500 font-medium">Loading projects...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8  min-h-screen">
        {/* Header Section */}
        <div className="">
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Projects
              </h1>
              <p className="text-gray-600">Manage and track all your projects in one place</p>
            </div>
            {canAddProjects && (
              <button
                onClick={handleAdd}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              >
                <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
                Add Project
              </button>
            )}
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div>
            <table className="w-full divide-y divide-gray-200" {...getTableProps()}>
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                {headerGroups.map(headerGroup => (
                  <tr {...headerGroup.getHeaderGroupProps()}>
                    {headerGroup.headers.map(column => (
                      <th
                        {...column.getHeaderProps()}
                        className="px-3 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider"
                      >
                        {column.render('Header')}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="bg-white divide-y divide-gray-100" {...getTableBodyProps()}>
                {page.map((row, index) => {
                  prepareRow(row);
                  return (
                    <tr 
                      {...row.getRowProps()} 
                      className={`hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                      }`}
                    >
                      {row.cells.map(cell => (
                        <td
                          {...cell.getCellProps()}
                          className="px-3 py-4 text-xs"
                        >
                          {cell.render('Cell')}
                        </td>
                      ))}
                    </tr>
                  );
                })}
                {projects.length === 0 && (
                  <tr>
                    <td
                      colSpan="8"
                      className="px-6 py-16 text-center"
                    >
                      <div className="space-y-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto">
                          <Squares2X2Icon className="w-8 h-8 text-gray-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">No projects found</h3>
                          <p className="text-gray-500 mt-1">Get started by creating your first project</p>
                        </div>
                        {canAddProjects && (
                          <button
                            onClick={handleAdd}
                            className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
                          >
                            <PlusIcon className="w-4 h-4 mr-2" />
                            Add Project
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Enhanced Pagination */}
          {page.length > 0 && (
            <div className="flex items-center justify-between border-t border-gray-200 bg-gradient-to-r from-gray-50 to-white px-6 py-4">
              <div className="flex flex-1 justify-between sm:hidden">
                <button
                  onClick={() => previousPage()}
                  disabled={!canPreviousPage}
                  className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    !canPreviousPage
                      ? 'text-gray-300 cursor-not-allowed bg-gray-100'
                      : 'text-gray-700 bg-white hover:bg-gray-50 shadow-sm border border-gray-200'
                  }`}
                >
                  <ChevronLeftIcon className="h-5 w-5 mr-1" />
                  Previous
                </button>
                <button
                  onClick={() => nextPage()}
                  disabled={!canNextPage}
                  className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                    !canNextPage
                      ? 'text-gray-300 cursor-not-allowed bg-gray-100'
                      : 'text-gray-700 bg-white hover:bg-gray-50 shadow-sm border border-gray-200'
                  }`}
                >
                  Next
                  <ChevronRightIcon className="h-5 w-5 ml-1" />
                </button>
              </div>
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div className="flex items-center space-x-4">
                  <p className="text-sm font-medium text-gray-700">
                    Showing page{' '}
                    <span className="font-bold text-blue-600">{pageIndex + 1}</span> of{' '}
                    <span className="font-bold text-blue-600">{pageOptions.length}</span>
                  </p>
                  <div className="text-sm text-gray-500">
                    ({projects.length} total projects)
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => previousPage()}
                    disabled={!canPreviousPage}
                    className={`relative inline-flex items-center px-3 py-2 rounded-lg transition-all duration-200 ${
                      !canPreviousPage
                        ? 'text-gray-300 cursor-not-allowed bg-gray-100'
                        : 'text-gray-700 bg-white hover:bg-gray-50 shadow-sm border border-gray-200 hover:shadow-md'
                    }`}
                  >
                    <ChevronLeftIcon className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => nextPage()}
                    disabled={!canNextPage}
                    className={`relative inline-flex items-center px-3 py-2 rounded-lg transition-all duration-200 ${
                      !canNextPage
                        ? 'text-gray-300 cursor-not-allowed bg-gray-100'
                        : 'text-gray-700 bg-white hover:bg-gray-50 shadow-sm border border-gray-200 hover:shadow-md'
                    }`}
                  >
                    <ChevronRightIcon className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <ProjectModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        project={selectedProject}
      />
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setProjectToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Delete Project"
        message={`Are you sure you want to delete ${projectToDelete?.name}? This action cannot be undone.`}
        itemName={projectToDelete?.name}
      />
    </>
  );
};

export default ProjectList;