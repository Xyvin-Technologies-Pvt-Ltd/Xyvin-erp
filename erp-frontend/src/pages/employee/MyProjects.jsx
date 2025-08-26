import { useState, useEffect } from "react";
import {
  PencilIcon,
  TrashIcon,
  PlusIcon,
  UserGroupIcon,
  Squares2X2Icon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { useProjectStore } from "@/stores/projectStore";
import { useClientStore } from "@/stores/clientStore";
import { toast } from "react-hot-toast";
import ProjectModal from "@/components/modules/ProjectModal";
import { useNavigate } from "react-router-dom";
import { useTable, usePagination } from "react-table";
import { useMemo } from "react";
import useHrmStore from "@/stores/useHrmStore";
const MyProjects = () => {
  const navigate = useNavigate();
  const { projects, fetchProjects, deleteProject } = useProjectStore();
  const { updateTaskViwed } = useHrmStore();
  const { clients, fetchClients } = useClientStore();
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);

  // Get user data from local storage
  useEffect(() => {
    try {
      const userData = localStorage.getItem("user");
      if (userData) {
        const parsedUserData = JSON.parse(userData);
        setCurrentUser(parsedUserData);
        console.log("Current user:", parsedUserData);
      }
    } catch (error) {
      console.error("Error getting user data from local storage:", error);
    }
  }, []);

  useEffect(() => {
    updateTaskViwed();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [projectsData, clientsData] = await Promise.all([
          fetchProjects(),
          fetchClients(),
        ]);
        console.log("Loaded projects:", projectsData);
        console.log("Loaded clients:", clientsData);
      } catch (error) {
        console.error("Error loading data:", error);
        toast.error("Failed to load data");
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, [fetchProjects, fetchClients]);

  useEffect(() => {
    if (projects.length > 0 && currentUser) {
      console.log("Debug - First project structure:", projects[0]);
      console.log("Debug - First project tasks:", projects[0].tasks);
      if (projects[0].tasks && projects[0].tasks.length > 0) {
        console.log(
          "Debug - First task assignee:",
          projects[0].tasks[0].assignee
        );
      }

      // Filter projects where the current user is assigned to at least one task
      const myProjects = projects.filter((project) => {
        return (
          project.tasks &&
          project.tasks.some(
            (task) => task.assignee && task.assignee.id === currentUser.id
          )
        );
      });

      console.log("Debug - Filtered my projects:", myProjects.length);
      setFilteredProjects(myProjects);
    } else {
      setFilteredProjects([]);
    }
  }, [projects, currentUser]);

  const handleDelete = async (id) => {
    if (!id) {
      toast.error("Project ID is missing");
      return;
    }

    if (window.confirm("Are you sure you want to delete this project?")) {
      try {
        console.log("Deleting project:", id);
        await deleteProject(id);
        toast.success("Project deleted successfully");
      } catch (error) {
        console.error("Error deleting project:", error);
        toast.error("Failed to delete project");
      }
    }
  };

  const handleEdit = (project) => {
    if (!project || (!project.id && !project._id)) {
      toast.error("Invalid project data");
      return;
    }
    console.log("Editing project:", project);
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

  const getClientName = (clientObj) => {
    if (!clientObj) return "N/A";
    // Handle if client is just a reference ID
    if (typeof clientObj === "string") {
      const client = clients.find(
        (c) => c._id === clientObj || c.id === clientObj
      );
      return client ? client.name : "N/A";
    }
    // Handle if client is an object containing name
    return clientObj.name || "N/A";
  };

  const countMyTasks = (projectTasks) => {
    if (!currentUser || !projectTasks || !Array.isArray(projectTasks)) return 0;

    return projectTasks.filter(
      (task) => task.assignee && task.assignee.id === currentUser.id
    ).length;
  };

  const columns = useMemo(
    () => [
      {
        Header: "Name",
        accessor: "name",
        Cell: ({ value }) => (
          <span className="text-sm font-medium text-gray-900">{value}</span>
        ),
      },
      {
        Header: "Client",
        accessor: (row) => getClientName(row.client),
        Cell: ({ value }) => (
          <span className="text-sm text-gray-500">{value}</span>
        ),
      },
      {
        Header: "Start Date",
        accessor: "startDate",
        Cell: ({ value }) => (
          <span className="text-sm text-gray-500">
            {value ? new Date(value).toLocaleDateString() : "N/A"}
          </span>
        ),
      },
      {
        Header: "End Date",
        accessor: "endDate",
        Cell: ({ value }) => (
          <span className="text-sm text-gray-500">
            {value ? new Date(value).toLocaleDateString() : "Ongoing"}
          </span>
        ),
      },
      {
        Header: "Status",
        accessor: "status",
        Cell: ({ value }) => (
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
              value === "completed"
                ? "bg-green-100 text-green-800"
                : value === "in_progress" || value === "in-progress"
                ? "bg-blue-100 text-blue-800"
                : value === "on-hold"
                ? "bg-yellow-100 text-yellow-800"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            {value?.replace(/[-_]/g, " ").toUpperCase() || "N/A"}
          </span>
        ),
      },
      {
        Header: "My Tasks",
        accessor: (row) => countMyTasks(row.tasks),
        Cell: ({ value }) => (
          <span className="text-sm text-gray-500">{value} tasks</span>
        ),
      },
      {
        Header: "Actions",
        Cell: ({ row }) => {
          const projectId = row.original._id || row.original.id;
          return (
            <div className="flex space-x-2">
              <button
                onClick={() =>
                  navigate(`/employee/projects/kanban/${projectId}`)
                }
                className="text-black hover:text-gray-800"
                title="View Kanban Board"
              >
                <Squares2X2Icon className="h-5 w-5" aria-hidden="true" />
              </button>
            </div>
          );
        },
      },
    ],
    [navigate, clients, currentUser]
  );

  const data = useMemo(() => filteredProjects, [filteredProjects]);

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
    state: { pageIndex, pageSize },
  } = useTable(
    {
      columns,
      data,
      initialState: { pageIndex: 0, pageSize: 10 },
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
          <h1 className="text-2xl font-semibold text-gray-900">My Projects</h1>
          {/* <button
            onClick={handleAdd}
            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Add Project
          </button> */}
        </div>

        <div className="bg-white shadow-sm ring-1 ring-gray-900/5 sm:rounded-xl md:col-span-2">
          <div className="overflow-x-auto">
            <table
              className="min-w-full divide-y divide-gray-200"
              {...getTableProps()}
            >
              <thead className="bg-gray-50">
                {headerGroups.map((headerGroup) => (
                  <tr {...headerGroup.getHeaderGroupProps()}>
                    {headerGroup.headers.map((column) => (
                      <th
                        {...column.getHeaderProps()}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {column.render("Header")}
                      </th>
                    ))}
                  </tr>
                ))}
              </thead>
              <tbody
                className="bg-white divide-y divide-gray-200"
                {...getTableBodyProps()}
              >
                {page.map((row) => {
                  prepareRow(row);
                  return (
                    <tr {...row.getRowProps()} className="hover:bg-gray-50">
                      {row.cells.map((cell) => (
                        <td
                          {...cell.getCellProps()}
                          className="px-6 py-4 whitespace-nowrap"
                        >
                          {cell.render("Cell")}
                        </td>
                      ))}
                    </tr>
                  );
                })}
                {filteredProjects.length === 0 && (
                  <tr>
                    <td
                      colSpan="7"
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center"
                    >
                      {currentUser
                        ? "You don't have any projects assigned to you."
                        : "Loading your projects..."}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
            <div className="flex flex-1 justify-between sm:hidden">
              <button
                onClick={() => previousPage()}
                disabled={!canPreviousPage}
                className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                  !canPreviousPage
                    ? "text-gray-300 cursor-not-allowed"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <ChevronLeftIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => nextPage()}
                disabled={!canNextPage}
                className={`relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md ${
                  !canNextPage
                    ? "text-gray-300 cursor-not-allowed"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <ChevronRightIcon className="h-5 w-5" />
              </button>
            </div>
            <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing page{" "}
                  <span className="font-medium">{pageIndex + 1}</span> of{" "}
                  <span className="font-medium">{pageOptions.length}</span>
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => previousPage()}
                  disabled={!canPreviousPage}
                  className={`relative inline-flex items-center px-2 py-2 rounded-md ${
                    !canPreviousPage
                      ? "text-gray-300 cursor-not-allowed"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <ChevronLeftIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => nextPage()}
                  disabled={!canNextPage}
                  className={`relative inline-flex items-center px-2 py-2 rounded-md ${
                    !canNextPage
                      ? "text-gray-300 cursor-not-allowed"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <ChevronRightIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <ProjectModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        project={selectedProject}
      />
    </>
  );
};

export default MyProjects;
