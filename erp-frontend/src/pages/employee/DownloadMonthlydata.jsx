import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { format, parseISO } from "date-fns";
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
  fourthPageData,
  thirdPagedata,
  endMonthPdf,
  startMonthPdf,
  secondPagedata,
  firstpageData,
  pdfTotalPages,
  loading,
}) => {
  console.log(fourthPageData);
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
  const [renderPage, setrenderPage] = useState(0);
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
      <Card className="w-full border-none  mx-auto" id="monthly-report-content">
        <div className="p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start mb-4  pb-6 gap-4">
            <div className="flex w-full  flex-col sm:flex-row items-center sm:items-start gap-4">
              <img
                src="https://www.xyvin.com/_next/static/media/logo.6f54e6f8.svg"
                alt="Xyvin Technologies Logo"
                className="w-12 h-10 object-contain mt-3"
                crossOrigin="anonymous"
              />
              <div className="text-center sm:text-left">
                <h1 className="text-lg font-bold text-[#2563eb]">
                  Xyvin Technologies Private Limited
                </h1>
                <p style={{fontSize:"10px" ,paddingTop:"4px"}} className="text-gray-500">
                  Monthly Report - {startMonthPdf} to {endMonthPdf}
                </p>
              </div>
            </div>
          </div>
          <Card className="p-4">
            <h2 className="text-lg font-medium text-center mb-4">
              Monthly Attendance Log
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[600px]">
                <thead>
                  <tr className="border-b text-center ">
                    <th
                      style={{ fontSize: "10px", paddingBottom: "10px" }}
                      className="  p-0"
                    >
                      Date
                    </th>
                    <th
                      style={{ fontSize: "10px", paddingBottom: "10px" }}
                      className=" p-0"
                    >
                      Check In
                    </th>
                    <th
                      style={{ fontSize: "10px", paddingBottom: "10px" }}
                      className=" p-0"
                    >
                      Check Out
                    </th>
                    <th
                      style={{ fontSize: "10px", paddingBottom: "10px" }}
                      className=" p-0"
                    >
                      Work Hours
                    </th>
                    <th
                      style={{ fontSize: "10px", paddingBottom: "10px" }}
                      className=" p-0"
                    >
                      RT{" "}
                    </th>
                    <th
                      style={{ fontSize: "10px", paddingBottom: "10px" }}
                      className=" p-0"
                    >
                      OT{" "}
                    </th>
                    <th
                      style={{ fontSize: "10px", paddingBottom: "10px" }}
                      className=" p-0"
                    >
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan="7" className="text-center p-2">
                        Loading...
                      </td>
                    </tr>
                  ) : firstpageData.length > 0 ? (
                    firstpageData.map((record, index) => {
                      return (
                        <>
                          <tr
                            key={index}
                            className="text-center text-sm hover:bg-gray-50"
                          >
                            <td style={{ fontSize: "10px" }} className="p-2">
                              {format(parseISO(record.date), "MMM dd, yyyy")}
                            </td>
                            <td style={{ fontSize: "10px" }} className="p-2">
                              {record.checkIn?.time
                                ? format(
                                    parseISO(record.checkIn.time),
                                    "hh:mm a"
                                  )
                                : "-"}
                            </td>
                            <td style={{ fontSize: "10px" }} className="p-2">
                              {record.checkOut?.time
                                ? format(
                                    parseISO(record.checkOut.time),
                                    "hh:mm a"
                                  )
                                : "-"}
                            </td>
                            <td style={{ fontSize: "10px" }} className="p-2">
                              {formatHoursToHM(record.workHours)}
                            </td>
                            <td style={{ fontSize: "10px" }} className="p-2">
                              {(() => {
                                const workHrs = Number(record.workHours || 0);
                                const rt = Math.max(0, Math.min(8, workHrs));
                                return rt ? formatHoursToHM(rt) : "-";
                              })()}
                            </td>
                            <td style={{ fontSize: "10px" }} className="p-2">
                              {(() => {
                                const workHrs = Number(record.workHours || 0);
                                const ot = Math.max(
                                  0,
                                  Math.round((workHrs - 8) * 100) / 100
                                );
                                return ot ? formatHoursToHM(ot) : "-";
                              })()}
                            </td>
                            <td
                              style={{ fontSize: "10px" }}
                              className="flex justify-center text-center"
                            >
                              {statsCards.map(
                                ({ icon: Icon, title, color }) => {
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
                                }
                              )}
                            </td>
                          </tr>
                        </>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan="7" className="text-center p-4">
                        No attendance records found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              <div className="w-full text-center">
                {" "}
                <span
                  className="text-center"
                  style={{ fontSize: "10px", paddingBottom: "4px" }}
                >
                  PAGE 1 / {pdfTotalPages}
                </span>
              </div>
            </div>
          </Card>
          {secondPagedata.length > 0 && (
            <>
              <Card className="p-4 mt-32">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px]">
                    <thead>
                      <tr className="border-b text-center ">
                        <th
                          style={{ fontSize: "10px", paddingBottom: "10px" }}
                          className="  p-0"
                        >
                          Date
                        </th>
                        <th
                          style={{ fontSize: "10px", paddingBottom: "10px" }}
                          className=" p-0"
                        >
                          Check In
                        </th>
                        <th
                          style={{ fontSize: "10px", paddingBottom: "10px" }}
                          className=" p-0"
                        >
                          Check Out
                        </th>
                        <th
                          style={{ fontSize: "10px", paddingBottom: "10px" }}
                          className=" p-0"
                        >
                          Work Hours
                        </th>
                        <th
                          style={{ fontSize: "10px", paddingBottom: "10px" }}
                          className=" p-0"
                        >
                          RT{" "}
                        </th>
                        <th
                          style={{ fontSize: "10px", paddingBottom: "10px" }}
                          className=" p-0"
                        >
                          OT{" "}
                        </th>
                        <th
                          style={{ fontSize: "10px", paddingBottom: "10px" }}
                          className=" p-0"
                        >
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan="7" className="text-center p-2">
                            Loading...
                          </td>
                        </tr>
                      ) : secondPagedata.length > 0 ? (
                        secondPagedata.map((record, index) => {
                          return (
                            <>
                              <tr
                                key={index}
                                className="text-center text-sm hover:bg-gray-50"
                              >
                                <td
                                  style={{ fontSize: "10px" }}
                                  className="p-2"
                                >
                                  {format(
                                    parseISO(record.date),
                                    "MMM dd, yyyy"
                                  )}
                                </td>
                                <td
                                  style={{ fontSize: "10px" }}
                                  className="p-2"
                                >
                                  {record.checkIn?.time
                                    ? format(
                                        parseISO(record.checkIn.time),
                                        "hh:mm a"
                                      )
                                    : "-"}
                                </td>
                                <td
                                  style={{ fontSize: "10px" }}
                                  className="p-2"
                                >
                                  {record.checkOut?.time
                                    ? format(
                                        parseISO(record.checkOut.time),
                                        "hh:mm a"
                                      )
                                    : "-"}
                                </td>
                                <td
                                  style={{ fontSize: "10px" }}
                                  className="p-2"
                                >
                                  {formatHoursToHM(record.workHours)}
                                </td>
                                <td
                                  style={{ fontSize: "10px" }}
                                  className="p-2"
                                >
                                  {(() => {
                                    const workHrs = Number(
                                      record.workHours || 0
                                    );
                                    const rt = Math.max(
                                      0,
                                      Math.min(8, workHrs)
                                    );
                                    return rt ? formatHoursToHM(rt) : "-";
                                  })()}
                                </td>
                                <td
                                  style={{ fontSize: "10px" }}
                                  className="p-2"
                                >
                                  {(() => {
                                    const workHrs = Number(
                                      record.workHours || 0
                                    );
                                    const ot = Math.max(
                                      0,
                                      Math.round((workHrs - 8) * 100) / 100
                                    );
                                    return ot ? formatHoursToHM(ot) : "-";
                                  })()}
                                </td>
                                <td
                                  style={{ fontSize: "10px" }}
                                  className="flex justify-center text-center"
                                >
                                  {statsCards.map(
                                    ({ icon: Icon, title, color }) => {
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
                                    }
                                  )}
                                </td>
                              </tr>
                            </>
                          );
                        })
                      ) : (
                        ""
                      )}
                    </tbody>
                  </table>
                  {secondPagedata.length > 0 && (
                    <div className="w-full text-center">
                      {" "}
                      <span
                        className="text-center"
                        style={{ fontSize: "8px", paddingBottom: "4px" }}
                      >
                        PAGE 2 / {pdfTotalPages}
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            </>
          )}

          {thirdPagedata.length > 0 && (
            <>
              <Card className="p-4 mt-40">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px]">
                    <thead>
                      <tr className="border-b text-center ">
                        <th
                          style={{ fontSize: "10px", paddingBottom: "10px" }}
                          className="  p-0"
                        >
                          Date
                        </th>
                        <th
                          style={{ fontSize: "10px", paddingBottom: "10px" }}
                          className=" p-0"
                        >
                          Check In
                        </th>
                        <th
                          style={{ fontSize: "10px", paddingBottom: "10px" }}
                          className=" p-0"
                        >
                          Check Out
                        </th>
                        <th
                          style={{ fontSize: "10px", paddingBottom: "10px" }}
                          className=" p-0"
                        >
                          Work Hours
                        </th>
                        <th
                          style={{ fontSize: "10px", paddingBottom: "10px" }}
                          className=" p-0"
                        >
                          RT{" "}
                        </th>
                        <th
                          style={{ fontSize: "10px", paddingBottom: "10px" }}
                          className=" p-0"
                        >
                          OT{" "}
                        </th>
                        <th
                          style={{ fontSize: "10px", paddingBottom: "10px" }}
                          className=" p-0"
                        >
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan="7" className="text-center p-2">
                            Loading...
                          </td>
                        </tr>
                      ) : thirdPagedata.length > 0 ? (
                        thirdPagedata.map((record, index) => {
                          return (
                            <>
                              <tr
                                key={index}
                                className="text-center text-sm hover:bg-gray-50"
                              >
                                <td
                                  style={{ fontSize: "10px" }}
                                  className="p-2"
                                >
                                  {format(
                                    parseISO(record.date),
                                    "MMM dd, yyyy"
                                  )}
                                </td>
                                <td
                                  style={{ fontSize: "10px" }}
                                  className="p-2"
                                >
                                  {record.checkIn?.time
                                    ? format(
                                        parseISO(record.checkIn.time),
                                        "hh:mm a"
                                      )
                                    : "-"}
                                </td>
                                <td
                                  style={{ fontSize: "10px" }}
                                  className="p-2"
                                >
                                  {record.checkOut?.time
                                    ? format(
                                        parseISO(record.checkOut.time),
                                        "hh:mm a"
                                      )
                                    : "-"}
                                </td>
                                <td
                                  style={{ fontSize: "10px" }}
                                  className="p-2"
                                >
                                  {formatHoursToHM(record.workHours)}
                                </td>
                                <td
                                  style={{ fontSize: "10px" }}
                                  className="p-2"
                                >
                                  {(() => {
                                    const workHrs = Number(
                                      record.workHours || 0
                                    );
                                    const rt = Math.max(
                                      0,
                                      Math.min(8, workHrs)
                                    );
                                    return rt ? formatHoursToHM(rt) : "-";
                                  })()}
                                </td>
                                <td
                                  style={{ fontSize: "10px" }}
                                  className="p-2"
                                >
                                  {(() => {
                                    const workHrs = Number(
                                      record.workHours || 0
                                    );
                                    const ot = Math.max(
                                      0,
                                      Math.round((workHrs - 8) * 100) / 100
                                    );
                                    return ot ? formatHoursToHM(ot) : "-";
                                  })()}
                                </td>
                                <td
                                  style={{ fontSize: "10px" }}
                                  className="flex justify-center text-center"
                                >
                                  {statsCards.map(
                                    ({ icon: Icon, title, color }) => {
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
                                    }
                                  )}
                                </td>
                              </tr>
                            </>
                          );
                        })
                      ) : (
                        ""
                      )}
                    </tbody>
                  </table>
                  {thirdPagedata.length > 0 && (
                    <div className="w-full text-center">
                      {" "}
                      <span
                        className="text-center"
                        style={{ fontSize: "8px", paddingBottom: "4px" }}
                      >
                        PAGE 3 / {pdfTotalPages}
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            </>
          )}

          {fourthPageData.length > 0 && (
            <>
              <Card className="p-4 mt-48">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[600px]">
                    <thead>
                      <tr className="border-b text-center ">
                        <th
                          style={{ fontSize: "10px", paddingBottom: "10px" }}
                          className="  p-0"
                        >
                          Date
                        </th>
                        <th
                          style={{ fontSize: "10px", paddingBottom: "10px" }}
                          className=" p-0"
                        >
                          Check In
                        </th>
                        <th
                          style={{ fontSize: "10px", paddingBottom: "10px" }}
                          className=" p-0"
                        >
                          Check Out
                        </th>
                        <th
                          style={{ fontSize: "10px", paddingBottom: "10px" }}
                          className=" p-0"
                        >
                          Work Hours
                        </th>
                        <th
                          style={{ fontSize: "10px", paddingBottom: "10px" }}
                          className=" p-0"
                        >
                          RT{" "}
                        </th>
                        <th
                          style={{ fontSize: "10px", paddingBottom: "10px" }}
                          className=" p-0"
                        >
                          OT{" "}
                        </th>
                        <th
                          style={{ fontSize: "10px", paddingBottom: "10px" }}
                          className=" p-0"
                        >
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading ? (
                        <tr>
                          <td colSpan="7" className="text-center p-2">
                            Loading...
                          </td>
                        </tr>
                      ) : fourthPageData.length > 0 ? (
                        fourthPageData.map((record, index) => {
                          return (
                            <>
                              <tr
                                key={index}
                                className="text-center text-sm hover:bg-gray-50"
                              >
                                <td
                                  style={{ fontSize: "10px" }}
                                  className="p-2"
                                >
                                  {format(
                                    parseISO(record.date),
                                    "MMM dd, yyyy"
                                  )}
                                </td>
                                <td
                                  style={{ fontSize: "10px" }}
                                  className="p-2"
                                >
                                  {record.checkIn?.time
                                    ? format(
                                        parseISO(record.checkIn.time),
                                        "hh:mm a"
                                      )
                                    : "-"}
                                </td>
                                <td
                                  style={{ fontSize: "10px" }}
                                  className="p-2"
                                >
                                  {record.checkOut?.time
                                    ? format(
                                        parseISO(record.checkOut.time),
                                        "hh:mm a"
                                      )
                                    : "-"}
                                </td>
                                <td
                                  style={{ fontSize: "10px" }}
                                  className="p-2"
                                >
                                  {formatHoursToHM(record.workHours)}
                                </td>
                                <td
                                  style={{ fontSize: "10px" }}
                                  className="p-2"
                                >
                                  {(() => {
                                    const workHrs = Number(
                                      record.workHours || 0
                                    );
                                    const rt = Math.max(
                                      0,
                                      Math.min(8, workHrs)
                                    );
                                    return rt ? formatHoursToHM(rt) : "-";
                                  })()}
                                </td>
                                <td
                                  style={{ fontSize: "10px" }}
                                  className="p-2"
                                >
                                  {(() => {
                                    const workHrs = Number(
                                      record.workHours || 0
                                    );
                                    const ot = Math.max(
                                      0,
                                      Math.round((workHrs - 8) * 100) / 100
                                    );
                                    return ot ? formatHoursToHM(ot) : "-";
                                  })()}
                                </td>
                                <td
                                  style={{ fontSize: "10px" }}
                                  className="flex justify-center text-center"
                                >
                                  {statsCards.map(
                                    ({ icon: Icon, title, color }) => {
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
                                    }
                                  )}
                                </td>
                              </tr>
                            </>
                          );
                        })
                      ) : (
                        ""
                      )}
                    </tbody>
                  </table>
                  {fourthPageData.length > 0 && (
                    <div className="w-full text-center">
                      {" "}
                      <span
                        className="text-center"
                        style={{ fontSize: "8px", paddingBottom: "4px" }}
                      >
                        PAGE 4 / {pdfTotalPages}
                      </span>
                    </div>
                  )}
                </div>
              </Card>
            </>
          )}
        </div>
      </Card>
    </div>
  );
};

export default DownloadMonthlydata;
