import { useState, useEffect, useMemo } from "react";
import { useTable, usePagination } from "react-table";
import {
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import ProfitForm from "../../components/modules/frm/ProfitForm";
import DeleteConfirmationModal from "../../components/common/DeleteConfirmationModal";
import frmService from "@/api/frmService";
import { toast } from "react-hot-toast";
import { format } from "date-fns";
import LoadingSpinner from "../../components/common/LoadingSpinner";
import ProfitStats from "@/components/modules/frm/ProfitStats";
import ProfitCard from "@/components/modules/frm/ProfitCard";

const Profits = () => {
  const [showProfitForm, setShowProfitForm] = useState(false);
  const [profits, setProfits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingProfit, setEditingProfit] = useState(null);
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    profit: null,
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
    realizedAmount: 0,
    realizedCount: 0,
    pendingAmount: 0,
    pendingCount: 0,
  });

  const fetchProfits = async () => {
    try {
      setLoading(true);
      const data = await frmService.getProfits(filters);
      setProfits(data);
      calculateStats(data);
    } catch (error) {
      toast.error(error.message || "Failed to fetch profits");
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (profitsData) => {
    const newStats = {
      totalAmount: 0,
      totalCount: 0,
      realizedAmount: 0,
      realizedCount: 0,
      pendingAmount: 0,
      pendingCount: 0,
    };

    profitsData.forEach((profit) => {
      newStats.totalAmount += profit.amount;
      newStats.totalCount += 1;

      if (profit.status === "Realized") {
        newStats.realizedAmount += profit.amount;
        newStats.realizedCount += 1;
      } else if (profit.status === "Pending") {
        newStats.pendingAmount += profit.amount;
        newStats.pendingCount += 1;
      }
    });

    setStats(newStats);
  };

  useEffect(() => {
    fetchProfits();
  }, [filters]);

  const handleSubmit = async (data) => {
    try {
      if (editingProfit) {
        const {
          _id,
          submittedBy,
          approvedBy,
          createdAt,
          updatedAt,
          __v,
          profitNumber,
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

        await frmService.updateProfit(editingProfit._id, formData);
        toast.success("Profit updated successfully");
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
        await frmService.createProfit(formData);
        toast.success("Profit created successfully");
      }
      setShowProfitForm(false);
      setEditingProfit(null);
      fetchProfits();
    } catch (error) {
      console.error("Error saving profit:", error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to save profit"
      );
    }
  };

  const handleEdit = (profit) => {
    const formattedProfit = {
      description: profit.description,
      amount: profit.amount,
      date: new Date(profit.date).toISOString().split("T")[0],
      category: profit.category,
      notes: profit.notes || "",
      status: profit.status,
    };
    setEditingProfit({ ...formattedProfit, _id: profit._id });
    setShowProfitForm(true);
  };

  const handleDelete = (profit) => {
    setDeleteModal({ isOpen: true, profit });
  };

  const confirmDelete = async () => {
    try {
      await frmService.deleteProfit(deleteModal.profit._id);
      toast.success("Profit deleted successfully");
      fetchProfits();
    } catch (error) {
      console.error("Delete error:", error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to delete profit"
      );
    } finally {
      setDeleteModal({ isOpen: false, profit: null });
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  const columns = useMemo(
    () => [
      { Header: "Revenue No.", accessor: "profitNumber" },
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
        Header: "Status",
        accessor: "status",
        Cell: ({ value }) => (
          <span
            className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${
              value === "Realized"
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
            <button
              onClick={() => handleDelete(row.original)}
              className="text-red-600 hover:text-red-900"
            >
              <TrashIcon className="h-5 w-5" aria-hidden="true" />
            </button>
          </div>
        ),
      },
    ],
    []
  );

  const data = useMemo(() => profits, [profits]);

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
          <ProfitCard
            key={row.original._id}
            profit={row.original}
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
            {headerGroups.map((headerGroup) => (
              <tr {...headerGroup.getHeaderGroupProps()}>
                {headerGroup.headers.map((column) => (
                  <th
                    {...column.getHeaderProps()}
                    className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900"
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
  );

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-8 w-full max-w-9xl mx-auto">
      <div className="sm:flex sm:items-center mb-8">
        <div className="sm:flex-auto">
          <h1 className="text-2xl font-semibold text-gray-900">Revenue</h1>
          <p className="mt-2 text-sm text-gray-700">
            A list of all profits including their description, amount, date, and
            status.
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <button
            onClick={() => {
              setEditingProfit(null);
              setShowProfitForm(true);
            }}
            className="inline-flex items-center justify-center rounded-md border border-transparent bg-black px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 sm:w-auto"
          >
            <PlusIcon className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
            Add Profit
          </button>
        </div>
      </div>

      <ProfitStats stats={stats} />

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
          <option value="Realized">Realized</option>
          <option value="Cancelled">Cancelled</option>
        </select>

        <select
          value={filters.category}
          onChange={(e) =>
            setFilters((prev) => ({ ...prev, category: e.target.value }))
          }
          className="block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
        >
          <option value="">All Categories</option>
          <option value="sales">Sales</option>
          <option value="services">Services</option>
          <option value="investments">Investments</option>
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

      <ProfitForm
        open={showProfitForm}
        setOpen={(open) => {
          setShowProfitForm(open);
          if (!open) setEditingProfit(null);
        }}
        onSubmit={handleSubmit}
        initialData={editingProfit}
      />

      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, profit: null })}
        onConfirm={confirmDelete}
        title="Delete Profit"
        message={`Are you sure you want to delete the profit "${deleteModal.profit?.description}"? This action cannot be undone.`}
      />
    </div>
  );
};

export default Profits;
