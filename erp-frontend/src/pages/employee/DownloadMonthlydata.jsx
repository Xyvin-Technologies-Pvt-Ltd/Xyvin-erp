import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { format, startOfMonth, endOfMonth, parseISO } from "date-fns";
import {
  ArrowRightOnRectangleIcon,
  CalendarDaysIcon,
  PaperAirplaneIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
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
const DownloadMonthlydata = ({
  currentMonth,
  totalPages,
  paginatedData,
  loading,
}) => {
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
    const [currentPage, setCurrentPage] = useState(1);
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
    <div>
      <Card className="w-full  mx-auto" id="monthly-report-content">
        <div className="p-8">
          <div className="flex flex-col sm:flex-row justify-between items-start mb-8 border-b pb-6 gap-4">
            <div className="flex w-full justify-center flex-col sm:flex-row items-center sm:items-start gap-4">
              <img
                src="https://www.xyvin.com/_next/static/media/logo.6f54e6f8.svg"
                alt="Xyvin Technologies Logo"
                className="w-20 h-10 object-contain mt-3"
                crossOrigin="anonymous"
              />
              <div className="text-center sm:text-left">
                <h1 className="text-2xl font-bold text-[#2563eb]">
                  Xyvin Technologies Private Limited
                </h1>
                <p className="text-gray-500">
                  Monthly Report - {currentMonth.toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* <div className="text-center sm:text-right w-full sm:w-auto">
                  <p className="font-medium">
                    PaySlip #
                  </p>
                  <p className="text-gray-500">
                    Payment Date: 
                  </p>
                </div> */}
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
                        <td className="p-2">
                          {formatHoursToHM(record.workHours)}
                        </td>
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
                                  className={`${color} p-2 rounded-md flex justify-evenly w-[65%] bg-transparent`}
                                >
                                  {" "}
                                  <span className="font-bold">
                                    {record.status}
                                  </span>
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
                  onClick={() =>
                    setCurrentPage((prev) => Math.max(1, prev - 1))
                  }
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
          <div className="mt-12 pt-8  grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div className="text-center">
              <div className="mb-8">_________________</div>
              <div className="text-gray-600">Employee Signature</div>
            </div>
            <div className="text-center">
              <div className="mb-8">_________________</div>
              <div className="text-gray-600">Authorized Signature</div>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default DownloadMonthlydata;
