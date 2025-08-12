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
  FunnelIcon,
} from "@heroicons/react/24/outline";
import useHrmStore from "../../stores/useHrmStore";
import AttendanceModal from "../../components/modules/hrm/AttendanceModal";
import AttendanceEditModal from "../../components/modules/hrm/AttendanceEditModal";
import DeleteConfirmationModal from "../../components/common/DeleteConfirmationModal";

const AttendanceTypeIcons = () => {
  const icons = [
    { icon: SunIcon, label: "Present", color: "text-emerald-500", bg: "bg-emerald-50" },
    { icon: ClockIcon, label: "Late", color: "text-amber-500", bg: "bg-amber-50" },
    {
      icon: ArrowRightOnRectangleIcon,
      label: "Early-Leave",
      color: "text-orange-500",
      bg: "bg-orange-50"
    },
    { icon: CalendarDaysIcon, label: "Half-Day", color: "text-blue-500", bg: "bg-blue-50" },
    { icon: PaperAirplaneIcon, label: "On-Leave", color: "text-purple-500", bg: "bg-purple-50" },
    { icon: XMarkIcon, label: "Absent", color: "text-red-500", bg: "bg-red-50" },
    { icon: CalendarDaysIcon, label: "Holiday", color: "text-emerald-500", bg: "bg-emerald-50" },
    { icon: MoonIcon, label: "Day-Off", color: "text-gray-500", bg: "bg-gray-50" },
  ];

  return (
    <div className="mb-8">
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-100">
        <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center">
          <ExclamationCircleIcon className="h-4 w-4 mr-2 text-blue-500" />
          Status Legend
        </h3>
        <div className="flex flex-wrap items-center gap-4">
          {icons.map(({ icon: Icon, label, color, bg }) => (
            <div key={label} className={`flex items-center space-x-2 px-3 py-2 rounded-lg ${bg} transition-all duration-200 hover:scale-105`}>
              <Icon className={`h-4 w-4 ${color}`} />
              <span className="text-sm font-medium text-gray-700">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const SummaryCard = ({ icon: Icon, title, value, change, isIncrease }) => {
  return (
    <div className="group relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300 hover:scale-105">
      <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-gray-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      <div className="relative">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
            <p className="text-3xl font-bold text-gray-900 tracking-tight">{value}</p>
          </div>
          <div
            className={`rounded-2xl p-4 ${
              isIncrease 
                ? "bg-gradient-to-br from-emerald-50 to-emerald-100" 
                : "bg-gradient-to-br from-red-50 to-red-100"
            } transition-all duration-300 group-hover:scale-110`}
          >
            <Icon
              className={`h-6 w-6 ${
                isIncrease ? "text-emerald-600" : "text-red-600"
              }`}
            />
          </div>
        </div>
        <div className="mt-4 flex items-center">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
              isIncrease 
                ? "bg-emerald-100 text-emerald-800" 
                : "bg-red-100 text-red-800"
            }`}
          >
            {change}
          </span>
          <span className="text-sm text-gray-500 ml-2">vs last month</span>
        </div>
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
      return "bg-emerald-100 text-emerald-700 ring-emerald-200";
    case "Late":
      return "bg-amber-100 text-amber-700 ring-amber-200";
    case "Early-Leave":
      return "bg-orange-100 text-orange-700 ring-orange-200";
    case "Half-Day":
      return "bg-blue-100 text-blue-700 ring-blue-200";
    case "On-Leave":
      return "bg-purple-100 text-purple-700 ring-purple-200";
    case "Absent":
      return "bg-red-100 text-red-700 ring-red-200";
    case "Holiday":
      return "bg-pink-100 text-pink-700 ring-pink-200";
    case "Day-Off":
      return "bg-gray-100 text-gray-700 ring-gray-200";
    default:
      return "bg-gray-100 text-gray-700 ring-gray-200";
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
const statConfigs = [
  {
    key: "totalEmployees",
    title: "Total Employees",
    icon: UserGroupIcon,
  },
  {
    key: "present",
    title: (monthYear) => `Present (${monthYear})`,
    icon: CheckIcon,
  },
  {
    key: "late",
    title: (monthYear) => `Late (${monthYear})`,
    icon: ClockIcon,
  },
  {
    key: "absent",
    title: (monthYear) => `Absent (${monthYear})`,
    icon: XMarkIcon,
  },
  {
    key: "halfDay",
    title: (monthYear) => `Half-Day (${monthYear})`,
    icon: CalendarDaysIcon,
  },
  {
    key: "earlyLeave",
    title: (monthYear) => `Early-Leave (${monthYear})`,
    icon: ArrowRightOnRectangleIcon,
  },
  {
    key: "onLeave",
    title: (monthYear) => `On-Leave (${monthYear})`,
    icon: PaperAirplaneIcon,
  },
  {
    key: "holiday",
    title: (monthYear) => `Holiday (${monthYear})`,
    icon: CalendarDaysIcon,
  },
  {
    key: "dayOff",
    title: (monthYear) => `Day-Off (${monthYear})`,
    icon: MoonIcon,
  },
];

const Attendance = () => {
  const [selectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [attendanceToDelete, setAttendanceToDelete] = useState(null);
  const [isCheckingNextMonth, setIsCheckingNextMonth] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    employeeName: '',
    departmentId: '',
    positionId: '',
    date: ''
  });
  const [filtersLoading, setFiltersLoading] = useState(false);

  const {
    attendance,
    attendanceLoading,
    attendanceError,
    attendanceDepartments,
    attendancePositions,
    fetchAttendance,
    fetchAttendanceFilters,
    checkIn,
    getAttendanceStats,
    deleteAttendance,
  } = useHrmStore((state) => ({
    attendance: state.attendance,
    attendanceLoading: state.attendanceLoading,
    attendanceError: state.attendanceError,
    attendanceDepartments: state.attendanceDepartments,
    attendancePositions: state.attendancePositions,
    fetchAttendance: state.fetchAttendance,
    fetchAttendanceFilters: state.fetchAttendanceFilters,
    checkIn: state.checkIn,
    getAttendanceStats: state.getAttendanceStats,
    deleteAttendance: state.deleteAttendance,
  }));

  console.log("Available store functions:", useHrmStore());

  const [stats, setStats] = useState({
    totalEmployees: 0,
    present: 0,
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

  useEffect(() => {
    const loadFilters = async () => {
      try {
        await fetchAttendanceFilters();
      } catch (error) {
        console.error("Error loading attendance filters:", error);
        toast.error("Failed to load filter options. Some filters may not be available.");
      }
    };

    loadFilters();
  }, [fetchAttendanceFilters]);

  // Filter functions
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  useEffect(() => {
    const applyFiltersAutomatically = async () => {
      try {
        setFiltersLoading(true);
        const filterParams = {};
        
        if (!filters.date) {
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
          filterParams.startDate = startDate.toISOString();
          filterParams.endDate = endDate.toISOString();
        } else {
          filterParams.date = filters.date;
        }

        // Add other filters
        if (filters.employeeName) {
          filterParams.employeeName = filters.employeeName;
        }
        if (filters.departmentId) {
          filterParams.departmentId = filters.departmentId;
        }
        if (filters.positionId) {
          filterParams.positionId = filters.positionId;
        }

        const hasFilters = filters.employeeName || filters.departmentId || filters.positionId || filters.date;
        
        if (!hasFilters) {
          // No filters applied, show current month data
          await Promise.all([
            fetchAttendance(filterParams),
            getAttendanceStats(filterParams),
          ]);
        } else {
          // Apply filters automatically
          await Promise.all([
            fetchAttendance(filterParams),
            getAttendanceStats(filterParams),
          ]);
        }
      } catch (error) {
        console.error("Error applying filters automatically:", error);
        
        if (error.response?.status === 404) {
          toast.error(error.response?.data?.message || "No records found matching the filters");
        } else if (error.response?.status === 400) {
          toast.error(error.response?.data?.message || "Invalid filter parameters");
        } else {
          toast.error("Failed to apply filters. Please try again.");
        }
      } finally {
        setFiltersLoading(false);
      }
    };

    const timeoutId = setTimeout(() => {
      applyFiltersAutomatically();
    }, filters.employeeName ? 600 : 0); // 500ms delay for text input

    return () => clearTimeout(timeoutId);
  }, [filters, currentDate, fetchAttendance, getAttendanceStats]);

  const resetFilters = async () => {
    setFilters({
      employeeName: '',
      departmentId: '',
      positionId: '',
      date: ''
    });

    try {
      // Reload with current month's date range
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
      console.error("Error resetting filters:", error);
      toast.error("Failed to reset filters");
    }
  };

  const clearFilter = async (field) => {
    setFilters(prev => ({
      ...prev,
      [field]: ''
    }));
    
    // No need to manually apply filters - useEffect will handle it automatically
  };

  // Load attendance stats
useEffect(() => {
  const loadStats = async () => {
    try {
      const startDate = startOfMonth(currentDate);
      const endDate = endOfMonth(currentDate);

      if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
        console.error("Invalid date range for stats");
        toast.error("Invalid date range for statistics");
        return;
      }

      const response = await getAttendanceStats({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });
      console.log("API response:", response);

      // Handle both response.data.data and response.data
      const data = response.data.data || response.data;
      const { stats: apiStats, totalEmployees, changes } = data;

      setStats({
        totalEmployees: totalEmployees || 0,
        present: apiStats?.present || 0,
        halfDay: apiStats?.halfDay || 0,
        onLeave: apiStats?.onLeave || 0,
        absent: apiStats?.absent || 0,
        late: apiStats?.late || 0,
        earlyLeave: apiStats?.earlyLeave || 0,
        holiday: apiStats?.holiday || 0,
        dayOff: apiStats?.dayOff || 0,
        totalWorkHours: Number(apiStats?.totalWorkHours?.toFixed(2)) || 0,
        changes: {
          employees: changes?.employees || "0%",
          present: changes?.present || "0%",
          halfDay: changes?.halfDay || "0%",
          onLeave: changes?.onLeave || "0%",
          absent: changes?.absent || "0%",
          late: changes?.late || "0%",
          earlyLeave: changes?.earlyLeave || "0%",
          holiday: changes?.holiday || "0%",
          dayOff: changes?.dayOff || "0%",
          totalWorkHours: changes?.totalWorkHours || "0%",
        },
      });
    } catch (error) {
      console.error("Error loading attendance stats:", {
        message: error.message,
        response: error.response?.data,
        status: error.response?.status,
        config: error.config,
      });
      toast.error(error.response?.data?.message || "Failed to load attendance statistics");
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
      const nextMonth = new Date(currentDate);
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      const now = new Date();
      const wouldExceedCurrentMonth =
        nextMonth.getFullYear() > now.getFullYear() ||
        (nextMonth.getFullYear() === now.getFullYear() &&
          nextMonth.getMonth() > now.getMonth());

      if (wouldExceedCurrentMonth) {
        toast.error("Cannot navigate beyond the current month");
        return;
      }

      // Clear filters when navigating to a different month
      if (Object.values(filters).some(value => value !== '')) {
        setFilters({
          employeeName: '',
          departmentId: '',
          positionId: '',
          date: ''
        });
        toast.info("Filters cleared when navigating to a different month");
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
    // Clear filters when navigating to a different month
    if (Object.values(filters).some(value => value !== '')) {
      setFilters({
        employeeName: '',
        departmentId: '',
        positionId: '',
        date: ''
      });
      toast.info("Filters cleared when navigating to a different month");
    }

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
            <div className="flex-shrink-0 h-12 w-12">
              <div className="h-12 w-12 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                {row.original.employee
                  ? `${row.original.employee.firstName.charAt(0)}${row.original.employee.lastName.charAt(0)}`
                  : "UN"}
              </div>
            </div>
            <div>
              <p className="font-semibold text-gray-900">
                {row.original.employee
                  ? `${row.original.employee.firstName} ${row.original.employee.lastName}`
                  : "Unknown Employee"}
              </p>
              {/* <p className="text-sm text-gray-500 font-medium">
                ID: {row.original.employee.employeeId}
              </p> */}
            </div>
          </div>
        ),
      },
      {
        Header: "Department",
        accessor: "employee.department.name",
        Cell: ({ value }) => (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700 ring-1 ring-blue-200">
            {value}
          </span>
        ),
      },
      {
        Header: "Position",
        accessor: "employee.position.title",
        Cell: ({ value }) => (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 ring-1 ring-purple-200">
            {value}
          </span>
        ),
      },
      {
        Header: "Date",
        accessor: "date",
        Cell: ({ value }) => (
          <div className="text-sm">
            <div className="font-semibold text-gray-900">
              {new Date(value).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric' 
              })}
            </div>
            <div className="text-gray-500 text-xs">
              {new Date(value).toLocaleDateString('en-US', { 
                weekday: 'short' 
              })}
            </div>
          </div>
        ),
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
              <div className="inline-flex items-center rounded-lg px-3 py-2 text-xs font-semibold bg-pink-50 text-pink-700 ring-1 ring-pink-200">
                <CalendarDaysIcon className="mr-2 h-4 w-4" />
                Holiday
              </div>
            );
          }
          if (row.original.status === "On-Leave") {
            return (
              <div className="inline-flex items-center rounded-lg px-3 py-2 text-xs font-semibold bg-purple-50 text-purple-700 ring-1 ring-purple-200">
                <PaperAirplaneIcon className="mr-2 h-4 w-4" />
                On Leave
              </div>
            );
          }
          return (
            <div
              className={`inline-flex items-center rounded-lg px-3 py-2 text-xs font-semibold ${
                !time 
                  ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200" 
                  : "bg-gray-50 text-gray-700 ring-1 ring-gray-200"
              }`}
            >
              {!time && <ClockIcon className="mr-2 h-4 w-4" />}
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
              <div className="inline-flex items-center rounded-lg px-3 py-2 text-xs font-semibold bg-pink-50 text-pink-700 ring-1 ring-pink-200">
                <CalendarDaysIcon className="mr-2 h-4 w-4" />
                Holiday
              </div>
            );
          }
          if (row.original.status === "On-Leave") {
            return (
              <div className="inline-flex items-center rounded-lg px-3 py-2 text-xs font-semibold bg-purple-50 text-purple-700 ring-1 ring-purple-200">
                <PaperAirplaneIcon className="mr-2 h-4 w-4" />
                On Leave
              </div>
            );
          }
          return (
            <div
              className={`inline-flex items-center rounded-lg px-3 py-2 text-xs font-semibold ${
                !time 
                  ? "bg-amber-50 text-amber-700 ring-1 ring-amber-200" 
                  : "bg-gray-50 text-gray-700 ring-1 ring-gray-200"
              }`}
            >
              {!time && <ClockIcon className="mr-2 h-4 w-4" />}
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
              className={`inline-flex items-center rounded-lg px-3 py-2 text-xs font-semibold ring-1 ${colorClass}`}
            >
              <StatusIcon className="mr-2 h-4 w-4" aria-hidden="true" />
              <span>{value}</span>
            </div>
          );
        },
      },
      {
        Header: "Actions",
        id: "actions",
        Cell: ({ row }) => (
          <div className="flex items-center space-x-2">
            <button
              onClick={() => handleEdit(row.original)}
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-blue-600 hover:text-blue-700 hover:bg-blue-50 transition-all duration-200 hover:scale-110"
              title="Edit Attendance"
            >
              <PencilIcon className="h-4 w-4" />
            </button>
            <button
              onClick={() => handleDelete(row.original)}
              className="inline-flex items-center justify-center w-8 h-8 rounded-lg text-red-600 hover:text-red-700 hover:bg-red-50 transition-all duration-200 hover:scale-110"
              title="Delete Attendance"
            >
              <TrashIcon className="h-4 w-4" />
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
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent mb-4"></div>
          <p className="text-gray-600 font-medium">Loading attendance data...</p>
        </div>
      </div>
    );
  }

  if (attendanceError) {
    return (
      <div className="flex h-screen items-center justify-center bg-gradient-to-br from-red-50 to-pink-100">
        <div className="text-center p-8 bg-white rounded-2xl shadow-lg">
          <ExclamationCircleIcon className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <p className="text-red-600 font-semibold text-lg">{attendanceError}</p>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">

    <div className="space-y-8 p-4 sm:p-6 lg:p-8">
      <div className="text-left py-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Attendance Management
          </h1>
          <p className="text-gray-600 text-lg">Track and manage employee attendance with ease</p>
        </div>
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
          value={stats.present}
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
          {/* Filter Status */}
          {Object.values(filters).some(value => value !== '') && (
            <div className="mt-3 flex items-center space-x-2 text-sm text-gray-600">
              <FunnelIcon className="h-4 w-4 text-blue-500" />
              <span>Active filters:</span>
              {filters.employeeName && (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-blue-100 text-blue-800">
                  Name: {filters.employeeName}
                </span>
              )}
              {filters.departmentId && (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-green-100 text-green-800">
                  Dept: {attendanceDepartments.find(d => d._id === filters.departmentId)?.name || 'Unknown'}
                </span>
              )}
              {filters.positionId && (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-purple-100 text-purple-800">
                  Position: {attendancePositions.find(p => p._id === filters.positionId)?.title || 'Unknown'}
                </span>
              )}
              {filters.date && (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-orange-100 text-orange-800">
                  Date: {new Date(filters.date).toLocaleDateString()}
                </span>
              )}
              {data.length === 0 && (
                <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-red-100 text-red-800">
                  No results found
                </span>
              )}
            </div>
          )}
        </div>

        <div className="px-6 py-4">
          <AttendanceTypeIcons />

          {/* Filter Controls */}
          <div className="mb-6 bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-gray-700 flex items-center">
                <FunnelIcon className="h-4 w-4 mr-2 text-blue-500" />
                Filter Attendance Records 
              </h3>
              {Object.values(filters).some(value => value !== '') && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {Object.values(filters).filter(value => value !== '').length} active filter(s)
                </span>
              )}
            </div>
            
            {/* Loading State for Filters */}
            {attendanceDepartments.length === 0 && attendancePositions.length === 0 && (
              <div className="flex items-center justify-center py-8">
                <div className="text-center">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent mb-2"></div>
                  <p className="text-sm text-gray-600">Loading filter options...</p>
                </div>
              </div>
            )}
            
            {(attendanceDepartments.length > 0 || attendancePositions.length > 0) && (
              <div className="flex flex-wrap items-end gap-4">
                {/* Employee Name Filter */}
                <div className="flex-1 min-w-[200px] relative">
                  <label htmlFor="employeeName" className="block text-sm font-medium text-gray-700 mb-1">
                    Employee Name
                  </label>
                  <input
                    type="text"
                    id="employeeName"
                    placeholder="Type to search..."
                    value={filters.employeeName}
                    onChange={(e) => handleFilterChange('employeeName', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                    title="Search by first or last name"
                  />
                  {filters.employeeName && (
                    <button
                      onClick={() => clearFilter('employeeName')}
                      className="absolute right-2 top-8 text-gray-500 hover:text-gray-700"
                      title="Clear Employee Name filter"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Department Filter */}
                <div className="flex-1 min-w-[150px] relative">
                  <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1">
                    Department
                  </label>
                  <select
                    id="department"
                    value={filters.departmentId}
                    onChange={(e) => handleFilterChange('departmentId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                    title="Filter by department"
                    disabled={attendanceDepartments.length === 0}
                  >
                    <option value="">
                      {attendanceDepartments.length === 0 ? "No departments available" : "All Departments"}
                    </option>
                    {attendanceDepartments.map((dept) => (
                      <option key={dept._id} value={dept._id}>
                        {dept.name}
                      </option>
                    ))}
                  </select>
                  {filters.departmentId && (
                    <button
                      onClick={() => clearFilter('departmentId')}
                      className="absolute right-2 top-8 text-gray-500 hover:text-gray-700"
                      title="Clear Department filter"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Position Filter */}
                <div className="flex-1 min-w-[150px] relative">
                  <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-1">
                    Position
                  </label>
                  <select
                    id="position"
                    value={filters.positionId}
                    onChange={(e) => handleFilterChange('positionId', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                    title="Filter by position"
                    disabled={attendancePositions.length === 0}
                  >
                    <option value="">
                      {attendancePositions.length === 0 ? "No positions available" : "All Positions"}
                    </option>
                    {attendancePositions.map((pos) => (
                      <option key={pos._id} value={pos._id}>
                        {pos.title}
                      </option>
                    ))}
                  </select>
                  {filters.positionId && (
                    <button
                      onClick={() => clearFilter('positionId')}
                      className="absolute right-2 top-8 text-gray-500 hover:text-gray-700"
                      title="Clear Position filter"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Date Filter */}
                <div className="flex-1 min-w-[150px] relative">
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </label>
                  <input
                    type="date"
                    id="date"
                    value={filters.date}
                    onChange={(e) => handleFilterChange('date', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 text-sm"
                    title="Filter by specific date"
                  />
                  {filters.date && (
                    <button
                      onClick={() => clearFilter('date')}
                      className="absolute right-2 top-8 text-gray-500 hover:text-gray-700"
                      title="Clear Date filter"
                    >
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  )}
                </div>

                {/* Filter Actions */}
                <div className="min-w-[100px]">
                  <button
                    onClick={resetFilters}
                    className="w-full px-4 py-2 bg-gray-600 text-white text-sm font-medium rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-200"
                    title="Clear all filters and show current month data"
                  >
                    Reset
                  </button>
                </div>
              </div>
            )}
                      
            {attendanceDepartments.length === 0 && attendancePositions.length === 0 && (
              <div className="text-center py-4 text-sm text-gray-500">
                <p>Filter options are not available. You can still use the employee name and date filters.</p>
              </div>
            )}
          </div>

          {/* Table */}
          <div className="mt-4 flex flex-col">
            <div className="mb-4 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                {Object.values(filters).some(value => value !== '') ? (
                  <span>
                    Showing <span className="font-semibold text-gray-900">{data.length}</span> filtered results
                  </span>
                ) : (
                  <span>
                    Showing <span className="font-semibold text-gray-900">{data.length}</span> attendance records for {formatMonthYear(currentDate)}
                  </span>
                )}
              </div>
              {filtersLoading && (
                <div className="flex items-center text-sm text-blue-600">
                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-blue-600 border-t-transparent mr-2" />
                  Updating results...
                </div>
              )}
            </div>
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
                                {Object.values(filters).some(value => value !== '') 
                                  ? "No attendance records found matching the applied filters"
                                  : `No attendance records found for ${formatMonthYear(currentDate)}`
                                }
                              </p>
                              <p className="text-sm text-gray-400">
                                {Object.values(filters).some(value => value !== '') 
                                  ? "Try adjusting your filters or select a different date range"
                                  : "Try selecting a different month or add new attendance records"
                                }
                              </p>
                              {Object.values(filters).some(value => value !== '') && (
                                <button
                                  onClick={resetFilters}
                                  className="mt-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
                                >
                                  Clear Filters
                                </button>
                              )}
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
           {page.length > 0 && (
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
           )}
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
    </div>
  );
};

export default Attendance;
