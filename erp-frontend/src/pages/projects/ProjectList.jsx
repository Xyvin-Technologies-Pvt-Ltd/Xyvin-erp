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

const ProjectList = () => {
  const navigate = useNavigate();
  const { projects, fetchProjects, deleteProject } = useProjectStore();
  const { clients, fetchClients } = useClientStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [projectToDelete, setProjectToDelete] = useState(null); 
const [tableData, setTableData] = useState([]);

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

  const getClientName = (clientId) => {
    if (!clientId) return 'N/A';
    // Handle both string ID and ObjectId formats
    const normalizedClientId = clientId?.$oid || clientId;
    const client = clients.find(c => 
      (c._id?.$oid || c._id) === normalizedClientId || 
      (c.id?.$oid || c.id) === normalizedClientId
    );
    return client ? client.name : 'N/A';
  };

  const columns = useMemo(
    () => [
      {
        Header: 'Name',
        accessor: 'name',
        Cell: ({ value, row }) => (
          <button
            onClick={() => navigate(`/projects/details/${row.original._id || row.original.id}`)}
            className="text-sm font-medium text-gray-900 hover:text-primary-600"
          >
            {value}
          </button>
        )
      },
      {
        Header: 'Company',
        accessor: row => row.client?.company || 'N/A',
        Cell: ({ value }) => (
          <span className="text-sm text-gray-500">{value || 'N/A'}</span>
        )
      },
      {
        Header: 'Client',
        accessor: 'client',
        Cell: ({ value }) => (
          <span className="text-sm text-gray-500">{getClientName(value)}</span>
        )
      },
      {
        Header: 'Start Date',
        accessor: 'startDate',
        Cell: ({ value }) => (
          <span className="text-sm text-gray-500">
            {new Date(value).toLocaleDateString()}
          </span>
        )
      },
      {
        Header: 'End Date',
        accessor: 'endDate',
        Cell: ({ value }) => (
          <span className="text-sm text-gray-500">
            {value ? new Date(value).toLocaleDateString() : 'Ongoing'}
          </span>
        )
      },
      {
        Header: 'Status',
        accessor: 'status',
        Cell: ({ value }) => (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              value === 'completed'
                ? 'bg-green-100 text-green-800'
                : value === 'in_progress'
                ? 'bg-blue-100 text-blue-800'
                : 'bg-yellow-100 text-yellow-800'
            }`}
          >
            {value.replace('_', ' ').toUpperCase()}
          </span>
        )
      },
      {
        Header: 'Team Size',
        accessor: row => getUniqueAssigneesCount(row),
        Cell: ({ value }) => (
          <span className="text-sm text-gray-500">{value} members</span>
        )
      },
      {
        Header: 'Actions',
        Cell: ({ row }) => {
          const projectId = row.original._id || row.original.id;
          return (
            <div className="flex space-x-2">
              <button
                onClick={() => navigate(`/projects/kanban/${projectId}`)}
                className="text-black hover:text-gray-800"
                title="View Kanban Board"
              >
                <Squares2X2Icon className="h-5 w-5" aria-hidden="true" />
              </button>
              
              <button
                onClick={() => handleEdit(row.original)}
                className="text-black hover:text-gray-800"
                title="Edit Project"
              >
                <PencilIcon className="h-5 w-5" aria-hidden="true" />
              </button>
              <button
                onClick={() => handleDelete(projectId)}
                className="text-red-600 hover:text-red-900"
                title="Delete Project"
              >
                <TrashIcon className="h-5 w-5" aria-hidden="true" />
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
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-900">Projects</h1>
          <button
            onClick={handleAdd}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Add Project
          </button>
        </div>

        <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl md:col-span-2">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200" {...getTableProps()}>
              <thead className="bg-gray-50">
                {headerGroups.map(headerGroup => (
                  <tr {...headerGroup.getHeaderGroupProps()}>
                    {headerGroup.headers.map(column => (
                      <th
                        {...column.getHeaderProps()}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {column.render('Header')}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody className="bg-white divide-y divide-gray-200" {...getTableBodyProps()}>
                {page.map(row => {
                  prepareRow(row);
                  return (
                    <tr {...row.getRowProps()} className="hover:bg-gray-50">
                      {row.cells.map(cell => (
                        <td
                          {...cell.getCellProps()}
                          className="px-6 py-4 whitespace-nowrap"
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
                      colSpan="7"
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center"
                    >
                      No projects found. Add a new project to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
           {page.length > 0 && (
          <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
            <div className="flex flex-1 justify-between sm:hidden">
              <button
                onClick={() => previousPage()}
                disabled={!canPreviousPage}
                className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                  !canPreviousPage
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => nextPage()}
                disabled={!canNextPage}
                className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                  !canNextPage
                    ? 'text-gray-300 cursor-not-allowed'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing page{' '}
                  <span className="font-medium">{pageIndex + 1}</span> of{' '}
                  <span className="font-medium">{pageOptions.length}</span>
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => previousPage()}
                  disabled={!canPreviousPage}
                  className={`relative inline-flex items-center px-2 py-2 rounded-md ${
                    !canPreviousPage
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <ChevronLeftIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => nextPage()}
                  disabled={!canNextPage}
                  className={`relative inline-flex items-center px-2 py-2 rounded-md ${
                    !canNextPage
                      ? 'text-gray-300 cursor-not-allowed'
                      : 'text-gray-700 hover:bg-gray-50'
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