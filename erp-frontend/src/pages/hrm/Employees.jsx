import { useEffect, useState, useMemo } from "react";
import { useTable, useSortBy, usePagination } from "react-table";
import { toast } from "react-hot-toast";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  EyeIcon,
  EyeSlashIcon,
  UserIcon,
  BuildingOfficeIcon,
} from "@heroicons/react/24/outline";
import useHrmStore from "../../stores/useHrmStore";
import EmployeeModal from "../../components/modules/hrm/EmployeeModal";
import DeleteConfirmationModal from "../../components/common/DeleteConfirmationModal";
import ViewDocumentsModal from "../../components/modules/hrm/ViewDocumentsModal";

const Employees = () => {
  const [showModal, setShowModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showDocumentsModal, setShowDocumentsModal] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState([]);
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    employee: null,
  });
  const [viewingEmployee, setViewingEmployee] = useState(null);
  const { employees, employeesLoading, employeesError, fetchEmployees, deleteEmployee, fetchEmployeeDocuments } =
    useHrmStore();

  useEffect(() => {
    fetchEmployees();
  }, [fetchEmployees]);

  const columns = useMemo(
    () => [
      {
        Header: "Employee ID",
        accessor: "employeeId",
        Cell: ({ value }) => (
          <div className="flex items-center space-x-1">
            <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
              <span className="text-xs font-bold text-gray-600">
                {value ? value.charAt(0).toUpperCase() : '?'}
              </span>
            </div>
            <span className="text-xs font-medium text-gray-700 truncate">{value || 'N/A'}</span>
          </div>
        )
      },
      {
        Header: "Name",
        accessor: (row) => `${row.firstName} ${row.lastName}`,
        Cell: ({ value }) => (
          <div className="flex items-center space-x-1">
            <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-full flex items-center justify-center">
              <UserIcon className="w-3 h-3 text-blue-600" />
            </div>
            <span className="text-xs font-semibold text-gray-900 truncate">{value}</span>
          </div>
        )
      },
      {
        Header: "Email",
        accessor: "email",
        Cell: ({ value }) => (
          <div className="flex items-center space-x-1">
            <div className="flex-shrink-0 w-1.5 h-1.5 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full"></div>
            <span className="text-xs font-medium text-gray-700 truncate">{value}</span>
          </div>
        )
      },
      {
        Header: "Department",
        accessor: "department.name",
        Cell: ({ value }) => (
          <div className="flex items-center space-x-1">
            <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-green-100 to-emerald-200 rounded-full flex items-center justify-center">
              <BuildingOfficeIcon className="w-3 h-3 text-green-600" />
            </div>
            <span className="text-xs font-medium text-gray-700 truncate">{value || 'N/A'}</span>
          </div>
        )
      },
      {
        Header: "Position",
        accessor: "position.title",
        Cell: ({ value }) => (
          <div className="flex items-center space-x-1">
            <div className="w-1.5 h-1.5 bg-gradient-to-r from-yellow-500 to-amber-500 rounded-full"></div>
            <span className="text-xs font-medium text-gray-700 truncate">{value || 'N/A'}</span>
          </div>
        )
      },
      {
        Header: "Status",
        accessor: "status",
        Cell: ({ value }) => (
          <span
            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold shadow-sm ${
              value?.toLowerCase() === 'active'
                ? "bg-gradient-to-r from-green-50 to-emerald-50 text-emerald-700 border border-emerald-200"
                : value?.toLowerCase() === 'inactive'
                ? "bg-gradient-to-r from-red-50 to-rose-50 text-red-700 border border-red-200"
                : value?.toLowerCase() === 'on_leave'
                ? "bg-gradient-to-r from-yellow-50 to-amber-50 text-amber-700 border border-amber-200"
                : "bg-gradient-to-r from-gray-50 to-slate-50 text-gray-700 border border-gray-200"
            }`}
          >
            <div className="w-1 h-1 rounded-full bg-current mr-1"></div>
            {value?.toUpperCase() || "UNKNOWN"}
          </span>
        ),
      },
      {
        Header: "Actions",
        Cell: ({ row }) => {
          const employeeId = row.original.id || row.original._id;
          const isViewing = viewingEmployee === employeeId;

          return (
            <div className="flex items-center space-x-1">
              <button
                onClick={() => handleViewDocuments(row.original)}
                className="group p-1.5 rounded-lg hover:bg-blue-50 transition-all duration-200"
                title={isViewing ? "Close Documents" : "View Documents"}
              >
                {isViewing ? (
                  <EyeIcon className="h-4 w-4 text-gray-400 group-hover:text-blue-600" />
                ) : (
                  <EyeSlashIcon className="h-4 w-4 text-gray-400 group-hover:text-blue-600" />
                )}
              </button>
              <button
                onClick={() => handleEdit(row.original)}
                className="group p-1.5 rounded-lg hover:bg-gray-50 transition-all duration-200"
                title="Edit Employee"
              >
                <PencilIcon className="h-4 w-4 text-gray-400 group-hover:text-gray-700" />
              </button>
              <button
                onClick={() => handleDeleteClick(row.original)}
                className="group p-1.5 rounded-lg hover:bg-red-50 transition-all duration-200"
                title="Delete Employee"
              >
                <TrashIcon className="h-4 w-4 text-gray-400 group-hover:text-red-600" />
              </button>
            </div>
          );
        },
      },
    ],
    [viewingEmployee]
  );

  const data = useMemo(() => {
    return Array.isArray(employees) ? employees : [];
  }, [employees]);

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
    useSortBy,
    usePagination
  );

  const handleEdit = (employee) => {
    setSelectedEmployee(employee);
    setShowModal(true);
  };

  const handleViewDocuments = async (employee) => {
    try {
      const employeeId = employee.id || employee._id;
      const documents = await fetchEmployeeDocuments(employeeId);
      setSelectedEmployee(employee);
      setSelectedDocuments(documents);
      setShowDocumentsModal(true);
      setViewingEmployee(employeeId);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast.error('Failed to fetch documents');
    }
  };

  const handleDeleteClick = (employee) => {
    setDeleteModal({ isOpen: true, employee });
  };

  const handleDelete = async () => {
    try {
      const id = deleteModal.employee.id || deleteModal.employee._id;
      await deleteEmployee(id);
      toast.success("Employee deleted successfully");
      fetchEmployees();
      setDeleteModal({ isOpen: false, employee: null });
    } catch (error) {
      console.error("Error deleting employee:", error);
      toast.error(error.response?.data?.message || "Failed to delete employee");
    }
  };

  if (employeesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-gradient-to-br from-gray-50 to-white">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600 mx-auto"></div>
          <p className="text-gray-500 font-medium">Loading employees...</p>
        </div>
      </div>
    );
  }

  if (employeesError) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-gradient-to-br from-red-50 to-white">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center mx-auto">
            <span className="text-red-600 text-2xl">⚠</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-red-900">Error Loading Employees</h3>
            <p className="text-red-600 mt-1">{employeesError}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-8 min-h-screen">
        {/* Header Section */}
        <div className="">
          <div className="flex justify-between items-center">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                Employees
              </h1>
              <p className="text-gray-600">Manage and organize all your company employees</p>
            </div>
            <button
              onClick={() => {
                setSelectedEmployee(null);
                setShowModal(true);
              }}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
              Add Employee
            </button>
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div>
            <table
              className="w-full divide-y divide-gray-200"
              {...getTableProps()}
            >
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                {headerGroups.map((headerGroup) => {
                  const { key, ...headerGroupProps } =
                    headerGroup.getHeaderGroupProps();
                  return (
                    <tr key={key} {...headerGroupProps}>
                      {headerGroup.headers.map((column) => {
                        const { key, ...columnProps } = column.getHeaderProps(
                          column.getSortByToggleProps()
                        );
                        return (
                          <th
                            key={key}
                            {...columnProps}
                            className="px-3 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-200"
                          >
                            <div className="group inline-flex items-center">
                              {column.render("Header")}
                              <span className="ml-2 flex-none rounded">
                                {column.isSorted ? (
                                  column.isSortedDesc ? (
                                    <ChevronDownIcon className="h-4 w-4 text-gray-400" />
                                  ) : (
                                    <ChevronUpIcon className="h-4 w-4 text-gray-400" />
                                  )
                                ) : (
                                  <ChevronUpIcon className="h-4 w-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                                )}
                              </span>
                            </div>
                          </th>
                        );
                      })}
                    </tr>
                  );
                })}
              </thead>
              <tbody
                className="bg-white divide-y divide-gray-100"
                {...getTableBodyProps()}
              >
                {page.map((row, index) => {
                  prepareRow(row);
                  const { key, ...rowProps } = row.getRowProps();
                  return (
                    <tr 
                      key={key} 
                      {...rowProps}
                      className={`hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200 ${
                        index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'
                      }`}
                    >
                      {row.cells.map((cell) => {
                        const { key, ...cellProps } = cell.getCellProps();
                        return (
                          <td
                            key={key}
                            {...cellProps}
                            className="px-3 py-4 text-xs"
                          >
                            {cell.render("Cell")}
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
                {data.length === 0 && (
                  <tr>
                    <td
                      colSpan="7"
                      className="px-6 py-16 text-center"
                    >
                      <div className="space-y-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto">
                          <UserIcon className="w-8 h-8 text-gray-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">No employees found</h3>
                          <p className="text-gray-500 mt-1">Get started by adding your first employee</p>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedEmployee(null);
                            setShowModal(true);
                          }}
                          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
                        >
                          <PlusIcon className="w-4 h-4 mr-2" />
                          Add Employee
                        </button>
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
                    ({data.length} total employees)
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

      {/* Employee Modal */}
      {showModal && (
        <EmployeeModal
          employee={selectedEmployee}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            fetchEmployees();
          }}
        />
      )}

      {/* Documents Modal */}
      <ViewDocumentsModal
        isOpen={showDocumentsModal}
        onClose={() => {
          setShowDocumentsModal(false);
          setSelectedEmployee(null);
          setSelectedDocuments([]);
          setViewingEmployee(null);
        }}
        documents={selectedDocuments}
        employeeId={selectedEmployee?._id || selectedEmployee?.id}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, employee: null })}
        onConfirm={handleDelete}
        title="Delete Employee"
        message={`Are you sure you want to delete ${deleteModal.employee?.firstName} ${deleteModal.employee?.lastName}? This action cannot be undone.`}
        itemName="employee"
      />
    </>
  );
};

export default Employees;
