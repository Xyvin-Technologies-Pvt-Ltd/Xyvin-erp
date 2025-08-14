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
  CalendarIcon,
  ClockIcon,
  DocumentTextIcon,
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
        Cell: ({ value }) => (
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-blue-100 to-indigo-200 rounded-full flex items-center justify-center">
              <CalendarIcon className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-sm font-semibold text-gray-900">{value}</div>
          </div>
        ),
      },
      {
        Header: "Description",
        accessor: "description",
        Cell: ({ value }) => (
          <div className="flex items-center space-x-2">
            <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-gray-100 to-gray-200 rounded-lg flex items-center justify-center">
              <DocumentTextIcon className="w-3 h-3 text-gray-600" />
            </div>
            <span className="text-sm text-gray-600 line-clamp-2">{value}</span>
          </div>
        ),
      },
      {
        Header: "Start Date",
        accessor: "startDate",
        Cell: ({ value }) => (
          <div className="flex items-center space-x-2">
            <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-green-50 to-emerald-100 rounded-lg flex items-center justify-center">
              <ClockIcon className="w-3 h-3 text-green-600" />
            </div>
            <span className="text-sm text-gray-600">
              {value ? new Date(value).toLocaleDateString() : "-"}
            </span>
          </div>
        ),
      },
      {
        Header: "End Date",
        accessor: "endDate",
        Cell: ({ value }) => (
          <div className="flex items-center space-x-2">
            <div className="flex-shrink-0 w-6 h-6 bg-gradient-to-br from-red-50 to-rose-100 rounded-lg flex items-center justify-center">
              <ClockIcon className="w-3 h-3 text-red-600" />
            </div>
            <span className="text-sm text-gray-600">
              {value ? new Date(value).toLocaleDateString() : "-"}
            </span>
          </div>
        ),
      },
      {
        Header: "Status",
        accessor: "status",
        Cell: ({ value }) => {
          const statusStyles = {
            upcoming: "from-blue-50 to-blue-100 text-blue-700 border-blue-200",
            ongoing: "from-green-50 to-green-100 text-green-700 border-green-200",
            completed: "from-gray-50 to-gray-100 text-gray-700 border-gray-200",
          };

          const style = statusStyles[value?.toLowerCase()] || statusStyles.completed;

          return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r border ${style}`}>
              {value?.charAt(0).toUpperCase() + value?.slice(1) || "Unknown"}
            </span>
          );
        },
      },
      {
        Header: "Actions",
        id: "actions",
        Header: () => (
          <div className="text-right">
            Actions
          </div>
        ),
        Cell: ({ row }) => (
          <div className="flex justify-end space-x-2 pr-4">
            <button
              onClick={() => handleEdit(row.original)}
              className="group p-1.5 rounded-lg hover:bg-gray-50 transition-all duration-200"
              title="Edit Event"
            >
              <PencilIcon className="h-4 w-4 text-gray-400 group-hover:text-gray-700" />
            </button>
            <button
              onClick={() => handleDeleteClick(row.original)}
              className="group p-1.5 rounded-lg hover:bg-red-50 transition-all duration-200"
              title="Delete Event"
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
      <div className="flex items-center justify-center min-h-[400px] bg-gradient-to-br from-gray-50 to-white">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600 mx-auto"></div>
          <p className="text-gray-500 font-medium">Loading events...</p>
        </div>
      </div>
    );
  }

  if (eventsError) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-gradient-to-br from-red-50 to-white">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-red-200 rounded-full flex items-center justify-center mx-auto">
            <span className="text-red-600 text-2xl">⚠</span>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-red-900">Error Loading Events</h3>
            <p className="text-red-600 mt-1">{eventsError}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 min-h-screen">
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Events
          </h1>
          <p className="text-gray-600">Manage and organize all company events</p>
        </div>
        <button
          onClick={() => {
            setSelectedEvent(null);
            setShowModal(true);
          }}
          className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
        >
          <PlusIcon className="-ml-1 mr-2 h-5 w-5" />
          Add Event
        </button>
      </div>

      {data.length === 0 ? (
        <div className="flex items-center justify-center min-h-[300px] rounded-2xl border-2 border-dashed border-gray-200 bg-white">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto">
              <CalendarIcon className="w-8 h-8 text-gray-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">No events found</h3>
              <p className="text-gray-500 mt-1">Get started by creating your first event</p>
            </div>
            {/* <button
              onClick={() => {
                setSelectedEvent(null);
                setShowModal(true);
              }}
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200"
            >
              <PlusIcon className="w-4 h-4 mr-2" />
              Add Event
            </button> */}
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full divide-y divide-gray-200 min-w-[800px]" {...getTableProps()}>
              <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                {headerGroups.map((headerGroup) => {
                  const { key, ...headerGroupProps } = headerGroup.getHeaderGroupProps();
                  return (
                    <tr key={key} {...headerGroupProps}>
                      {headerGroup.headers.map((column) => {
                        const { key, ...columnProps } = column.getHeaderProps(column.getSortByToggleProps());
                        return (
                          <th
                            key={key}
                            {...columnProps}
                            className={`px-6 py-4 text-xs font-bold text-gray-600 uppercase tracking-wider ${
                              column.id === 'actions' ? 'text-right' : 'text-left'
                            }`}
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
                                  <ChevronUpIcon className="h-4 w-4 text-gray-300 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
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
              <tbody className="divide-y divide-gray-100 bg-white" {...getTableBodyProps()}>
                {page.map((row, index) => {
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
                            className="px-6 py-4 whitespace-nowrap"
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

          {/* Pagination */}
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
                  ({data.length} total events)
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
        </div>
      )}

      {/* Modals */}
      <DeleteConfirmationModal
        isOpen={deleteModal.isOpen}
        onClose={() => setDeleteModal({ isOpen: false, event: null })}
        onConfirm={handleDelete}
        title="Delete Event"
        message={`Are you sure you want to delete the event "${deleteModal.event?.title}"? This action cannot be undone.`}
      />

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
