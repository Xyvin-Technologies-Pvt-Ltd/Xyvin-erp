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

  // Memoize columns to prevent unnecessary re-renders
  const columns = useMemo(
    () => [
      {
        Header: "Employee ID",
        accessor: "employeeId",
      },
      {
        Header: "Name",
        accessor: (row) => `${row.firstName} ${row.lastName}`,
      },
      {
        Header: "Email",
        accessor: "email",
      },
      {
        Header: "Department",
        accessor: "department.name",
      },
      {
        Header: "Position",
        accessor: "position.title",
      },
      {
        Header: "Status",
        accessor: "status",
        Cell: ({ value }) => {
          const statusColors = {
            active: "bg-green-100 text-green-800",
            inactive: "bg-red-100 text-red-800",
            on_leave: "bg-yellow-100 text-yellow-800",
            suspended: "bg-orange-100 text-orange-800",
          };

          return (
            <span
              className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                statusColors[value?.toLowerCase()] ||
                "bg-gray-100 text-gray-800"
              }`}
            >
              {value?.charAt(0).toUpperCase() + value?.slice(1) || "Unknown"}
            </span>
          );
        },
      },
      {
        Header: "Actions",
        Cell: ({ row }) => {
          const employeeId = row.original.id || row.original._id;
          const isViewing = viewingEmployee === employeeId;

          return (
            <div className="flex space-x-2">
              <button
                onClick={() => handleViewDocuments(row.original)}
                className="text-gray-600 hover:text-gray-900"
                title={isViewing ? "Close Documents" : "View Documents"}
              >
                {isViewing ? (
                  <EyeIcon className="h-5 w-5" />
                ) : (
                  <EyeSlashIcon className="h-5 w-5" />
                )}
              </button>
              <button
                onClick={() => handleEdit(row.original)}
                className="text-blue-600 hover:text-blue-900"
                title="Edit Employee"
              >
                <PencilIcon className="h-5 w-5" />
              </button>
              <button
                onClick={() => handleDeleteClick(row.original)}
                className="text-red-600 hover:text-red-900"
                title="Delete Employee"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            </div>
          );
        },
      },
    ],
    [viewingEmployee]
  );

  // Memoize data and ensure it's always an array
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
      <div className="flex h-full items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  if (employeesError) {
    return (
      <div className="flex h-full items-center justify-center text-red-600">
        {employeesError}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Employees</h2>
        <button
          onClick={() => {
            setSelectedEmployee(null);
            setShowModal(true);
          }}
          className="btn btn-primary inline-flex items-center"
        >
          <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
          Add Employee
        </button>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-block min-w-full align-middle">
          <table
            className="min-w-full divide-y divide-gray-300"
            {...getTableProps()}
          >
            <thead>
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
                          className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                        >
                          <div className="group inline-flex">
                            {column.render("Header")}
                            <span className="ml-2 flex-none rounded">
                              {column.isSorted ? (
                                column.isSortedDesc ? (
                                  <ChevronDownIcon className="h-5 w-5" />
                                ) : (
                                  <ChevronUpIcon className="h-5 w-5" />
                                )
                              ) : null}
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
              className="divide-y divide-gray-200 bg-white"
              {...getTableBodyProps()}
            >
              {page.map((row) => {
                prepareRow(row);
                const { key, ...rowProps } = row.getRowProps();
                return (
                  <tr key={key} {...rowProps}>
                    {row.cells.map((cell) => {
                      const { key, ...cellProps } = cell.getCellProps();
                      return (
                        <td
                          key={key}
                          {...cellProps}
                          className="whitespace-nowrap px-3 py-4 text-sm text-gray-500"
                        >
                          {cell.render("Cell")}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between border-t border-gray-200 bg-white px-4 py-3 sm:px-6">
        <div className="flex flex-1 justify-between sm:hidden">
          <button
            onClick={() => previousPage()}
            disabled={!canPreviousPage}
            className="btn btn-secondary inline-flex items-center"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <button
            onClick={() => nextPage()}
            disabled={!canNextPage}
            className="btn btn-secondary inline-flex items-center"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-gray-700">
              Showing page <span className="font-medium">{pageIndex + 1}</span>{" "}
              of <span className="font-medium">{pageOptions.length}</span>
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => previousPage()}
              disabled={!canPreviousPage}
              className="btn btn-icon btn-secondary"
              title="Previous Page"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => nextPage()}
              disabled={!canNextPage}
              className="btn btn-icon btn-secondary"
              title="Next Page"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>
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
    </div>
  );
};

export default Employees;
