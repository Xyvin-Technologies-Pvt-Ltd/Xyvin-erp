import { useEffect, useState, useMemo } from "react";
import { useTable, useSortBy, usePagination } from "react-table";
import { toast } from "react-hot-toast";
import { format, startOfMonth, endOfMonth } from "date-fns";
import {
  ChevronUpIcon,
  ChevronDownIcon,
  ClockIcon,
  UserGroupIcon,
  SunIcon,
  CalendarDaysIcon,
  CheckIcon,
  ExclamationCircleIcon,
  XMarkIcon,
  PaperAirplaneIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ArrowRightOnRectangleIcon,
  MoonIcon,
  PencilIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import useHrmStore from "../../stores/useHrmStore";
import AttendanceModal from "../../components/modules/hrm/AttendanceModal";
import AttendanceEditModal from "../../components/modules/hrm/AttendanceEditModal";
import DeleteConfirmationModal from "../../components/common/DeleteConfirmationModal";

const AttendanceTypeIcons = () => {
  const icons = [
    { icon: SunIcon, label: "Present", color: "text-green-500" },
    { icon: ClockIcon, label: "Late", color: "text-yellow-500" },
    {
      icon: ArrowRightOnRectangleIcon,
      label: "Early-Leave",
      color: "text-orange-500",
    },
    { icon: CalendarDaysIcon, label: "Half-Day", color: "text-blue-500" },
    { icon: PaperAirplaneIcon, label: "On-Leave", color: "text-purple-500" },
    { icon: XMarkIcon, label: "Absent", color: "text-red-500" },
    { icon: CalendarDaysIcon, label: "Holiday", color: "text-green-500" },
    { icon: MoonIcon, label: "Day-Off", color: "text-gray-500" },
  ];

  return (
    <div className="mb-6">
      <div className="flex flex-wrap items-center gap-4">
        <span className="font-medium text-gray-700">Note:</span>
        {icons.map(({ icon: Icon, label, color }) => (
          <div key={label} className="flex items-center space-x-2">
            <Icon className={`h-5 w-5 ${color}`} />
            <span className="text-sm text-gray-600">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

const SummaryCard = ({ icon: Icon, title, value, change, isIncrease }) => {
  return (
    <div className="rounded-lg bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="mt-2 text-3xl font-semibold text-gray-900">{value}</p>
        </div>
        <div
          className={`rounded-full p-3 ${
            isIncrease ? "bg-green-100" : "bg-red-100"
          }`}
        >
          <Icon
            className={`h-6 w-6 ${
              isIncrease ? "text-green-600" : "text-red-600"
            }`}
          />
        </div>
      </div>
      <div className="mt-4">
        <span
          className={`text-sm font-medium ${
            isIncrease ? "text-green-600" : "text-red-600"
          }`}
        >
          {change}
        </span>
        <span className="text-sm text-gray-500"> vs last month</span>
      </div>
    </div>
  );
};

const getStatusIcon = (status) => {
  switch (status) {
    case "Present":
      return SunIcon;
    case "Late":
      return ClockIcon;
    case "Early-Leave":
      return ArrowRightOnRectangleIcon;
    case "Half-Day":
      return CalendarDaysIcon;
    case "On-Leave":
      return PaperAirplaneIcon;
    case "Absent":
      return XMarkIcon;
    case "Holiday":
      return CalendarDaysIcon;
    case "Day-Off":
      return MoonIcon;
    default:
      return XMarkIcon;
  }
};

const getStatusColor = (status) => {
  switch (status) {
    case "Present":
      return "bg-green-100 text-green-500";
    case "Late":
      return "bg-yellow-100 text-yellow-500";
    case "Early-Leave":
      return "bg-orange-100 text-orange-500";
    case "Half-Day":
      return "bg-blue-100 text-blue-500";
    case "On-Leave":
      return "bg-purple-100 text-purple-500";
    case "Absent":
      return "bg-red-100 text-red-500";
    case "Holiday":
      return "bg-pink-100 text-pink-500";
    case "Day-Off":
      return "bg-gray-100 text-gray-500";
    default:
      return "bg-gray-100 text-gray-500";
  }
};

const formatTime = (dateObj, status, isHoliday) => {
  if (status === "Holiday" || isHoliday) {
    return "Not checked in - Holiday";
  }
  if (status === "On-Leave") {
    return "Not checked in - On Leave";
  }
  if (!dateObj) return null;
  try {
    // Handle both direct date strings and nested time objects
    const dateString = dateObj.time ? dateObj.time : dateObj;
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return null; // Invalid date
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch (error) {
    console.error("Error formatting date:", error);
    return null;
  }
};

const Attendance = () => {
  const [selectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [attendanceToDelete, setAttendanceToDelete] = useState(null);
  const [isCheckingNextMonth, setIsCheckingNextMonth] = useState(false);

  const {
    attendance,
    attendanceLoading,
    attendanceError,
    fetchAttendance,
    checkIn,
    getAttendanceStats,
    deleteAttendance,
  } = useHrmStore((state) => ({
    attendance: state.attendance,
    attendanceLoading: state.attendanceLoading,
    attendanceError: state.attendanceError,
    fetchAttendance: state.fetchAttendance,
    checkIn: state.checkIn,
    getAttendanceStats: state.getAttendanceStats,
    deleteAttendance: state.deleteAttendance,
  }));

  console.log("Available store functions:", useHrmStore());

  const [stats, setStats] = useState({
    totalEmployees: 0,
    presentCount: 0,
    halfDay: 0,
    onLeave: 0,
    absent: 0,
    late: 0,
    earlyLeave: 0,
    holiday: 0,
    dayOff: 0,
    totalWorkHours: 0,
    changes: {
      employees: "0%",
      present: "0%",
      halfDay: "0%",
      onLeave: "0%",
      absent: "0%",
      late: "0%",
      earlyLeave: "0%",
      holiday: "0%",
      dayOff: "0%",
      totalWorkHours: "0%",
    },
  });

  // Load initial data with date range
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        // Get current month's date range
        const startDate = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          1
        );
        const endDate = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth() + 1,
          0
        );

        await fetchAttendance({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        });
      } catch (error) {
        console.error("Error loading initial data:", error);
        toast.error("Failed to load attendance data");
      }
    };

    loadInitialData();
  }, [currentDate]); // Run when currentDate changes

  // Load attendance stats
  useEffect(() => {
    const loadStats = async () => {
      try {
        const startDate = startOfMonth(currentDate);
        const endDate = endOfMonth(currentDate);

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
          console.error('Invalid date range');
          toast.error('Invalid date range for statistics');
          return;
        }

        const response = await getAttendanceStats({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        });

        if (response?.data) {
          const { stats: apiStats, totalEmployees, changes } = response.data;
          
          setStats({
            totalEmployees: totalEmployees || 0,
            presentCount: apiStats?.present || 0,
            halfDay: apiStats?.halfDay || 0,
            onLeave: apiStats?.onLeave || 0,
            absent: apiStats?.absent || 0,
            late: apiStats?.late || 0,
            earlyLeave: apiStats?.earlyLeave || 0,
            holiday: apiStats?.holiday || 0,
            dayOff: apiStats?.dayOff || 0,
            totalWorkHours: Number(apiStats?.totalWorkHours?.toFixed(2)) || 0,
            changes: {
              employees: changes?.employees || '0%',
              present: changes?.present || '0%',
              halfDay: changes?.halfDay || '0%',
              onLeave: changes?.onLeave || '0%',
              absent: changes?.absent || '0%',
              late: changes?.late || '0%',
              earlyLeave: changes?.earlyLeave || '0%',
              holiday: changes?.holiday || '0%',
              dayOff: changes?.dayOff || '0%',
              totalWorkHours: changes?.totalWorkHours || '0%'
            }
          });

          if (Array.isArray(apiStats?.records)) {
            useHrmStore.setState({ 
              attendance: apiStats.records,
              attendanceStats: apiStats,
              totalEmployees: totalEmployees
            });
          }
        }
      } catch (error) {
        console.error('Error loading attendance stats:', error);
        toast.error('Failed to load attendance statistics');
      }
    };

    loadStats();
  }, [currentDate, getAttendanceStats]);

  const handleCheckIn = async () => {
    try {
      await checkIn({ date: selectedDate });
      toast.success("Checked in successfully");
      // Refresh both attendance list and stats with current month's date range
      const startDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth(),
        1
      );
      const endDate = new Date(
        currentDate.getFullYear(),
        currentDate.getMonth() + 1,
        0
      );
      await Promise.all([
        fetchAttendance({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        }),
        getAttendanceStats({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        }),
      ]);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to check in");
    }
  };

  const handleEdit = (attendance) => {
    setSelectedAttendance(attendance);
    setShowEditModal(true);
  };

  const handleDelete = (attendance) => {
    setAttendanceToDelete(attendance);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      if (!attendanceToDelete?._id) {
        toast.error("Invalid attendance record");
        return;
      }

      const response = await deleteAttendance(attendanceToDelete._id);

      if (response?.success) {
        toast.success("Attendance record deleted successfully");
        // Refresh both attendance list and stats with current month's date range
        const startDate = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth(),
          1
        );
        const endDate = new Date(
          currentDate.getFullYear(),
          currentDate.getMonth() + 1,
          0
        );
        await Promise.all([
          fetchAttendance({
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          }),
          getAttendanceStats({
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          }),
        ]);
      } else {
        throw new Error(
          response?.message || "Failed to delete attendance record"
        );
      }
    } catch (error) {
      console.error("Delete attendance error:", error);
      toast.error(
        error.response?.data?.message ||
          error.message ||
          "Failed to delete attendance record. Please try again later."
      );
    } finally {
      setDeleteModalOpen(false);
      setAttendanceToDelete(null);
    }
  };

  const handleNextMonth = async () => {
    try {
      setIsCheckingNextMonth(true);
      // Calculate next month's date range
      const nextMonth = new Date(currentDate);
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      const now = new Date();
      // Only prevent navigation if we're trying to go beyond current month/year
      const wouldExceedCurrentMonth =
        nextMonth.getFullYear() > now.getFullYear() ||
        (nextMonth.getFullYear() === now.getFullYear() &&
          nextMonth.getMonth() > now.getMonth());

      if (wouldExceedCurrentMonth) {
        toast.error("Cannot navigate beyond the current month");
        return;
      }

      setCurrentDate(nextMonth);
    } catch (error) {
      console.error("Error navigating to next month:", error);
      toast.error("Failed to navigate to next month");
    } finally {
      setIsCheckingNextMonth(false);
    }
  };

  const handlePreviousMonth = () => {
    const prevMonth = new Date(currentDate);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
    setCurrentDate(prevMonth);
  };

  const formatMonthYear = (date) => {
    return date.toLocaleDateString("en-US", { month: "long", year: "numeric" });
  };

  const columns = useMemo(
    () => [
      {
        Header: "Employee",
        accessor: (row) => `${row.employee.firstName} ${row.employee.lastName}`,
        Cell: ({ row }) => (
          <div className="flex items-center space-x-3">
            <div>
            <p className="font-medium text-gray-900">
          {row.original.employee
            ? `${row.original.employee.firstName} ${row.original.employee.lastName}`
            : "Unknown Employee"}
        </p>
              <p className="text-sm text-gray-500">
                {row.original.employee.employeeId}
              </p>
            </div>
          </div>
        ),
      },
      {
        Header: "Department",
        accessor: "employee.department.name",
      },
      {
        Header: "Position",
        accessor: "employee.position.title",
      },
      {
        Header: "Date",
        accessor: "date",
        Cell: ({ value }) => new Date(value).toLocaleDateString(),
        sortType: "datetime",
      },
      {
        Header: "Check In",
        accessor: "checkIn",
        Cell: ({ row }) => {
          const time = formatTime(
            row.original.checkIn,
            row.original.status,
            row.original.isHoliday
          );
          if (row.original.status === "Holiday" || row.original.isHoliday) {
            return (
              <div className="inline-flex items-center rounded-full bg-pink-100 px-2.5 py-0.5 text-xs font-medium text-pink-500">
                <CalendarDaysIcon className="mr-1 h-4 w-4" />
                {time}
              </div>
            );
          }
          if (row.original.status === "On-Leave") {
            return (
              <div className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-500">
                <PaperAirplaneIcon className="mr-1 h-4 w-4" />
                {time}
              </div>
            );
          }
          return (
            <div
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                !time ? "bg-yellow-100 text-yellow-500" : "text-gray-500"
              }`}
            >
              {!time && <ClockIcon className="mr-1 h-4 w-4" />}
              {time || "Not checked in"}
            </div>
          );
        },
        sortType: (rowA, rowB) => {
          const a = rowA.original.checkIn?.time || rowA.original.createdAt;
          const b = rowB.original.checkIn?.time || rowB.original.createdAt;
          return new Date(a) - new Date(b);
        },
      },
      {
        Header: "Check Out",
        accessor: "checkOut",
        Cell: ({ row }) => {
          const time = formatTime(
            row.original.checkOut,
            row.original.status,
            row.original.isHoliday
          );
          if (row.original.status === "Holiday" || row.original.isHoliday) {
            return (
              <div className="inline-flex items-center rounded-full bg-pink-100 px-2.5 py-0.5 text-xs font-medium text-pink-500">
                <CalendarDaysIcon className="mr-1 h-4 w-4" />
                {time}
              </div>
            );
          }
          if (row.original.status === "On-Leave") {
            return (
              <div className="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-medium text-purple-500">
                <PaperAirplaneIcon className="mr-1 h-4 w-4" />
                {time}
              </div>
            );
          }
          return (
            <div
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                !time ? "bg-yellow-100 text-yellow-500" : "text-gray-500"
              }`}
            >
              {!time && <ClockIcon className="mr-1 h-4 w-4" />}
              {time || "Not checked out"}
            </div>
          );
        },
        sortType: (rowA, rowB) => {
          const a = rowA.original.checkOut?.time;
          const b = rowB.original.checkOut?.time;
          if (!a && !b) return 0;
          if (!a) return 1;
          if (!b) return -1;
          return new Date(a) - new Date(b);
        },
      },
      {
        Header: "Status",
        accessor: "status",
        Cell: ({ value }) => {
          const StatusIcon = getStatusIcon(value);
          const colorClass = getStatusColor(value);
          return (
            <div
              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${colorClass}`}
            >
              <StatusIcon className="mr-1 h-4 w-4" aria-hidden="true" />
              <span>{value}</span>
            </div>
          );
        },
      },
      {
        Header: "Actions",
        id: "actions",
        Cell: ({ row }) => (
          <div className="flex items-center space-x-3">
            <button
              onClick={() => handleEdit(row.original)}
              className="text-blue-600 hover:text-blue-900 transition-colors duration-200"
              title="Edit Attendance"
            >
              <PencilIcon className="h-5 w-5" />
            </button>
            <button
              onClick={() => handleDelete(row.original)}
              className="text-red-600 hover:text-red-900 transition-colors duration-200"
              title="Delete Attendance"
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
    return Array.isArray(attendance)
      ? attendance.filter((record) => record.employee != null)
      : [];
  }, [attendance]);

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

  // Update isCurrentMonth calculation to check if we're at current month AND year
  const now = new Date();
  const isCurrentMonth =
    currentDate.getMonth() === now.getMonth() &&
    currentDate.getFullYear() === now.getFullYear();

  if (attendanceLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  if (attendanceError) {
    return (
      <div className="flex h-full items-center justify-center text-red-600">
        {attendanceError}
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          icon={UserGroupIcon}
          title="Total Employees"
          value={stats.totalEmployees}
          change={stats.changes.employees}
          isIncrease={!stats.changes.employees.startsWith('-')}
        />
        <SummaryCard
          icon={CheckIcon}
          title={`Present (${formatMonthYear(currentDate)})`}
          value={stats.presentCount}
          change={stats.changes.present}
          isIncrease={!stats.changes.present.startsWith('-')}
        />
        <SummaryCard
          icon={ClockIcon}
          title={`Late (${formatMonthYear(currentDate)})`}
          value={stats.late}
          change={stats.changes.late}
          isIncrease={!stats.changes.late.startsWith('-')}
        />
        <SummaryCard
          icon={XMarkIcon}
          title={`Absent (${formatMonthYear(currentDate)})`}
          value={stats.absent}
          change={stats.changes.absent}
          isIncrease={!stats.changes.absent.startsWith('-')}
        />
      </div>

      <div className="rounded-lg bg-white shadow">
        <div className="border-b border-gray-200 px-6 py-4">
          <div className="sm:flex sm:items-center sm:justify-between">
            <h2 className="text-xl font-semibold text-gray-900">
              Attendance Management
            </h2>
            <div className="mt-4 sm:mt-0 sm:flex sm:items-center sm:space-x-4">
              <div className="flex items-center space-x-4">
                <button
                  onClick={handlePreviousMonth}
                  className="btn btn-icon btn-secondary transition-all duration-200 hover:scale-105"
                  title="Previous Month"
                >
                  <ChevronLeftIcon className="h-5 w-5" />
                </button>
                <span className="min-w-[200px] text-center text-lg font-medium text-gray-900">
                  {formatMonthYear(currentDate)}
                </span>
                <button
                  onClick={handleNextMonth}
                  disabled={isCheckingNextMonth || isCurrentMonth}
                  className={`btn btn-icon btn-secondary transition-all duration-200 hover:scale-105 ${
                    isCheckingNextMonth || isCurrentMonth
                      ? "opacity-50 cursor-not-allowed"
                      : ""
                  }`}
                  title={
                    isCurrentMonth
                      ? "Cannot navigate beyond current month"
                      : "Next Month"
                  }
                >
                  {isCheckingNextMonth ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-blue-600" />
                  ) : (
                    <ChevronRightIcon className="h-5 w-5" />
                  )}
                </button>
              </div>
              <button
                onClick={() => setShowModal(true)}
                className="btn btn-secondary mt-3 inline-flex w-full items-center justify-center sm:mt-0 sm:w-auto"
              >
                <UserGroupIcon className="-ml-1 mr-2 h-5 w-5" />
                Bulk Attendance
              </button>
            </div>
          </div>
        </div>

        <div className="px-6 py-4">
          <AttendanceTypeIcons />

          {/* Table */}
          <div className="mt-4 flex flex-col">
            <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
              <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table
                    className="min-w-full divide-y divide-gray-300"
                    {...getTableProps()}
                  >
                    <thead className="bg-gray-50">
                      {headerGroups.map((headerGroup) => {
                        const { key, ...headerGroupProps } =
                          headerGroup.getHeaderGroupProps();
                        return (
                          <tr key={key} {...headerGroupProps}>
                            {headerGroup.headers.map((column) => {
                              const { key, ...columnProps } =
                                column.getHeaderProps(
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
                      {(!data || data.length === 0) && (
                        <tr>
                          <td
                            colSpan={columns.length}
                            className="px-3 py-8 text-center"
                          >
                            <div className="flex flex-col items-center justify-center space-y-2">
                              <CalendarDaysIcon className="h-8 w-8 text-gray-400" />
                              <p className="text-base font-medium text-gray-500">
                                No attendance records found for{" "}
                                {formatMonthYear(currentDate)}
                              </p>
                              <p className="text-sm text-gray-400">
                                Try selecting a different month or add new
                                attendance records
                              </p>
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>

          {/* Pagination */}
          <div className="flex justify-center gap-2 mt-4">
            <button
              onClick={() => previousPage()}
              disabled={!canPreviousPage}
              className="btn btn-icon btn-secondary transition-all duration-200 hover:scale-105"
              title="Previous Page"
            >
              <ChevronLeftIcon className="h-5 w-5" />
            </button>
            <span className="py-2 px-3 text-sm">
              Page {pageIndex + 1} of {pageOptions.length}
            </span>
            <button
              onClick={() => nextPage()}
              disabled={!canNextPage}
              className={`btn btn-icon btn-secondary transition-all duration-200 hover:scale-105 ${
                !canNextPage ? "opacity-50 cursor-not-allowed" : ""
              }`}
              title="Next Page"
            >
              <ChevronRightIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Attendance Modal */}
      {showModal && (
        <AttendanceModal
          attendance={selectedAttendance}
          onClose={() => {
            setShowModal(false);
            setSelectedAttendance(null);
          }}
          onSuccess={async () => {
            setShowModal(false);
            setSelectedAttendance(null);
            // Refresh both attendance list and stats with current month's date range
            const startDate = new Date(
              currentDate.getFullYear(),
              currentDate.getMonth(),
              1
            );
            const endDate = new Date(
              currentDate.getFullYear(),
              currentDate.getMonth() + 1,
              0
            );
            await Promise.all([
              fetchAttendance({
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
              }),
              getAttendanceStats({
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
              }),
            ]);
          }}
        />
      )}

      {/* Edit Attendance Modal */}
      {showEditModal && (
        <AttendanceEditModal
          attendance={selectedAttendance}
          onClose={() => {
            setShowEditModal(false);
            setSelectedAttendance(null);
          }}
          onSuccess={async () => {
            setShowEditModal(false);
            setSelectedAttendance(null);
            // Refresh both attendance list and stats with current month's date range
            const startDate = new Date(
              currentDate.getFullYear(),
              currentDate.getMonth(),
              1
            );
            const endDate = new Date(
              currentDate.getFullYear(),
              currentDate.getMonth() + 1,
              0
            );
            await Promise.all([
              fetchAttendance({
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
              }),
              getAttendanceStats({
                startDate: startDate.toISOString(),
                endDate: endDate.toISOString(),
              }),
            ]);
          }}
        />
      )}

      {/* Add DeleteConfirmationModal */}
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setAttendanceToDelete(null);
        }}
        onConfirm={confirmDelete}
        title="Delete Attendance Record"
        message={
          attendanceToDelete
            ? `Are you sure you want to delete the attendance record for ${
                attendanceToDelete.employee.firstName
              } ${attendanceToDelete.employee.lastName} on ${new Date(
                attendanceToDelete.date
              ).toLocaleDateString()}?`
            : ""
        }
      />
    </div>
  );
};

export default Attendance;
