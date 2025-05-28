import { useState, useEffect, useMemo } from "react";
import { useTable, usePagination } from "react-table";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import ExpenseForm from "../../components/modules/frm/ExpenseForm";
import DeleteConfirmationModal from "../../components/common/DeleteConfirmationModal";
import frmService from "@/api/frmService";
import { toast } from "react-hot-toast";
import { format } from "date-fns";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ExpenseStats from "@/components/modules/frm/ExpenseStats";
import ExpenseCard from "@/components/modules/frm/ExpenseCard";

const ExpenseList = () => {
  const [showExpenseForm, setShowExpenseForm] = useState(false);
  const [expenses, setExpenses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingExpense, setEditingExpense] = useState(null);
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    expense: null,
  });
  const [filters, setFilters] = useState({
    status: "",
    category: "",
    startDate: "",
    endDate: "",
  });
  const [stats, setStats] = useState({
    totalAmount: 0,
    totalCount: 0,
    paidAmount: 0,
    paidCount: 0,
    pendingAmount: 0,
    pendingCount: 0,
  });

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      console.log('Fetching expenses with filters:', filters);
      
      // Clean up filters
      const cleanFilters = Object.entries(filters).reduce((acc, [key, value]) => {
        if (value !== '' && value !== null && value !== undefined) {
          acc[key] = value;
        }
        return acc;
      }, {});
      
      console.log('Clean filters:', cleanFilters);
      
      const data = await frmService.getExpenses(cleanFilters);
      console.log('Received expenses data:', data);
      
      if (!Array.isArray(data)) {
        console.error('Expected array of expenses but received:', typeof data);
        toast.error('Failed to load expenses. Please try again.');
        setExpenses([]);
        setStats({
          totalAmount: 0,
          totalCount: 0,
          paidAmount: 0,
          paidCount: 0,
          pendingAmount: 0,
          pendingCount: 0,
        });
        return;
      }

      setExpenses(data);
      calculateStats(data);
    } catch (error) {
      console.error('Error fetching expenses:', {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status
      });
      toast.error(error.response?.data?.message || error.message || "Failed to fetch expenses");
      setExpenses([]);
      setStats({
        totalAmount: 0,
        totalCount: 0,
        paidAmount: 0,
        paidCount: 0,
        pendingAmount: 0,
        pendingCount: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (expensesData) => {
    const newStats = {
      totalAmount: 0,
      totalCount: 0,
      paidAmount: 0,
      paidCount: 0,
      pendingAmount: 0,
      pendingCount: 0,
    };

    expensesData.forEach((expense) => {
      newStats.totalAmount += expense.amount;
      newStats.totalCount += 1;

      if (expense.status === "Approved") {
        newStats.paidAmount += expense.amount;
        newStats.paidCount += 1;
      } else if (expense.status === "Pending") {
        newStats.pendingAmount += expense.amount;
        newStats.pendingCount += 1;
      }
    });

    setStats(newStats);
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No authentication token found');
      toast.error('Please login to view expenses');
      window.location.href = '/login';
      return;
    }

    const loadExpenses = async () => {
      try {
        await fetchExpenses();
      } catch (error) {
        if (error.response?.status === 401) {
          toast.error('Session expired. Please login again.');
          localStorage.clear();
          window.location.href = '/login';
        }
      }
    };

    loadExpenses();
  }, [filters]);

  const handleSubmit = async (data) => {
    try {
      if (editingExpense) {
        const {
          _id,
          submittedBy,
          approvedBy,
          createdAt,
          updatedAt,
          __v,
          expenseNumber,
          ...updateFields
        } = data;

        const formData = new FormData();

        Object.entries(updateFields).forEach(([key, value]) => {
          if (key === "documents") {
            if (value && value.length) {
              for (let i = 0; i < value.length; i++) {
                if (value[i] instanceof File) {
                  formData.append("documents", value[i]);
                }
              }
            }
          } else {
            if (key === "amount") {
              formData.append(key, Number(value) || 0);
            } else {
              formData.append(key, value === null ? "" : value);
            }
          }
        });

        await frmService.updateExpense(editingExpense._id, formData);
        toast.success("Expense updated successfully");
      } else {
        const formData = new FormData();
        Object.entries(data).forEach(([key, value]) => {
          if (key === "documents") {
            if (value && value.length) {
              for (let i = 0; i < value.length; i++) {
                formData.append("documents", value[i]);
              }
            }
          } else if (value !== undefined && value !== "") {
            formData.append(key, value);
          }
        });
        await frmService.createExpense(formData);
        toast.success("Expense created successfully");
      }
      setShowExpenseForm(false);
      setEditingExpense(null);
      fetchExpenses();
    } catch (error) {
      console.error("Error saving expense:", error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to save expense"
      );
    }
  };

  const handleEdit = (expense) => {
    const formattedExpense = {
      description: expense.description,
      amount: expense.amount,
      date: new Date(expense.date).toISOString().split("T")[0],
      category: expense.category,
      notes: expense.notes || "",
      status: expense.status,
      documents: expense.documents || []
    };
    setEditingExpense({ ...formattedExpense, _id: expense._id });
    setShowExpenseForm(true);
  };

  const handleDelete = (expense) => {
    setDeleteModal({ isOpen: true, expense });
  };

  const confirmDelete = async () => {
    try {
      setLoading(true);
      console.log('Attempting to delete expense:', {
        id: deleteModal.expense._id,
        status: deleteModal.expense.status,
        description: deleteModal.expense.description
      });
      await frmService.deleteExpense(deleteModal.expense._id);
      toast.success("Expense deleted successfully");
      await fetchExpenses();
    } catch (error) {
      console.error("Delete error:", {
        error,
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        expense: deleteModal.expense
      });
      toast.error(
        error.message || 
        error.response?.data?.message ||
        "Failed to delete expense. Please try again."
      );
    } finally {
      setLoading(false);
      setDeleteModal({ isOpen: false, expense: null });
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
    }).format(amount);
  };

  const columns = useMemo(
    () => [
      { Header: "Expense No.", accessor: "expenseNumber" },
      { Header: "Description", accessor: "description" },
      {
        Header: "Amount",
        accessor: "amount",
        Cell: ({ value }) => formatCurrency(value),
      },
      {
        Header: "Date",
        accessor: "date",
        Cell: ({ value }) => format(new Date(value), "MMM d, yyyy"),
      },
      {
        Header: "Category",
        accessor: "category",
        Cell: ({ value }) => value.charAt(0).toUpperCase() + value.slice(1),
      },
      {
        Header: "Notes",
        accessor: "notes",
        Cell: ({ value }) => (
          <div className="max-w-xs overflow-hidden">
            {value ? (
              <span className="block truncate" title={value}>
                {value}
              </span>
            ) : (
              <span className="text-gray-400">No notes</span>
            )}
          </div>
        ),
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
          <div className="flex justify-start space-x-2">
            <button
              onClick={() => handleEdit(row.original)}
              className="text-black hover:text-gray-800"
            >
              <PencilIcon className="h-5 w-5" aria-hidden="true" />
            </button>
            {row.original.status === "Pending" ? (
              <button
                onClick={() => handleDelete(row.original)}
                className="text-red-600 hover:text-red-900"
              >
                <TrashIcon className="h-5 w-5" aria-hidden="true" />
              </button>
            ) : (
              <button
                disabled
                className="text-gray-300 cursor-not-allowed"
                title="Only pending expenses can be deleted"
              >
                <TrashIcon className="h-5 w-5" aria-hidden="true" />
              </button>
            )}
          </div>
        ),
      },
    ],
    []
  );

  const data = useMemo(() => {
    console.log('Preparing table data with expenses:', expenses);
    return expenses || [];
  }, [expenses]);

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

  const renderMobileView = () => (
    <div className="space-y-4 lg:hidden">
      {page.map((row) => {
        prepareRow(row);
        return (
          <ExpenseCard
            key={row.original._id}
            expense={row.original}
            onEdit={handleEdit}
            onDelete={handleDelete}
            formatCurrency={formatCurrency}
          />
        );
      })}
    </div>
  );

  const renderDesktopView = () => (
    <div className="hidden lg:block overflow-x-auto">
      <div className="inline-block min-w-full align-middle">
        <table
          className="min-w-full divide-y divide-gray-300"
          {...getTableProps()}
        >
          <thead className="bg-gray-50">
            {headerGroups.map((headerGroup) => {
              const { key, ...headerGroupProps } = headerGroup.getHeaderGroupProps();
              return (
                <tr key={key} {...headerGroupProps}>
                  {headerGroup.headers.map((column) => {
                    const { key, ...columnProps } = column.getHeaderProps();
                    return (
                      <th
                        key={key}
                        {...columnProps}
                        className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
                      >
                        {column.render("Header")}
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
  );

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
      <div className="sm:flex sm:items-center mb-8">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Expenses</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all expenses including their description, amount, date,
            and status.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            onClick={() => {
              setEditingExpense(null);
              setShowExpenseForm(true);
            }}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-black px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 sm:w-auto"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Add Expense
          </button>
        </div>
      </div>

      <ExpenseStats stats={stats} />

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

        <select
          value={filters.category}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, category: e.target.value }))
          }
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
        >
          <option value="">All Categories</option>
          <option value="salary">Salary</option>
          <option value="travel">Travel</option>
          <option value="office">Office Supplies</option>
          <option value="meals">Meals & Entertainment</option>
          <option value="utilities">Utilities</option>
          <option value="other">Other</option>
        </select>

        <input
          type="date"
          value={filters.startDate}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, startDate: e.target.value }))
          }
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
        />

        <input
          type="date"
          value={filters.endDate}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, endDate: e.target.value }))
          }
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
        />
      </div>

      <div className="mt-8">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <LoadingSpinner />
          </div>
        ) : (
          <>
            {renderMobileView()}
            {renderDesktopView()}

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

      <ExpenseForm
        open={showExpenseForm}
        setOpen={(open) => {
          setShowExpenseForm(open);
          if (!open) setEditingExpense(null);
        }}
        onSubmit={handleSubmit}
        initialData={editingExpense}
      />

      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, expense: null })}
        onConfirm={confirmDelete}
        title="Delete Expense"
        message={`Are you sure you want to delete the expense "${deleteModal.expense?.description}"? This action cannot be undone.`}
      />
    </div>
  );
};

export default ExpenseList;
