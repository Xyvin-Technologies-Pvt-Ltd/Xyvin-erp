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
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import useHrmStore from "../../stores/useHrmStore";
import LeaveModal from "../../components/modules/hrm/LeaveModal";
import DeleteConfirmationModal from "../../components/common/DeleteConfirmationModal";

const Leave = () => {
  const [showModal, setShowModal] = useState(false);
  const [selectedLeave, setSelectedLeave] = useState(null);
  const { leaves, leavesLoading, leavesError, fetchLeaves, deleteLeave } = useHrmStore();
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    leave: null,
  });

  useEffect(() => {
    console.log("Leaves state:", leaves); // Debug log
    fetchLeaves();
  }, [fetchLeaves]);

  const getStatusIcon = (status) => {
    switch (status) {
      case "Approved":
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
      case "Rejected":
        return <XCircleIcon className="h-5 w-5 text-red-600" />;
      case "Pending":
        return <ClockIcon className="h-5 w-5 text-yellow-600" />;
      default:
        return <ClockIcon className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Approved":
        return "bg-green-100 text-green-800";
      case "Rejected":
        return "bg-red-100 text-red-800";
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const columns = useMemo(
    () => [
      {
        Header: "Employee",
        accessor: (row) => {
          if (!row.employee) return "N/A";
          return (
            `${row.employee.firstName || ""} ${
              row.employee.lastName || ""
            }`.trim() || "N/A"
          );
        },
      },
      {
        Header: "Type",
        accessor: "type",
        Cell: ({ value }) =>
          value?.charAt(0).toUpperCase() + value?.slice(1) || "N/A",
      },
      {
        Header: "Start Date",
        accessor: "startDate",
        Cell: ({ value }) =>
          value ? new Date(value).toLocaleDateString() : "N/A",
      },
      {
        Header: "End Date",
        accessor: "endDate",
        Cell: ({ value }) =>
          value ? new Date(value).toLocaleDateString() : "N/A",
      },
      {
        Header: "Days",
        accessor: "days",
        Cell: ({ value }) => value || "N/A",
      },
      {
        Header: "Status",
        accessor: "status",
        Cell: ({ value }) => (
          <div
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(
              value
            )}`}
          >
            {getStatusIcon(value)}
            <span className="ml-1">{value}</span>
          </div>
        ),
      },
      {
        Header: "Actions",
        Cell: ({ row }) => (
          <div className="flex space-x-2">
            <button
              onClick={() => handleEdit(row.original)}
              className="text-blue-600 hover:text-blue-900"
            >
              <PencilIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => handleDeleteClick(row.original._id)}
              className="text-red-600 hover:text-red-900"
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
    if (!Array.isArray(leaves)) {
      console.log("Leaves is not an array:", leaves); // Debug log
      return [];
    }
    return leaves.map((leave) => ({
      ...leave,
      employee: leave.employee || null,
      type: leave.leaveType || "",
      startDate: leave.startDate || null,
      endDate: leave.endDate || null,
      days: leave.duration || 0,
      status: leave.status || "pending",
    }));
  }, [leaves]);

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

  const handleEdit = (leave) => {
    setSelectedLeave(leave);
    setShowModal(true);
  };

  const handleDeleteClick = (leaveId) => {
    setDeleteModal({ isOpen: true, leaveId });
  };

  const handleDelete = async (id) => {
    try {
      await deleteLeave(id);
      toast.success("Leave request deleted successfully");
      fetchLeaves();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to delete leave request"
      );
    }
  };

  if (leavesLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  if (leavesError) {
    return (
      <div className="flex h-full items-center justify-center text-red-600">
        {leavesError}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Leave Requests</h2>
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
              {page.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-3 py-4 text-center text-gray-500"
                  >
                    No leave requests found.
                  </td>
                </tr>
              ) : (
                page.map((row) => {
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
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

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

      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, leaveId: null })}
        onConfirm={() => {
          handleDelete(deleteModal.leaveId);
          setDeleteModal({ isOpen: false, leaveId: null });
        }}
        title="Delete Leave Request"
        message="Are you sure you want to delete this leave request? This action cannot be undone."
        itemName="leave request"
      />

      {showModal && (
        <LeaveModal
          leave={selectedLeave}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            fetchLeaves();
          }}
        />
      )}
    </div>
  );
};

export default Leave;