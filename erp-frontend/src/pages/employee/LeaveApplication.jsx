import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { format, differenceInDays, addMonths, subMonths } from "date-fns";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.jsx";
import { Textarea } from "@/components/ui/textarea";
import {
  CalendarIcon,
  ClockIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  XCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { toast } from "react-hot-toast";
import useHrmStore from "@/stores/useHrmStore";
import useAuthStore from "@/stores/auth.store";

const LeaveApplication = () => {
  const { getMyLeave, createLeave } = useHrmStore();
  const { user } = useAuthStore();

  const [dateRange, setDateRange] = useState({
    from: new Date(),
    to: new Date(),
  });
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [leaveType, setLeaveType] = useState("");
  const [reason, setReason] = useState("");
  const [recentApplications, setRecentApplications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [leaveBalance, setLeaveBalance] = useState({
    annual: { total: 14, used: 0, pending: 0 },
    sick: { total: 7, used: 0, pending: 0 },
    personal: { total: 3, used: 0, pending: 0 },
    maternity: { total: 90, used: 0, pending: 0 },
    paternity: { total: 14, used: 0, pending: 0 },
    unpaid: { total: 0, used: 0, pending: 0 },
    other: { total: 0, used: 0, pending: 0 },
  });

  // Fetch leave requests and balance
  useEffect(() => {
    const fetchLeaveData = async () => {
      try {
        if (!user) {
          toast.error("User information not found");
          setIsLoading(false);
          return;
        }

        const leaveResponse = await getMyLeave();
        console.log("Leave response:", leaveResponse);

        const leavesData =
          leaveResponse?.data?.leaves ||
          leaveResponse?.data?.data?.leaves ||
          [];

        const sortedApplications = leavesData
          .map((leave) => ({
            type:
              leave.leaveType.charAt(0).toUpperCase() +
              leave.leaveType.slice(1) +
              " Leave",
            from: format(new Date(leave.startDate), "yyyy-MM-dd"),
            to: format(new Date(leave.endDate), "yyyy-MM-dd"),
            status:
              leave.status.charAt(0).toUpperCase() + leave.status.slice(1),
            approvedBy: leave.approvalChain?.length
              ? "Reviewed"
              : "",
          }))
          .sort((a, b) => new Date(b.from) - new Date(a.from));

        setRecentApplications(sortedApplications);

        const balanceCalculation = {
          annual: { total: 14, used: 0, pending: 0 },
          sick: { total: 7, used: 0, pending: 0 },
          personal: { total: 3, used: 0, pending: 0 },
          maternity: { total: 90, used: 0, pending: 0 },
          paternity: { total: 14, used: 0, pending: 0 },
          unpaid: { total: 0, used: 0, pending: 0 },
          other: { total: 0, used: 0, pending: 0 },
        };

        sortedApplications.forEach((app) => {
          const type = app.type.toLowerCase().replace(" leave", "");
          if (balanceCalculation[type]) {
            if (app.status === "Approved") {
              balanceCalculation[type].used +=
                differenceInDays(new Date(app.to), new Date(app.from)) + 1;
            } else if (app.status === "Pending") {
              balanceCalculation[type].pending +=
                differenceInDays(new Date(app.to), new Date(app.from)) + 1;
            }
          }
        });

        setLeaveBalance(balanceCalculation);
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching leave data:", error);
        toast.error("Failed to fetch leave requests");
        setIsLoading(false);
      }
    };

    fetchLeaveData();
  }, []);
  const handlePreviousMonth = () => {
    setCurrentMonth((prev) => subMonths(prev, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth((prev) => addMonths(prev, 1));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate inputs
    if (!leaveType) {
      toast.error("Please select a leave type");
      return;
    }

    if (!dateRange.from || !dateRange.to) {
      toast.error("Please select a date range");
      return;
    }

    if (!reason.trim()) {
      toast.error("Please provide a reason for your leave");
      return;
    }

    try {
      console.log("User data for submit:", user);

      if (!user) {
        toast.error("User information not found");
        return;
      }

      // Prepare leave request payload
      const leaveRequest = {
        startDate: dateRange.from.toISOString(),
        endDate: dateRange.to.toISOString(),
        reason: reason.trim(),
        employee: user._id || user.id || user.employeeId,
        leaveType: leaveType.charAt(0).toUpperCase() + leaveType.slice(1),
        status: "Pending",
      };

      // Send API request
      const response = await createLeave(leaveRequest);

      if (!response || !response.data) {
        toast.error("Failed to submit leave request");
        return;
      }

      // Create new application object
      const newApplication = {
        type: leaveType.charAt(0).toUpperCase() + leaveType.slice(1) + " Leave",
        from: format(dateRange.from, "yyyy-MM-dd"),
        to: format(dateRange.to, "yyyy-MM-dd"),
        status: "Pending",
        approvedBy: "",
      };

      // Update recent applications
      setRecentApplications([newApplication, ...recentApplications]);

      // Update leave balance with type checking
      const leaveDays = differenceInDays(dateRange.to, dateRange.from) + 1;
      const normalizedLeaveType = leaveType.toLowerCase();

      setLeaveBalance((prev) => {
        // Check if the leave type exists in the balance
        if (!prev[normalizedLeaveType]) {
          // If it doesn't exist, create a new entry
          return {
            ...prev,
            [normalizedLeaveType]: {
              total: 0,
              used: 0,
              pending: leaveDays,
            },
          };
        }

        // If it exists, update the pending count
        return {
          ...prev,
          [normalizedLeaveType]: {
            ...prev[normalizedLeaveType],
            pending: (prev[normalizedLeaveType].pending || 0) + leaveDays,
          },
        };
      });

      // Reset form
      setLeaveType("");
      setReason("");
      setDateRange({ from: new Date(), to: new Date() });

      // Show success message
      toast.success("Leave request submitted successfully");
    } catch (error) {
      // Handle error
      console.error("Leave request error:", error);
      const message =
        error.response?.data?.message ||
        (error.response?.status === 403
          ? "Insufficient permissions"
          : "Failed to submit leave request");
      toast.error(message);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "Approved":
        return "bg-green-100 text-green-800";
      case "Rejected":
        return "bg-red-100 text-red-800";
      case "Pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "Approved":
        return <CheckCircleIcon className="h-5 w-5 text-green-600" />;
      case "Rejected":
        return <XCircleIcon className="h-5 w-5 text-red-600" />;
      default:
        return <ClockIcon className="h-5 w-5 text-yellow-600" />;
    }
  };
  
  // Safe date range for display
  const getFormattedDateRange = () => {
    if (dateRange && dateRange.from && dateRange.to) {
      const days = differenceInDays(dateRange.to, dateRange.from) + 1;
      return (
        <>
          <span className="font-medium">{days} days</span>
          <span className="mx-2">•</span>
          <span>
            {format(dateRange.from, "MMM d")} -{" "}
            {format(dateRange.to, "MMM d, yyyy")}
          </span>
        </>
      );
    }
    return "Select date range";
  };
  
  // Handle Calendar selection with validation
  const handleDateSelect = (range) => {
    // Make sure we have a valid range object before updating state
    if (range && range.from) {
      // If only from is selected, set to to same as from
      if (!range.to) {
        range.to = range.from;
      }
      setDateRange(range);
    } else {
      // If invalid selection, reset to default
      setDateRange({ from: new Date(), to: new Date() });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px] bg-gradient-to-br from-gray-50 to-white">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-gray-200 border-t-blue-600 mx-auto"></div>
          <p className="text-gray-500 font-medium">Loading leave information...</p>
        </div>
      </div>
    );
  }
  return (
    <div className="container mx-auto px-4 py-8 space-y-8 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
            Leave Application
          </h1>
          <p className="text-gray-600">Request and manage your leave applications</p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button 
            variant="outline" 
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
          >
            <DocumentTextIcon className="h-5 w-5 mr-2" />
            Download Leave Policy
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 bg-white rounded-2xl shadow-lg border border-gray-200">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    Leave Type
                  </label>
                  <Select value={leaveType} onValueChange={setLeaveType}>
                    <SelectTrigger className="w-full bg-white border border-gray-200 rounded-lg hover:border-blue-500 transition-colors duration-200">
                      <SelectValue placeholder="Select leave type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="annual">Annual Leave</SelectItem>
                      <SelectItem value="sick">Sick Leave</SelectItem>
                      <SelectItem value="personal">Personal Leave</SelectItem>
                      <SelectItem value="unpaid">Unpaid Leave</SelectItem>
                      <SelectItem value="other">Other Leave</SelectItem>
                      <SelectItem value="maternity">Maternity Leave</SelectItem>
                      <SelectItem value="paternity">Paternity Leave</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2 text-gray-700">
                    Duration
                  </label>
                  <div className="text-sm text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-200">
                    {getFormattedDateRange()}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Date Range
                </label>
                <div className="rounded-xl border border-gray-200 p-4 bg-white shadow-sm">
                  <div className="flex flex-col">
                    <div className="flex justify-center items-center gap-4 mb-2 pb-2 border-b">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handlePreviousMonth}
                        className="h-8 w-8 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                      >
                        <ChevronLeftIcon className="h-4 w-4" />
                      </Button>
                      <div className="text-sm font-medium text-gray-700">
                        {format(currentMonth, "MMMM yyyy")}
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleNextMonth}
                        className="h-8 w-8 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                      >
                        <ChevronRightIcon className="h-4 w-4" />
                      </Button>
                    </div>
                    <Calendar
                      mode="range"
                      selected={dateRange}
                      onSelect={handleDateSelect}
                      numberOfMonths={1}
                      month={currentMonth}
                      className="w-full"
                      showOutsideDays={false}
                      classNames={{
                        months: "flex",
                        month: "space-y-2 w-full",
                        caption: "hidden",
                        nav: "hidden",
                        table: "w-full border-collapse space-y-1",
                        head_row: "flex",
                        head_cell: "text-gray-500 w-8 font-normal text-[0.8rem]",
                        row: "flex w-full",
                        cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent hover:bg-gray-100 rounded-lg transition-colors duration-200",
                        day: "h-8 w-8 p-0 font-normal hover:bg-blue-50 rounded-lg",
                        day_range_end: "day-range-end",
                        day_range_start: "day-range-start",
                        day_selected: "bg-blue-600 text-white hover:bg-blue-700 hover:text-white rounded-lg",
                      }}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-gray-700">
                  Reason
                </label>
                <Textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Please provide a reason for your leave request"
                  className="min-h-[100px] bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                />
              </div>

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-200 transform hover:scale-105"
              >
                Submit Application
              </Button>
            </form>
          </Card>

          <Card className="p-6 bg-white rounded-2xl shadow-lg border border-gray-200">
            <h2 className="text-lg font-semibold mb-4 text-gray-900">Recent Applications</h2>
            <div className="space-y-4">
              {recentApplications.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center mx-auto">
                    <CalendarIcon className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-gray-900">No leave applications</h3>
                  <p className="text-gray-500 mt-1">Your leave applications will appear here</p>
                </div>
              ) : (
                recentApplications.map((application, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-4 rounded-xl border border-gray-200 hover:border-blue-200 hover:bg-gradient-to-r hover:from-blue-50 hover:to-indigo-50 transition-all duration-200"
                  >
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-lg">
                        <CalendarIcon className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{application.type}</p>
                        <p className="text-sm text-gray-500">
                          {application.from} to {application.to}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div
                          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(
                            application.status
                          )}`}
                        >
                          {getStatusIcon(application.status)}
                          <span>{application.status}</span>
                        </div>
                        <p className="text-sm text-gray-500 mt-1">
                          {application.approvedBy}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        <Card className="p-6 bg-white rounded-2xl shadow-lg border border-gray-200">
          <h2 className="text-lg font-semibold mb-4 text-gray-900">Leave Balance</h2>
          <div className="space-y-6">
            {Object.entries(leaveBalance).map(([type, balance]) => (
              <div key={type} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="capitalize text-gray-700">{type} Leave</span>
                  <span className="font-semibold text-gray-900">
                    {balance.total - balance.used} days
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${((balance.used + balance.pending) / balance.total) * 100}%`,
                    }}
                  />
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Used: {balance.used} days</span>
                  <span className="text-gray-500">Pending: {balance.pending} days</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default LeaveApplication;