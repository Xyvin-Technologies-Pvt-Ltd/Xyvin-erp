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
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import PersonalLoanForm from "../../components/modules/frm/PersonalLoanForm";
import frmService from "@/api/frmService";
import { toast } from "react-hot-toast";
import { format } from "date-fns";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import DeleteConfirmationModal from "@/components/common/DeleteConfirmationModal";

const PersonalLoanList = () => {
  const [showLoanForm, setShowLoanForm] = useState(false);
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [showDeleteConfirmation, setShowDeleteConfirmation] = useState(false);
  const [summaryStats, setSummaryStats] = useState({
    totalLoans: 0,
    totalAmount: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });
  const [filters, setFilters] = useState({
    status: "",
    startDate: "",
    endDate: "",
  });

  const calculateSummaryStats = (loanData) => {
    const stats = {
      totalLoans: loanData.length,
      totalAmount: loanData.reduce((sum, loan) => sum + loan.amount, 0),
      pending: loanData.filter((loan) => loan.status === "Pending").length,
      approved: loanData.filter((loan) => loan.status === "Approved").length,
      rejected: loanData.filter((loan) => loan.status === "Rejected").length,
    };
    setSummaryStats(stats);
  };

  const fetchLoans = async () => {
    try {
      setLoading(true);
      const data = await frmService.getPersonalLoans(filters);
      setLoans(data);
      calculateSummaryStats(data);
    } catch (error) {
      toast.error(error.message || "Failed to fetch loans");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, [filters]);

  const handleSubmit = async (data) => {
    try {
      const loanData = {
        purpose: data.purpose,
        amount: parseFloat(data.amount),
        term: parseInt(data.term),
        interestRate: parseFloat(data.interestRate),
        employmentType: data.employmentType,
        monthlyIncome: parseFloat(data.monthlyIncome),
        monthlyPayment: parseFloat(data.monthlyPayment || 0),
        status: data.status || "Pending",
        documents: data.documents || [],
      };

      if (selectedLoan) {
        await frmService.updatePersonalLoan(selectedLoan._id, loanData);
        toast.success("Loan application updated successfully");
      } else {
        await frmService.createPersonalLoan(loanData);
        toast.success("Loan application submitted successfully");
      }
      setShowLoanForm(false);
      setSelectedLoan(null);
      fetchLoans();
    } catch (error) {
      console.error("Error submitting loan:", error);
      toast.error(error.message || "Failed to submit loan application");
    }
  };

  const handleEdit = (loan) => {
    setSelectedLoan(loan);
    setShowLoanForm(true);
  };

  const handleDelete = async () => {
    try {
      await frmService.deletePersonalLoan(selectedLoan._id);
      toast.success("Loan application deleted successfully");
      setShowDeleteConfirmation(false);
      setSelectedLoan(null);
      fetchLoans();
    } catch (error) {
      toast.error(error.message || "Failed to delete loan application");
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
      { Header: "Purpose", accessor: "purpose" },
      {
        Header: "Amount",
        accessor: "amount",
        Cell: ({ value }) => formatCurrency(value),
      },
      {
        Header: "Interest Rate",
        accessor: "interestRate",
        Cell: ({ value }) => `${value}%`,
      },
      {
        Header: "Term",
        accessor: "term",
        Cell: ({ value }) => `${value} months`,
      },
      {
        Header: "Monthly Payment",
        accessor: "monthlyPayment",
        Cell: ({ value }) => formatCurrency(value || 0),
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
                : "bg-red-100 text-red-800"
            }`}
          >
            {value}
          </span>
        ),
      },
      {
        Header: "Actions",
        Cell: ({ row }) => (
          <div className="flex justify-start space-x-3">
            <button
              onClick={() => handleEdit(row.original)}
              className="text-gray-700 hover:text-gray-900"
            >
              <PencilIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => confirmDelete(row.original)}
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
          <h1 className="text-xl font-semibold text-gray-900">
            Personal Loans
          </h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all personal loans including amount, interest rate,
            status, and repayment details.
          </p>
        </div>
        <div className="mt-4 sm:ml-16 sm:mt-0 sm:flex-none">
          <button
            type="button"
            onClick={() => setShowLoanForm(true)}
            className="flex items-center justify-center rounded-md bg-black px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
          >
            <PlusIcon className="-ml-0.5 mr-1.5 h-5 w-5" aria-hidden="true" />
            Apply for Loan
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Total Loans Card */}
        <div className="overflow-hidden rounded-lg bg-white shadow hover:shadow-lg transition-shadow duration-300">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="rounded-sm bg-blue-100 p-3">
                  <CurrencyRupeeIcon
                    className="h-6 w-6 text-blue-600"
                    aria-hidden="true"
                  />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Total Loans
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {summaryStats.totalLoans}
                    </div>
                    <div className="ml-2 text-sm font-medium text-gray-500">
                      {formatCurrency(summaryStats.totalAmount)}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Pending Loans Card */}
        <div className="overflow-hidden rounded-lg bg-white shadow hover:shadow-lg transition-shadow duration-300">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="rounded-sm bg-yellow-100 p-3">
                  <ClockIcon
                    className="h-6 w-6 text-yellow-600"
                    aria-hidden="true"
                  />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Pending
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {summaryStats.pending}
                    </div>
                    <div className="ml-2 text-sm font-medium text-yellow-600">
                      Awaiting Review
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Approved Loans Card */}
        <div className="overflow-hidden rounded-lg bg-white shadow hover:shadow-lg transition-shadow duration-300">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="rounded-sm bg-green-100 p-3 ">
                  <CheckCircleIcon
                    className="h-6 w-6 text-green-600"
                    aria-hidden="true"
                  />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Approved
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {summaryStats.approved}
                    </div>
                    <div className="ml-2 text-sm font-medium text-green-600">
                      Processed
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>

        {/* Rejected Loans Card */}
        <div className="overflow-hidden rounded-lg bg-white shadow hover:shadow-lg transition-shadow duration-300">
          <div className="p-5">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="rounded-sm bg-red-100 p-3">
                  <XCircleIcon
                    className="h-6 w-6 text-red-600"
                    aria-hidden="true"
                  />
                </div>
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    Rejected
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {summaryStats.rejected}
                    </div>
                    <div className="ml-2 text-sm font-medium text-red-600">
                      Not Approved
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <select
          value={filters.status}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, status: e.target.value }))
          }
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
        >
          <option value="">All Status</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>

        <input
          type="date"
          value={filters.startDate}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, startDate: e.target.value }))
          }
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          placeholder="Start Date"
        />

        <input
          type="date"
          value={filters.endDate}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, endDate: e.target.value }))
          }
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
          placeholder="End Date"
        />
      </div>

      <div className="mt-8 flow-root">
        <div className="-mx-0 -my-2 sm:-mx-0 lg:-mx-0">
          {loading ? (
            <div className="flex justify-center items-center h-64">
              <LoadingSpinner />
            </div>
          ) : (
            <>
              {/* Mobile View - Cards */}
              <div className="grid grid-cols-1 gap-4 sm:hidden">
                {page.map((row) => {
                  prepareRow(row);
                  const loan = row.original;
                  return (
                    <div
                      key={loan._id}
                      className="bg-white shadow rounded-lg overflow-hidden hover:shadow-lg transition-shadow duration-300"
                    >
                      <div className="p-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-lg font-medium text-gray-900">
                              {loan.purpose}
                            </h3>
                            <p className="text-sm text-gray-500">
                              Loan No: {loan._id}
                            </p>
                          </div>
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium
                            ${
                              loan.status === "Approved"
                                ? "bg-green-100 text-green-800"
                                : loan.status === "Pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {loan.status}
                          </span>
                        </div>

                        <dl className="mt-4 grid grid-cols-2 gap-4">
                          <div>
                            <dt className="text-sm font-medium text-gray-500">
                              Amount
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              {formatCurrency(loan.amount)}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">
                              Interest Rate
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              {loan.interestRate}%
                            </dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">
                              Term
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              {loan.term} months
                            </dd>
                          </div>
                          <div>
                            <dt className="text-sm font-medium text-gray-500">
                              Monthly Payment
                            </dt>
                            <dd className="mt-1 text-sm text-gray-900">
                              {formatCurrency(loan.monthlyPayment || 0)}
                            </dd>
                          </div>
                        </dl>

                        <div className="mt-4 flex justify-end space-x-3">
                          <button
                            onClick={() => handleEdit(loan)}
                            className="inline-flex items-center px-3 py-1 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                          >
                            <PencilIcon className="h-4 w-4 mr-1.5" />
                            Edit
                          </button>
                          <button
                            onClick={() => confirmDelete(loan)}
                            className="inline-flex items-center px-3 py-1 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-white hover:bg-red-50"
                          >
                            <TrashIcon className="h-4 w-4 mr-1.5" />
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Tablet and Desktop View - Table */}
              <div className="hidden sm:block">
                <div className="inline-block min-w-full py-2 align-middle">
                  <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 sm:rounded-lg">
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
                  </div>
                </div>
              </div>

              {/* Pagination UI */}
            {page.length > 0 && (
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
            </>
          )}
        </div>
      </div>

      <PersonalLoanForm
        open={showLoanForm}
        setOpen={setShowLoanForm}
        onSubmit={handleSubmit}
        initialData={selectedLoan}
      />

      <DeleteConfirmationModal
        isOpen={showDeleteConfirmation}
        onClose={() => setShowDeleteConfirmation(false)}
        onConfirm={handleDelete}
        title="Delete Loan Application"
        message="Are you sure you want to delete this loan application? This action cannot be undone."
      />
    </div>
  );
};

export default PersonalLoanList;
