import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { createRoot } from "react-dom/client";
import { flushSync } from "react-dom";
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
import DownloadMonthlydata from "./DownloadMonthlydata";

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
  const [downloadAttendanceData, setDownloadAttendanceData] = useState(false);
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

  const formatHoursToHM = (hoursDecimal) => {
    if (hoursDecimal === null || hoursDecimal === undefined) return "-";
    const num = Number(hoursDecimal);
    if (isNaN(num)) return "-";
    const totalMinutes = Math.round(num * 60);
    if (totalMinutes === 0) return "-";
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    return `${hours}:${String(minutes).padStart(2, "0")}`;
  };

  const fetchAttendanceData = async () => {
    try {
      setLoading(true);
      const startDate = format(startOfMonth(currentMonth), "yyyy-MM-dd");
      const endDate = format(endOfMonth(currentMonth), "yyyy-MM-dd");
      const store = useHrmStore.getState();
      const response = await store.getMyAttendance({ startDate, endDate });
      const { attendance, overallStats, monthlyStats } = response.data;
      console.log(response.data);
      setMonthlyAttendance(attendance);

      // Use the current month and year to get the correct monthly stats
      const currentMonthYear = format(currentMonth, "MMMM yyyy");
      const currentMonthStats = monthlyStats[currentMonthYear] || overallStats;
      console.log(currentMonthStats);
      setStats({
        total: currentMonthStats.total || 0,
        present: currentMonthStats.present || 0,
        absent: currentMonthStats.absent || 0,
        late: currentMonthStats.late || 0,
        halfDay: currentMonthStats.halfday || 0,
        earlyLeave: currentMonthStats.earlyLeave || 0,
        onLeave:
          currentMonthStats.onLeave || currentMonthStats["on-leave"] || 0,
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
  const generatePDF = async (element) => {
    if (!element) {
      setError("PDF generation failed: Element not found");
      return null;
    }

    try {
      setLoading(true);

      const canvas = await html2canvas(element, {
        scale: 1.5,
        useCORS: true,
        allowTaint: true,
      });

      const imgData = canvas.toDataURL("image/png", 1.0);
      const pdf = new jsPDF("p", "pt", "a4");

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      return pdf;
    } catch (err) {
      console.error("PDF generation error:", err);
      setError("PDF generation failed");
      return null;
    } finally {
      setLoading(false);
    }
  };
  const handleDownload = async () => {
    try {
      // ✅ Create hidden container
      const container = document.createElement("div");
      container.style.position = "absolute";
      container.style.left = "-9999px"; // keep it off-screen (better than display:none)
      document.body.appendChild(container);

      // ✅ Render your hidden component
      const root = createRoot(container);
      flushSync(() => {
        root.render(
          <DownloadMonthlydata
            loading={loading}
            paginatedData={paginatedData}
            totalPages={totalPages}
            currentMonth={currentMonth}
          />
        );
      });

      // ✅ Wait a tick so DOM is ready
      await new Promise((resolve) => setTimeout(resolve, 500));

      const element = container.querySelector("#monthly-report-content");

      if (!element) {
        throw new Error("Element not found in hidden container");
      }

      const pdf = await generatePDF(element);

      if (pdf) {
        pdf.save("monthly-report.pdf");
      }

      // ✅ Cleanup
      root.unmount();
      document.body.removeChild(container);
    } catch (err) {
      console.error("Download failed:", err);
      setError("Failed to download PDF");
    }
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
      title: "Halfday",
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
      value: formatHoursToHM(stats.totalWorkHours),
      color: "bg-blue-100 text-blue-500",
    },
  ];

  return (
    <div
      id="attendance-content"
      className="container max-w-7xl mx-auto p-2 sm:p-4"
    >
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

      <div className="grid grid-cols-1  lg:grid-cols-5 gap-4 mb-4">
        <Card className="p-2 lg:col-span-2 sm:p-3">
          <div className="flex  justify-between items-center mb-2 px-2">
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
            className="w-full  scale-90 origin-top"
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
              day: "h-6 w-6 text-center p-0 font-normal aria-selected:opacity-100",
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

        <Card className="lg:col-span-3 p-2 sm:p-4">
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
                  {formatHoursToHM(selectedDayAttendance.workHours)}
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
              <tr className="border-b text-center">
                <th className=" p-2">Date</th>
                <th className=" p-2">Check In</th>
                <th className=" p-2">Check Out</th>
                <th className=" p-2">Work Hours</th>
                <th className=" p-2">RT </th>
                <th className=" p-2">OT </th>
                <th className=" p-2">Status</th>
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
                  <tr
                    key={index}
                    className="border-b text-center hover:bg-gray-50"
                  >
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
                    <td className="p-2">{formatHoursToHM(record.workHours)}</td>
                    <td className="p-2">
                      {(() => {
                        const workHrs = Number(record.workHours || 0);
                        const rt = Math.max(0, Math.min(8, workHrs));
                        return rt ? formatHoursToHM(rt) : "-";
                      })()}
                    </td>
                    <td className="p-2">
                      {(() => {
                        const workHrs = Number(record.workHours || 0);
                        const ot = Math.max(
                          0,
                          Math.round((workHrs - 8) * 100) / 100
                        );
                        return ot ? formatHoursToHM(ot) : "-";
                      })()}
                    </td>
                    <td className="flex justify-center text-center">
                      {statsCards.map(({ icon: Icon, title, color }) => {
                        console.log(title, record.status);
                        if (title === record.status) {
                          return (
                            <h2
                              className={`${color} p-2 border rounded-md flex justify-evenly w-[65%]`}
                            >
                              {" "}
                              <Icon className="h-5 w-5" />
                              <span className="font-bold">{record.status}</span>
                            </h2>
                          );
                        }
                      })}
                    </td>
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
