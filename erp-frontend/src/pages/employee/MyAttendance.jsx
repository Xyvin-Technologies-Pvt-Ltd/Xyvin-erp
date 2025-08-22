import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { format, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { toast } from "react-hot-toast";
import useHrmStore from "@/stores/useHrmStore";
import {
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  DownloadIcon,
  MoonIcon,
  SunIcon,
  BedIcon,
  CoffeeIcon,
  BriefcaseIcon,
  UserIcon,
  HeartIcon,
  TimerIcon,
  BellIcon,
} from "lucide-react";
import {
  ArrowRightOnRectangleIcon,
  CalendarDaysIcon,
  PaperAirplaneIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

const StatsCard = ({ icon: Icon, title, value, color }) => (
  <div className="bg-white rounded-lg p-3 shadow-sm border">
    <div className="flex items-center gap-3">
      <div className={`p-2 ${color} rounded-full`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs text-gray-500">{title}</p>
        <p className="text-lg font-bold">{value}</p>
      </div>
    </div>
  </div>
);

const ITEMS_PER_PAGE = 10;

const MyAttendance = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [monthlyAttendance, setMonthlyAttendance] = useState([]);
  const [selectedDayAttendance, setSelectedDayAttendance] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    present: 0,
    absent: 0,
    late: 0,
    halfDay: 0,
    earlyLeave: 0,
    onLeave: 0,
    holiday: 0,
    dayOff: 0,
    totalWorkHours: 0,
  });

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      const startDate = format(startOfMonth(currentMonth), "yyyy-MM-dd");
      const endDate = format(endOfMonth(currentMonth), "yyyy-MM-dd");
      const store = useHrmStore.getState();
      const response = await store.getMyAttendance({ startDate, endDate });
      const { attendance, overallStats, monthlyStats } = response.data;

      setMonthlyAttendance(attendance);
      
      // Use the current month and year to get the correct monthly stats
      const currentMonthYear = format(currentMonth, "MMMM yyyy");
      const currentMonthStats = monthlyStats[currentMonthYear] || overallStats;

      setStats({
        total: currentMonthStats.total || 0,
        present: currentMonthStats.present || 0,
        absent: currentMonthStats.absent || 0,
        late: currentMonthStats.late || 0,
        halfDay: currentMonthStats.halfDay || 0,
        earlyLeave: currentMonthStats.earlyLeave || 0,
        onLeave: currentMonthStats.onLeave || currentMonthStats["on-leave"] || 0,
        holiday: attendance.filter((a) => a.isHoliday).length,
        dayOff: attendance.filter((a) => a.isWeekend).length,
        totalWorkHours: currentMonthStats.totalWorkHours || 0,
      });

      setCurrentPage(1);
    } catch (error) {
      toast.error(
        error.response?.data?.message || "Failed to fetch attendance data"
      );
    } finally {
      setLoading(false);
    }
  };

  // Fetch data when month changes
  useEffect(() => {
    fetchAttendanceData();
  }, [currentMonth]);

  // Update selected day attendance
  useEffect(() => {
    const dayAttendance = monthlyAttendance.find(
      (record) =>
        format(parseISO(record.date), "yyyy-MM-dd") ===
        format(selectedDate, "yyyy-MM-dd")
    );
    setSelectedDayAttendance(dayAttendance);
  }, [selectedDate, monthlyAttendance]);

  const handleDownload = () => {
    const monthAttendanceData = {
      month: format(currentMonth, "MMMM yyyy"),
      attendance: monthlyAttendance,
    };
    const blob = new Blob([JSON.stringify(monthAttendanceData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance-${format(currentMonth, "yyyy-MM")}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const totalPages = Math.ceil(monthlyAttendance.length / ITEMS_PER_PAGE);
  const paginatedData = monthlyAttendance.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const statsCards = [
    {
      icon: SunIcon,
      title: "Present",
      value: stats.present,
      color: "bg-green-100 text-green-500",
    },
    {
      icon: XMarkIcon,
      title: "Absent",
      value: stats.absent,
      color: "bg-red-100 text-red-500",
    },
    {
      icon: ClockIcon,
      title: "Late",
      value: stats.late,
      color: "bg-yellow-100 text-yellow-500",
    },
    {
      icon: ArrowRightOnRectangleIcon,
      title: "Early-Leave",
      value: stats.earlyLeave,
      color: "bg-orange-100 text-orange-500",
    },
    {
      icon: CalendarDaysIcon,
      title: "Half-Day",
      value: stats.halfDay,
      color: "bg-blue-100 text-blue-500",
    },
    {
      icon: PaperAirplaneIcon,
      title: "On-Leave",
      value: stats.onLeave,
      color: "bg-purple-100 text-purple-500",
    },
    {
      icon: CalendarDaysIcon,
      title: "Holiday",
      value: stats.holiday,
      color: "bg-pink-100 text-pink-500",
    },
    {
      icon: MoonIcon,
      title: "Day-Off",
      value: stats.dayOff,
      color: "bg-gray-100 text-gray-500",
    },
    {
      icon: TimerIcon,
      title: "Work Hours",
      value: `${Math.round(stats.totalWorkHours)}h`,
      color: "bg-blue-100 text-blue-500",
    },
  ];

  return (
    <div className="container max-w-7xl mx-auto p-2 sm:p-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold">My Attendance</h1>
        <Button onClick={handleDownload} className="flex items-center gap-2">
          <DownloadIcon className="h-4 w-4" />
          <span className="hidden sm:inline">Download Monthly Report</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 mb-4">
        {statsCards.map((card, index) => (
          <StatsCard key={index} {...card} />
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
        <Card className="p-2 sm:p-3">
          <div className="flex justify-between items-center mb-2 px-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                setCurrentMonth(
                  (prev) => new Date(prev.getFullYear(), prev.getMonth() - 1)
                )
              }
              className="h-6 w-6"
            >
              <ChevronLeftIcon className="h-3 w-3" />
            </Button>
            <span className="text-xs sm:text-sm font-medium">
              {format(currentMonth, "MMMM yyyy")}
            </span>
            <Button
              variant="ghost"
              size="icon"
              onClick={() =>
                setCurrentMonth(
                  (prev) => new Date(prev.getFullYear(), prev.getMonth() + 1)
                )
              }
              className="h-6 w-6"
            >
              <ChevronRightIcon className="h-3 w-3" />
            </Button>
          </div>

          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            month={currentMonth}
            className="w-full scale-90 origin-top"
            classNames={{
              months: "flex",
              month: "w-full",
              caption: "hidden",
              nav: "hidden",
              table: "w-full",
              head_row: "flex",
              head_cell: "text-gray-500 w-8 font-normal text-[0.6rem]",
              row: "flex w-full mt-1",
              cell: "text-center text-[0.6rem] p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md",
              day: "h-6 w-6 p-0 font-normal aria-selected:opacity-100",
              day_selected:
                "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
              day_today: "bg-accent text-accent-foreground",
              day_outside: "text-muted-foreground opacity-50",
              day_disabled: "text-muted-foreground opacity-50",
              day_range_middle:
                "aria-selected:bg-accent aria-selected:text-accent-foreground",
              day_hidden: "invisible",
            }}
          />
        </Card>

        <Card className="lg:col-span-2 p-2 sm:p-4">
          <h2 className="text-base sm:text-lg font-medium mb-4">
            Attendance Details - {format(selectedDate, "MMMM d, yyyy")}
          </h2>
          {selectedDayAttendance ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-4 p-2 sm:p-4 border rounded-lg">
              <div>
                <p className="text-xs sm:text-sm text-gray-500">Check In</p>
                <p className="text-sm sm:text-base font-medium">
                  {selectedDayAttendance.checkIn?.time
                    ? format(
                        parseISO(selectedDayAttendance.checkIn.time),
                        "hh:mm a"
                      )
                    : "-"}
                </p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-500">Check Out</p>
                <p className="text-sm sm:text-base font-medium">
                  {selectedDayAttendance.checkOut?.time
                    ? format(
                        parseISO(selectedDayAttendance.checkOut.time),
                        "hh:mm a"
                      )
                    : "-"}
                </p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-500">Total Hours</p>
                <p className="text-sm sm:text-base font-medium">
                  {selectedDayAttendance.workHours
                    ? `${selectedDayAttendance.workHours}h`
                    : "-"}
                </p>
              </div>
              <div>
                <p className="text-xs sm:text-sm text-gray-500">Status</p>
                <p className="text-sm sm:text-base font-medium">
                  {selectedDayAttendance.status}
                </p>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-500">
              No attendance record for this date
            </div>
          )}
        </Card>
      </div>

      <Card className="p-4">
        <h2 className="text-lg font-medium mb-4">Monthly Attendance Log</h2>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">Date</th>
                <th className="text-left p-2">Check In</th>
                <th className="text-left p-2">Check Out</th>
                <th className="text-left p-2">Work Hours</th>
                <th className="text-left p-2">RT </th>
                <th className="text-left p-2">OT </th>
                <th className="text-left p-2">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="text-center p-4">
                    Loading...
                  </td>
                </tr>
              ) : paginatedData.length > 0 ? (
                paginatedData.map((record, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="p-2">
                      {format(parseISO(record.date), "MMM dd, yyyy")}
                    </td>
                    <td className="p-2">
                      {record.checkIn?.time
                        ? format(parseISO(record.checkIn.time), "hh:mm a")
                        : "-"}
                    </td>
                    <td className="p-2">
                      {record.checkOut?.time
                        ? format(parseISO(record.checkOut.time), "hh:mm a")
                        : "-"}
                    </td>
                    <td className="p-2">
                      {record.workHours ? `${record.workHours}h` : "-"}
                    </td>
                    <td className="p-2">
                      {(() => {
                        const workHrs = Number(record.workHours || 0);
                        const rt = Math.max(0, Math.min(8, workHrs));
                        return rt ? `${Math.round(rt * 100) / 100}h` : "-";
                      })()}
                    </td>
                    <td className="p-2">
                      {(() => {
                        const workHrs = Number(record.workHours || 0);
                        const ot = Math.max(0, Math.round((workHrs - 8) * 100) / 100);
                        return ot ? `${ot}h` : "-";
                      })()}
                    </td>
                    <td className="p-2">{record.status}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center p-4">
                    No attendance records found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              Previous
            </Button>
            <span className="py-2 px-3 text-sm">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                setCurrentPage((prev) => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages}
            >
              Next
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
};

export default MyAttendance;
