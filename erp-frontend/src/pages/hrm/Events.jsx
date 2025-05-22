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
import EventModal from "../../components/modules/hrm/EventModal";
import DeleteConfirmationModal from "../../components/common/DeleteConfirmationModal";

const Events = () => {
  const [showModal, setShowModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [deleteModal, setDeleteModal] = useState({
    isOpen: false,
    event: null,
  });
  const { events, eventsLoading, eventsError, fetchEvents, deleteEvent } =
    useHrmStore();

  useEffect(() => {
    fetchEvents().catch((err) => {
      console.error("Error fetching events:", err);
    });
  }, [fetchEvents]);

  const columns = useMemo(
    () => [
      {
        Header: "Title",
        accessor: "title",
      },
      {
        Header: "Description",
        accessor: "description",
        Cell: ({ value }) => <span className="line-clamp-2">{value}</span>,
      },
      {
        Header: "Start Date",
        accessor: "startDate",
        Cell: ({ value }) =>
          value ? new Date(value).toLocaleDateString() : "-",
      },
      {
        Header: "End Date",
        accessor: "endDate",
        Cell: ({ value }) =>
          value ? new Date(value).toLocaleDateString() : "-",
      },
      {
        Header: "Status",
        accessor: "status",
        Cell: ({ value }) => {
          const statusColors = {
            upcoming: "bg-blue-100 text-blue-800",
            ongoing: "bg-green-100 text-green-800",
            completed: "bg-gray-100 text-gray-800",
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
        id: "actions",
        Cell: ({ row }) => (
          <div className="flex space-x-2">
            <button
              onClick={() => handleEdit(row.original)}
              className="text-blue-600 hover:text-blue-900"
              title="Edit Event"
            >
              <PencilIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => handleDeleteClick(row.original)}
              className="text-red-600 hover:text-red-900"
              title="Delete Event"
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
    if (!events) {
      console.log("Events is undefined");
      return [];
    }

    if (!Array.isArray(events)) {
      console.log("Events is not an array:", events);
      return [];
    }

    return events
      .map((event) => {
        if (!event || !event._id) {
          console.log("Invalid event object:", event);
          return null;
        }

        // Ensure dates are properly formatted
        const startDate = event.startDate ? new Date(event.startDate) : null;
        const endDate = event.endDate ? new Date(event.endDate) : null;
        const createdAt = event.createdAt ? new Date(event.createdAt) : null;
        const updatedAt = event.updatedAt ? new Date(event.updatedAt) : null;

        return {
          ...event,
          id: event._id,
          startDate,
          endDate,
          createdAt,
          updatedAt,
        };
      })
      .filter(Boolean); // Remove any null entries
  }, [events]);

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
      data: data || [], // Ensure data is always an array
      initialState: { pageIndex: 0, pageSize: 10 },
      getRowId: (row) => row?.id || "undefined", // Provide fallback for missing id
    },
    useSortBy,
    usePagination
  );

  const handleEdit = (event) => {
    setSelectedEvent(event);
    setShowModal(true);
  };

  const handleDeleteClick = (event) => {
    setDeleteModal({ isOpen: true, event });
  };

  const handleDelete = async () => {
    try {
      await deleteEvent(deleteModal.event._id);
      toast.success("Event deleted successfully");
      setDeleteModal({ isOpen: false, event: null });
    } catch (error) {
      console.error("Error deleting event:", error);
      toast.error(error.response?.data?.message || "Failed to delete event");
    }
  };

  if (eventsLoading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  if (eventsError) {
    return (
      <div className="flex h-96 items-center justify-center text-red-600">
        <p>Error loading events: {eventsError}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Events</h2>
        <button
          onClick={() => {
            setSelectedEvent(null);
            setShowModal(true);
          }}
          className="inline-flex items-center rounded-md bg-black px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-gray-800"
        >
          <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
          Add Event
        </button>
      </div>

      {data.length === 0 ? (
        <div className="flex h-48 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white">
          <div className="text-center">
            <p className="text-sm text-gray-500">No events found</p>
            <button
              onClick={() => {
                setSelectedEvent(null);
                setShowModal(true);
              }}
              className="mt-2 text-sm font-medium text-primary-600 hover:text-primary-500"
            >
              Create your first event
            </button>
          </div>
        </div>
      ) : (
        <>
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
                className="relative inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => nextPage()}
                disabled={!canNextPage}
                className="relative ml-3 inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
              >
                Next
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
                  className="relative inline-flex items-center rounded-md bg-white px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
                >
                  <ChevronLeftIcon className="h-5 w-5" />
                </button>
                <button
                  onClick={() => nextPage()}
                  disabled={!canNextPage}
                  className="relative inline-flex items-center rounded-md bg-white px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:opacity-50"
                >
                  <ChevronRightIcon className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, event: null })}
        onConfirm={handleDelete}
        title="Delete Event"
        message={`Are you sure you want to delete the event "${deleteModal.event?.title}"? This action cannot be undone.`}
      />

      {/* Event Modal */}
      {showModal && (
        <EventModal
          event={selectedEvent}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            fetchEvents();
          }}
        />
      )}
    </div>
  );
};

export default Events;
