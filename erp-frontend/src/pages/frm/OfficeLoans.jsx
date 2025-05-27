import { useState, useEffect, useMemo } from "react";
import { useTable, usePagination } from "react-table";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import {
  CurrencyRupeeIcon,
  DocumentTextIcon,
  ClockIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import OfficeLoanForm from "../../components/modules/frm/OfficeLoanForm";
import frmService from "@/api/frmService";
import { toast } from "react-hot-toast";
import { format } from "date-fns";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import DeleteConfirmationModal from "@/components/common/DeleteConfirmationModal";

const OfficeLoanList = () => {
  const [showLoanForm, setShowLoanForm] = useState(false);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({
    status: "",
    department: "",
    startDate: "",
    endDate: "",
  });

  const fetchStats = async () => {
    try {
      const data = await frmService.getOfficeLoanStats();
      setStats(data);
    } catch (error) {
      console.error("Error fetching stats:", error);
      toast.error("Failed to fetch loan statistics");
    }
  };

  const fetchLoans = async () => {
    try {
      setLoading(true);
      const data = await frmService.getOfficeLoans(filters);
      setLoans(data);
    } catch (error) {
      toast.error(error.message || "Failed to fetch loans");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
    fetchStats();
  }, [filters]);

  const handleSubmit = async (data) => {
    try {
      if (selectedLoan) {
        await frmService.updateOfficeLoan(selectedLoan._id, data);
        toast.success("Loan request updated successfully");
      } else {
        await frmService.createOfficeLoan(data);
        toast.success("Loan request submitted successfully");
      }
      setShowLoanForm(false);
      setSelectedLoan(null);
      fetchLoans();
    } catch (error) {
      toast.error(error.message || "Failed to submit loan request");
    }
  };

  const handleEdit = (loan) => {
    setSelectedLoan(loan);
    setShowLoanForm(true);
  };

  const handleDelete = async () => {
    try {
      await frmService.deleteOfficeLoan(selectedLoan._id);
      toast.success("Loan request deleted successfully");
      setShowDeleteConfirmation(false);
      setSelectedLoan(null);
      fetchLoans();
    } catch (error) {
      toast.error(error.message || "Failed to delete loan request");
    }
  };

  const confirmDelete = (loan) => {
    setSelectedLoan(loan);
    setShowDeleteConfirmation(true);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  const columns = useMemo(
    () => [
      {
        Header: "Purpose",
        accessor: "purpose",
      },
      {
        Header: "Amount",
        accessor: "amount",
        Cell: ({ value }) => formatCurrency(value),
      },
      {
        Header: "Department",
        accessor: "department",
      },
      {
        Header: "Request Date",
        accessor: "requestDate",
        Cell: ({ value }) => format(new Date(value), "MMM d, yyyy"),
      },
      {
        Header: "Status",
        accessor: "status",
        Cell: ({ value }) => (
          <span
            className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
              value === "Approved"
                ? "bg-green-100 text-green-800"
                : value === "Pending"
                ? "bg-yellow-100 text-yellow-800"
                : value === "Rejected"
                ? "bg-red-100 text-red-800"
                : "bg-gray-100 text-gray-800"
            }`}
          >
            {value}
          </span>
        ),
      },
      {
        Header: "Actions",
        Cell: ({ row }) => (
          <div className="flex justify-start gap-2">
            <button
              onClick={() => handleEdit(row.original)}
              className="inline-flex items-center text-primary-600 hover:text-primary-900"
            >
              <PencilIcon className="h-4 w-4 mr-1" />
              Edit
            </button>
            <button
              onClick={() => confirmDelete(row.original)}
              className="inline-flex items-center text-red-600 hover:text-red-900"
            >
              <TrashIcon className="h-4 w-4 mr-1" />
              Delete
            </button>
          </div>
        ),
      },
    ],
    []
  );

  const data = useMemo(() => loans, [loans]);

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

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-xl font-semibold text-gray-900">Office Loans</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all office loans including amount, purpose, status, and
            repayment details.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <button
            type="button"
            onClick={() => setShowLoanForm(true)}
            className="flex items-center justify-center rounded-md bg-black px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
          >
            <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
            Request Office Loan
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {stats && (
        <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <div className="overflow-hidden rounded-lg bg-white shadow">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                    <CurrencyRupeeIcon
                      className="h-6 w-6 text-blue-600"
                      aria-hidden="true"
                    />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="truncate text-sm font-medium text-gray-500">
                      Total Loan Amount
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {new Intl.NumberFormat("en-IN", {
                        style: "currency",
                        currency: "INR",
                      }).format(stats.totalAmount || 0)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg bg-white shadow">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100">
                    <DocumentTextIcon
                      className="h-6 w-6 text-green-600"
                      aria-hidden="true"
                    />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="truncate text-sm font-medium text-gray-500">
                      Total Loans
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      <div className="flex flex-col">
                        <span>{stats.totalCount || 0}</span>
                        <span className="text-xs text-gray-500">
                          {stats.pendingCount || 0} Pending ·{" "}
                          {stats.approvedCount || 0} Approved
                        </span>
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg bg-white shadow">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-yellow-100">
                    <ClockIcon
                      className="h-6 w-6 text-yellow-600"
                      aria-hidden="true"
                    />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="truncate text-sm font-medium text-gray-500">
                      Total Outstanding
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {new Intl.NumberFormat("en-IN", {
                        style: "currency",
                        currency: "INR",
                      }).format(stats.totalRemaining || 0)}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg bg-white shadow">
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                    <CheckCircleIcon
                      className="h-6 w-6 text-purple-600"
                      aria-hidden="true"
                    />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="truncate text-sm font-medium text-gray-500">
                      Department Breakdown
                    </dt>
                    <dd className="text-sm text-gray-900">
                      <div className="max-h-20 overflow-y-auto">
                        {stats.departmentBreakdown?.map((dept) => (
                          <div
                            key={dept.department}
                            className="flex justify-between text-xs"
                          >
                            <span>{dept.department}</span>
                            <span>{dept.count} loans</span>
                          </div>
                        ))}
                      </div>
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="mt-4 space-y-4 sm:space-y-0 sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
        <select
          value={filters.status}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, status: e.target.value }))
          }
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
        >
          <option value="">All Status</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>

        <select
          value={filters.department}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, department: e.target.value }))
          }
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
        >
          <option value="">All Departments</option>
          <option value="IT">IT</option>
          <option value="HR">HR</option>
          <option value="Finance">Finance</option>
          <option value="Marketing">Marketing</option>
          <option value="Operations">Operations</option>
        </select>

        <div className="flex space-x-4 sm:space-x-0 sm:block">
          <div className="flex-1 sm:mb-0">
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, startDate: e.target.value }))
              }
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
              placeholder="Start Date"
            />
          </div>
        </div>

        <div className="flex space-x-4 sm:space-x-0 sm:block">
          <div className="flex-1 sm:mb-0">
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) =>
                setFilters((prev) => ({ ...prev, endDate: e.target.value }))
              }
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-sm"
              placeholder="End Date"
            />
          </div>
        </div>
      </div>

      <div className="mt-8 flow-root">
        {/* Mobile view - Cards */}
        <div className="block sm:hidden">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="space-y-4">
              {page.map((row) => {
                prepareRow(row);
                const loan = row.original;
                return (
                  <div
                    key={loan._id}
                    className="bg-white shadow rounded-lg overflow-hidden"
                  >
                    <div className="p-4">
                      <div className="flex justify-between items-start">
                        <div className="space-y-1">
                          <p className="text-sm font-medium text-gray-900 line-clamp-2">
                            {loan.purpose}
                          </p>
                          <p className="text-sm text-gray-500">
                            {loan.department}
                          </p>
                        </div>
                        <span
                          className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
                            loan.status === "Approved"
                              ? "bg-green-100 text-green-800"
                              : loan.status === "Pending"
                              ? "bg-yellow-100 text-yellow-800"
                              : loan.status === "Rejected"
                              ? "bg-red-100 text-red-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {loan.status}
                        </span>
                      </div>
                      <div className="mt-3 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">Amount:</span>
                          <span className="text-sm font-medium text-gray-900">
                            {formatCurrency(loan.amount)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-gray-500">
                            Request Date:
                          </span>
                          <span className="text-sm text-gray-900">
                            {format(new Date(loan.requestDate), "MMM d, yyyy")}
                          </span>
                        </div>
                      </div>
                      <div className="mt-4 flex justify-end gap-3 border-t pt-3">
                        <button
                          onClick={() => handleEdit(loan)}
                          className="inline-flex items-center px-2.5 py-1.5 text-sm font-medium text-primary-600 hover:text-primary-900"
                        >
                          <PencilIcon className="h-4 w-4 mr-1" />
                          Edit
                        </button>
                        <button
                          onClick={() => confirmDelete(loan)}
                          className="inline-flex items-center px-2.5 py-1.5 text-sm font-medium text-red-600 hover:text-red-900"
                        >
                          <TrashIcon className="h-4 w-4 mr-1" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Desktop view - Table */}
        <div className="hidden sm:block -mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <LoadingSpinner />
                </div>
              ) : (
                <table
                  className="min-w-full divide-y divide-gray-300"
                  {...getTableProps()}
                >
                  <thead className="bg-gray-50">
                    {headerGroups.map((headerGroup) => (
                      <tr {...headerGroup.getHeaderGroupProps()}>
                        {headerGroup.headers.map((column) => (
                          <th
                            {...column.getHeaderProps()}
                            className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-6"
                          >
                            {column.render("Header")}
                          </th>
                        ))}
                      </tr>
                    ))}
                  </thead>
                  <tbody
                    className="divide-y divide-gray-200 bg-white"
                    {...getTableBodyProps()}
                  >
                    {page.map((row) => {
                      prepareRow(row);
                      return (
                        <tr {...row.getRowProps()}>
                          {row.cells.map((cell) => (
                            <td
                              {...cell.getCellProps()}
                              className="whitespace-nowrap px-3 py-4 text-sm text-gray-500"
                            >
                              {cell.render("Cell")}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* Pagination UI */}
        {!loading && (
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
                  Showing page{" "}
                  <span className="font-medium">{pageIndex + 1}</span> of{" "}
                  <span className="font-medium">{pageOptions.length}</span>
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
        )}
      </div>

      <OfficeLoanForm
        open={showLoanForm}
        setOpen={setShowLoanForm}
        onSubmit={handleSubmit}
        initialData={selectedLoan}
      />

      <DeleteConfirmationModal
        isOpen={showDeleteConfirmation}
        onClose={() => setShowDeleteConfirmation(false)}
        onConfirm={handleDelete}
        title="Delete Office Loan"
        message="Are you sure you want to delete this loan request? This action cannot be undone."
      />
    </div>
  );
};

export default OfficeLoanList;
