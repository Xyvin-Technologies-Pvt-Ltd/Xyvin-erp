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
import PositionModal from "../../components/modules/hrm/PositionModal";
import DeleteConfirmationModal from "../../components/common/DeleteConfirmationModal";

const Positions = () => {
  const [showModal, setShowModal] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState(null);
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    position: null,
  });
  const { positions, positionsLoading, positionsError, fetchPositions, deletePosition } =
    useHrmStore();

  useEffect(() => {
    fetchPositions();
  }, []);

  const columns = useMemo(
    () => [
      {
        Header: "Title",
        accessor: "title",
      },
      {
        Header: "Department",
        accessor: "department.name",
      },
      {
        Header: "Employment Type",
        accessor: "employmentType",
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
              title="Edit Position"
            >
              <PencilIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => handleDeleteClick(row.original)}
              className="text-red-600 hover:text-red-900"
              title="Delete Position"
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
    return Array.isArray(positions) ? positions : [];
  }, [positions]);

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

  const handleEdit = (position) => {
    setSelectedPosition(position);
    setShowModal(true);
  };

  const handleDeleteClick = (position) => {
    setDeleteModal({ isOpen: true, position });
  };

  const handleDelete = async () => {
    try {
      const id = deleteModal.position.id || deleteModal.position._id;
      await deletePosition(id);
      toast.success("Position deleted successfully");
      fetchPositions();
      setDeleteModal({ isOpen: false, position: null });
    } catch (error) {
      console.error("Error deleting position:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to delete position";
      toast.error(errorMessage);
      if (error.response?.status === 400) {
        toast.error("Cannot delete position with active employees");
      }
    }
  };

  if (positionsLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  if (positionsError) {
    return (
      <div className="flex h-full items-center justify-center text-red-600">
        {positionsError}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Positions</h2>
        <button
          onClick={() => {
            setSelectedPosition(null);
            setShowModal(true);
          }}
          className="btn btn-primary inline-flex items-center"
        >
          <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
          Add Position
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
        onClose={() => setDeleteModal({ isOpen: false, position: null })}
        onConfirm={handleDelete}
        title="Delete Position"
        message={`Are you sure you want to delete the position "${deleteModal.position?.title}"? This action cannot be undone.`}
        itemName="position"
      />

      {/* Position Modal */}
      {showModal && (
        <PositionModal
          isOpen={showModal}
          position={selectedPosition}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            fetchPositions();
          }}
        />
      )}
    </div>
  );
};

export default Positions;
