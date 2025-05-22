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
} from "@heroicons/react/24/outline";
import useHrmStore from "../../stores/useHrmStore";
import DepartmentModal from "../../components/modules/hrm/DepartmentModal";
import DeleteConfirmationModal from "../../components/common/DeleteConfirmationModal";

const Departments = () => {
  const [showModal, setShowModal] = useState(false);
  const [selectedDepartment, setSelectedDepartment] = useState(null);
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    department: null,
  });
  const {
    departments,
    departmentsLoading,
    departmentsError,
    fetchDepartments,
    deleteDepartment,
  } = useHrmStore();

  useEffect(() => {
    fetchDepartments();
  }, [fetchDepartments]);

  const columns = useMemo(
    () => [
      {
        Header: "Name",
        accessor: "name",
      },
      {
        Header: "Code",
        accessor: "code",
      },
      {
        Header: "Location",
        accessor: "location",
      },
      {
        Header: "Manager",
        accessor: (row) =>
          row.manager
            ? `${row.manager.firstName} ${row.manager.lastName}`
            : "Not Assigned",
      },
      {
        Header: "Status",
        accessor: "isActive",
        Cell: ({ value }) => (
          <span
            className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
              value ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
            }`}
          >
            {value ? "Active" : "Inactive"}
          </span>
        ),
      },
      {
        Header: "Actions",
        Cell: ({ row }) => (
          <div className="flex space-x-2">
            <button
              onClick={() => handleEdit(row.original)}
              className="text-blue-600 hover:text-blue-900"
              title="Edit Department"
            >
              <PencilIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => handleDeleteClick(row.original)}
              className="text-red-600 hover:text-red-900"
              title="Delete Department"
            >
              <TrashIcon className="h-5 w-5" />
            </button>
          </div>
        ),
      },
    ],
    []
  );

  const data = useMemo(() => {
    return Array.isArray(departments) ? departments : [];
  }, [departments]);

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

  const handleEdit = (department) => {
    setSelectedDepartment(department);
    setShowModal(true);
  };

  const handleDeleteClick = (department) => {
    setDeleteModal({ isOpen: true, department });
  };

  const handleDelete = async () => {
    try {
      const id = deleteModal.department.id || deleteModal.department._id;
      await deleteDepartment(id);
      toast.success("Department deleted successfully");
      fetchDepartments();
      setDeleteModal({ isOpen: false, department: null });
    } catch (error) {
      console.error("Error deleting department:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to delete department";
      toast.error(errorMessage);
      if (error.response?.status === 400) {
        toast.error("Cannot delete department with active employees");
      }
    }
  };

  if (departmentsLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  if (departmentsError) {
    return (
      <div className="flex h-full items-center justify-center text-red-600">
        {departmentsError}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Departments</h2>
        <button
          onClick={() => {
            setSelectedDepartment(null);
            setShowModal(true);
          }}
          className="btn btn-primary inline-flex items-center"
        >
          <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
          Add Department
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

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, department: null })}
        onConfirm={handleDelete}
        title="Delete Department"
        message={`Are you sure you want to delete the department "${deleteModal.department?.name}"? This action cannot be undone.`}
        itemName="department"
      />

      {/* Department Modal */}
      {showModal && (
        <DepartmentModal
          department={selectedDepartment}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            fetchDepartments();
          }}
        />
      )}
    </div>
  );
};

export default Departments;
