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
  CalendarDaysIcon,
  UserIcon,
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
        return <CheckCircleIcon className="h-4 w-4 text-green-600" />;
      case "Rejected":
        return <XCircleIcon className="h-4 w-4 text-red-600" />;
      case "Pending":
        return <ClockIcon className="h-4 w-4 text-yellow-600" />;
      default:
        return <ClockIcon className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getStatusStyle = (status) => {
    const statusMap = {
      'Approved': 'bg-gradient-to-r from-green-50 to-emerald-50 text-emerald-700 border border-emerald-200',
      'Rejected': 'bg-gradient-to-r from-red-50 to-rose-50 text-red-700 border border-red-200',
      'Pending': 'bg-gradient-to-r from-yellow-50 to-amber-50 text-amber-700 border border-amber-200',
    };
    return statusMap[status] || 'bg-gradient-to-r from-gray-50 to-slate-50 text-gray-700 border border-gray-200';
  };

  const getLeaveTypeStyle = (type) => {
    const typeMap = {
      'sick': 'bg-gradient-to-r from-red-100 to-rose-100 text-red-700',
      'vacation': 'bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700',
      'personal': 'bg-gradient-to-r from-purple-100 to-violet-100 text-purple-700',
      'emergency': 'bg-gradient-to-r from-orange-100 to-amber-100 text-orange-700',
      'maternity': 'bg-gradient-to-r from-pink-100 to-rose-100 text-pink-700',
      'paternity': 'bg-gradient-to-r from-cyan-100 to-blue-100 text-cyan-700',
    };
    return typeMap[type?.toLowerCase()] || 'bg-gradient-to-r from-gray-100 to-slate-100 text-gray-700';
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
        Cell: ({ value, row }) => (
          <div className="flex items-center space-x-2">
            <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-full flex items-center justify-center">
              <UserIcon className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-gray-900 truncate">
                {value}
              </span>
              
            </div>
          </div>
        ),
      },
      {
        Header: "Type",
        accessor: "type",
        Cell: ({ value }) => (
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold shadow-sm ${getLeaveTypeStyle(value)}`}
          >
            <div className="w-1.5 h-1.5 rounded-full bg-current mr-1.5"></div>
            {value?.charAt(0).toUpperCase() + value?.slice(1) || "N/A"}
          </span>
        ),
      },
      {
        Header: "Start Date",
        accessor: "startDate",
        Cell: ({ value }) => (
          <div className="flex items-center space-x-2">
            <div className="flex-shrink-0 w-1.5 h-1.5 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full"></div>
            <span className="text-sm font-medium text-gray-900">
              {value ? new Date(value).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: '2-digit' 
              }) : "N/A"}
            </span>
          </div>
        ),
      },
      {
        Header: "End Date",
        accessor: "endDate",
        Cell: ({ value }) => (
          <div className="flex items-center space-x-2">
            <div className="flex-shrink-0 w-1.5 h-1.5 bg-gradient-to-r from-red-400 to-rose-500 rounded-full"></div>
            <span className="text-sm font-medium text-gray-900">
              {value ? new Date(value).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: '2-digit' 
              }) : "N/A"}
            </span>
          </div>
        ),
      },
      {
        Header: "Duration",
        accessor: "days",
        Cell: ({ value }) => (
          <div className="flex items-center space-x-2">
            <CalendarDaysIcon className="w-4 h-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-900">
              {value ? `${value} ${value === 1 ? 'day' : 'days'}` : "N/A"}
            </span>
          </div>
        ),
      },
      {
        Header: "Status",
        accessor: "status",
        Cell: ({ value }) => (
          <span
            className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold shadow-sm ${getStatusStyle(value)}`}
          >
            {getStatusIcon(value)}
            <span className="ml-1.5">{value || 'Pending'}</span>
          </span>
        ),
      },
      {
        Header: "Actions",
        Cell: ({ row }) => (
          <div className="flex items-center space-x-1">
            <button
              onClick={() => handleEdit(row.original)}
              className="group p-1.5 rounded-lg hover:bg-gray-50 transition-all duration-200"
              title="Edit Leave Request"
            >
              <PencilIcon className="h-4 w-4 text-gray-400 group-hover:text-gray-700" />
            </button>
            <button
              onClick={() => handleDeleteClick(row.original._id)}
              className="group p-1.5 rounded-lg hover:bg-red-50 transition-all duration-200"
              title="Delete Leave Request"
            >
              <TrashIcon className="h-4 w-4 text-gray-400 group-hover:text-red-600" />
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
    const leave = leaves.find(l => l._id === leaveId);
    setDeleteModal({ isOpen: true, leave });
  };

  const handleDelete = async () => {
    if (!deleteModal.leave?._id) return;
    
    try {
      await deleteLeave(deleteModal.leave._id);
      toast.success("Leave request deleted successfully");
      fetchLeaves();
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to delete leave request"
      );
    } finally {
      setDeleteModal({ isOpen: false, leave: null });
    }
  };

  const handleAdd = () => {
    setSelectedLeave(null);
    setShowModal(true);
  };

  if (leavesLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-gradient-to-br from-gray-50 to-white">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600 mx-auto"></div>
          <p className="text-gray-500 font-medium">Loading leave requests...</p>
        </div>
      </div>
    );
  }

  if (leavesError) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-gradient-to-br from-red-50 to-white">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center mx-auto">
            <XCircleIcon className="w-8 h-8 text-red-500" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-red-900">Error Loading Leave Requests</h3>
            <p className="text-red-600 mt-1">{leavesError}</p>
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
                Leave Requests
              </h1>
              <p className="text-gray-600">Manage and track employee leave requests</p>
            </div>
            <button
              onClick={handleAdd}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
            >
              <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
              Add Leave Request
            </button>
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
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
                            className="px-4 py-4 text-left text-xs font-bold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors duration-200"
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
                                  <div className="h-4 w-4"></div>
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
                {page.length === 0 ? (
                  <tr>
                    <td
                      colSpan={columns.length}
                      className="px-6 py-16 text-center"
                    >
                      <div className="space-y-4">
                        <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto">
                          <CalendarDaysIcon className="w-8 h-8 text-gray-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">No leave requests found</h3>
                          <p className="text-gray-500 mt-1">Get started by creating your first leave request</p>
                        </div>
                        {/* <button
                          onClick={handleAdd}
                          className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
                        >
                          <PlusIcon className="w-4 h-4 mr-2" />
                          Add Leave Request
                        </button> */}
                      </div>
                    </td>
                  </tr>
                ) : (
                  page.map((row, index) => {
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
                              className="px-4 py-4 text-sm"
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
                    ({data.length} total requests)
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

      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, leave: null })}
        onConfirm={handleDelete}
        title="Delete Leave Request"
        message={`Are you sure you want to delete this leave request for ${
          deleteModal.leave?.employee?.firstName || 'Unknown'
        } ${deleteModal.leave?.employee?.lastName || 'Employee'}? This action cannot be undone.`}
        itemName="leave request"
      />

      {showModal && (
        <LeaveModal
          leave={selectedLeave}
          onClose={() => {
            setShowModal(false);
            setSelectedLeave(null);
          }}
          onSuccess={() => {
            setShowModal(false);
            setSelectedLeave(null);
            fetchLeaves();
          }}
        />
      )}
    </>
  );
};

export default Leave;