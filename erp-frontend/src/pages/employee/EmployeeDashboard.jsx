import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { format, startOfMonth, endOfMonth, differenceInDays } from "date-fns";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { TrendingUp, Calendar, Clock, Heart, Users, Award, Target, BarChart3 } from "lucide-react";

// Mock stores for demo
const useHrmStore = () => ({
  getMyAttendance: async () => ({ data: { attendance: [] } }),
  getMyLeave: async () => ({ data: { leaves: [] } }),
  getMyPayroll: async () => ({ data: { payroll: [] } }),
});

const useAuthStore = () => ({
  user: { name: "John Doe", email: "john@example.com" }
});

const toast = {
  error: (message) => console.error(message)
};

const COLORS = ["#6366F1", "#F59E0B", "#EF4444"]; // Indigo, Amber, Red

function EmployeeDashboard() {
  const { getMyAttendance, getMyLeave, getMyPayroll } = useHrmStore();
  const { user } = useAuthStore();
  
  const [attendanceStats, setAttendanceStats] = useState({
    present: 0,
    absent: 0,
    late: 0,
    total: 0,
    percentage: 0,
  });
  const [leaveStats, setLeaveStats] = useState({
    annual: { used: 0, total: 14 },
    sick: { used: 0, total: 7 },
    personal: { used: 0, total: 3 },
    unpaid: { used: 0, total: 0 },
  });
  const [recentPayslips, setRecentPayslips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        fetchAttendanceStats(),
        fetchLeaveStats(),
        fetchRecentPayslips(),
      ]);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const fetchAttendanceStats = async () => {
    try {
      const startDate = startOfMonth(new Date());
      const endDate = endOfMonth(new Date());

      const response = await getMyAttendance(startDate, endDate);

      if (response?.data?.attendance) {
        const attendance = response.data.attendance;
        const presentDays = attendance.filter(
          (a) => a.status.toLowerCase() === "present"
        ).length;
        const lateDays = attendance.filter(
          (a) => a.status.toLowerCase() === "late"
        ).length;
        const absentDays = attendance.filter(
          (a) => a.status.toLowerCase() === "absent"
        ).length;
        const workingDays = attendance.length || 22;

        setAttendanceStats({
          present: presentDays,
          absent: absentDays,
          late: lateDays,
          total: workingDays,
          percentage: Math.round((presentDays / workingDays) * 100) || 0,
        });
      }
    } catch (error) {
      console.error("Error fetching attendance stats:", error);
      setAttendanceStats({
        present: 18,
        absent: 2,
        late: 2,
        total: 22,
        percentage: 82,
      });
    }
  };

  const fetchLeaveStats = async () => {
    try {
      const response = await getMyLeave();
      const leaves = response?.data?.leaves || [];

      const leaveCount = {
        annual: { used: 0, total: 14 },
        sick: { used: 0, total: 7 },
        personal: { used: 0, total: 3 },
        unpaid: { used: 0, total: 0 },
      };

      leaves.forEach((leave) => {
        if (leave.status === "Approved") {
          const days =
            differenceInDays(
              new Date(leave.endDate),
              new Date(leave.startDate)
            ) + 1;
          const type = leave.leaveType.toLowerCase();
          if (leaveCount[type]) {
            leaveCount[type].used += days;
          }
        }
      });

      setLeaveStats(leaveCount);
    } catch (error) {
      console.error("Error fetching leave stats:", error);
    }
  };

  const fetchRecentPayslips = async () => {
    try {
      const response = await getMyPayroll();
      let payrollData = [];

      if (response?.data?.payroll && Array.isArray(response.data.payroll)) {
        payrollData = response.data.payroll;
      } else if (response?.data?.data && Array.isArray(response.data.data)) {
        payrollData = response.data.data;
      }

      if (payrollData.length === 0) {
        const defaultData = generateDefaultPayslips();
        setRecentPayslips(defaultData);
        return;
      }

      const sortedPayroll = payrollData
        .sort(
          (a, b) => new Date(a.period || a.date) - new Date(b.period || b.date)
        )
        .slice(-6);

      const formattedPayslips = sortedPayroll.map((payroll) => ({
        month: format(new Date(payroll.period || payroll.date), "MMM yyyy"),
        amount: parseFloat(payroll.netSalary || payroll.amount) || 0,
        grossSalary: parseFloat(payroll.grossSalary || payroll.gross) || 0,
        deductions:
          parseFloat(payroll.deductions || payroll.totalDeductions) || 0,
      }));

      setRecentPayslips(formattedPayslips);
    } catch (error) {
      console.error("Error fetching payslips:", error);
      const defaultData = generateDefaultPayslips();
      setRecentPayslips(defaultData);
    }
  };

  const generateDefaultPayslips = () => {
    const months = [];
    const baseAmount = 50000;
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const randomVariation = Math.random() * 2000 - 1000;
      const netSalary = Math.round(baseAmount + randomVariation);
      const grossSalary = Math.round(netSalary * 1.3);
      const deductions = grossSalary - netSalary;

      months.push({
        month: format(date, "MMM yyyy"),
        amount: netSalary,
        grossSalary: grossSalary,
        deductions: deductions,
      });
    }

    return months;
  };

  const renderStatisticCards = () => {
    const cards = [
      {
        title: "Attendance Rate",
        value: `${attendanceStats.percentage}%`,
        subtitle: `${attendanceStats.present} days present`,
        icon: Target,
        gradient: "from-emerald-500 to-teal-600",
        bgGradient: "from-emerald-50 to-teal-50",
        iconBg: "bg-emerald-100",
        iconColor: "text-emerald-600"
      },
      {
        title: "Leave Balance",
        value: leaveStats.annual.total - leaveStats.annual.used,
        subtitle: "Annual leave days remaining",
        icon: Calendar,
        gradient: "from-blue-500 to-indigo-600",
        bgGradient: "from-blue-50 to-indigo-50",
        iconBg: "bg-blue-100",
        iconColor: "text-blue-600"
      },
      {
        title: "Late Arrivals",
        value: attendanceStats.late,
        subtitle: "Days this month",
        icon: Clock,
        gradient: "from-amber-500 to-orange-600",
        bgGradient: "from-amber-50 to-orange-50",
        iconBg: "bg-amber-100",
        iconColor: "text-amber-600"
      },
      {
        title: "Sick Leave",
        value: leaveStats.sick.total - leaveStats.sick.used,
        subtitle: "Days remaining",
        icon: Heart,
        gradient: "from-purple-500 to-pink-600",
        bgGradient: "from-purple-50 to-pink-50",
        iconBg: "bg-purple-100",
        iconColor: "text-purple-600"
      }
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {cards.map((card, index) => (
          <Card key={index} className={`relative overflow-hidden bg-gradient-to-br ${card.bgGradient} border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group`}>
            <div className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-600 mb-1">
                    {card.title}
                  </p>
                  <p className="text-3xl font-bold text-gray-900 mb-1">
                    {card.value}
                  </p>
                  <p className="text-sm text-gray-500">
                    {card.subtitle}
                  </p>
                </div>
                <div className={`${card.iconBg} p-3 rounded-xl group-hover:scale-110 transition-transform duration-300`}>
                  <card.icon className={`h-6 w-6 ${card.iconColor}`} />
                </div>
              </div>
              <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${card.gradient}`}></div>
            </div>
          </Card>
        ))}
      </div>
    );
  };

  const renderAttendanceChart = () => {
    const present = attendanceStats.present || 0;
    const late = attendanceStats.late || 0;
    const absent = attendanceStats.absent || 0;
    const total = present + late + absent || 1;

    const data = [
      {
        name: "Present",
        value: present,
        percentage: Math.round((present / total) * 100),
      },
      {
        name: "Late",
        value: late,
        percentage: Math.round((late / total) * 100),
      },
      {
        name: "Absent",
        value: absent,
        percentage: Math.round((absent / total) * 100),
      },
    ];

    return (
      <Card className="bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-indigo-100 p-2 rounded-lg">
              <BarChart3 className="h-5 w-5 text-indigo-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              Monthly Attendance Distribution
            </h2>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => 
                    `${name} ${percentage}%`
                  }
                  outerRadius={120}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                      strokeWidth={2}
                      stroke="#ffffff"
                    />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value, name) => [
                    `${value} days (${Math.round((value / total) * 100)}%)`,
                    name,
                  ]}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #E5E7EB',
                    borderRadius: '12px',
                    color: '#111827',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <Legend
                  formatter={(value, entry) => {
                    const { payload } = entry;
                    return (
                      <span style={{ color: '#111827', fontWeight: 500 }}>
                        {value} - {payload.value} days ({payload.percentage}%)
                      </span>
                    );
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>
    );
  };

  const renderLeaveBalanceChart = () => {
    const data = Object.entries(leaveStats).map(([type, stats]) => ({
      name: type.charAt(0).toUpperCase() + type.slice(1),
      used: stats.used,
      remaining: stats.total - stats.used,
    }));

    return (
      <Card className="bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-emerald-100 p-2 rounded-lg">
              <Calendar className="h-5 w-5 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              Leave Balance Overview
            </h2>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data}>
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="#F3F4F6"
                />
                <XAxis 
                  dataKey="name" 
                  tick={{ fill: '#6B7280', fontSize: 12, fontWeight: 500 }}
                  tickLine={{ stroke: '#D1D5DB' }}
                  axisLine={{ stroke: '#D1D5DB' }}
                />
                <YAxis 
                  tick={{ fill: '#6B7280', fontSize: 12, fontWeight: 500 }}
                  tickLine={{ stroke: '#D1D5DB' }}
                  axisLine={{ stroke: '#D1D5DB' }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #E5E7EB',
                    borderRadius: '12px',
                    color: '#111827',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="used"
                  stroke="#6366F1"
                  strokeWidth={3}
                  name="Used Days"
                  dot={{ fill: '#6366F1', strokeWidth: 2, r: 5 }}
                  activeDot={{ r: 8, fill: '#6366F1' }}
                />
                <Line
                  type="monotone"
                  dataKey="remaining"
                  stroke="#10B981"
                  strokeWidth={3}
                  name="Remaining Days"
                  dot={{ fill: '#10B981', strokeWidth: 2, r: 5 }}
                  activeDot={{ r: 8, fill: '#10B981' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>
    );
  };

  const renderPayrollChart = () => {
    const chartData =
      recentPayslips.length > 0 ? recentPayslips : generateDefaultPayslips();

    return (
      <Card className="bg-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 group">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="bg-blue-100 p-2 rounded-lg">
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              Salary Trend Analysis
            </h2>
          </div>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid 
                  strokeDasharray="3 3" 
                  stroke="#F3F4F6"
                />
                <XAxis
                  dataKey="month"
                  tick={{ fill: '#6B7280', fontSize: 12, fontWeight: 500 }}
                  tickLine={{ stroke: '#D1D5DB' }}
                  axisLine={{ stroke: '#D1D5DB' }}
                />
                <YAxis
                  tick={{ fill: '#6B7280', fontSize: 12, fontWeight: 500 }}
                  tickLine={{ stroke: '#D1D5DB' }}
                  axisLine={{ stroke: '#D1D5DB' }}
                  tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`}
                />
                <Tooltip
                  formatter={(value) => [`₹${value.toLocaleString()}`, "Amount"]}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    border: '1px solid #E5E7EB',
                    borderRadius: '12px',
                    color: '#111827',
                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                  }}
                />
                <Legend
                  verticalAlign="top"
                  height={36}
                  wrapperStyle={{
                    paddingBottom: "20px",
                    color: '#111827',
                    fontWeight: 500,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="grossSalary"
                  name="Gross Salary"
                  stroke="#22C55E"
                  strokeWidth={3}
                  dot={{ fill: '#22C55E', strokeWidth: 2, r: 5 }}
                  activeDot={{ r: 8, fill: '#22C55E' }}
                />
                <Line
                  type="monotone"
                  dataKey="amount"
                  name="Net Salary"
                  stroke="#3B82F6"
                  strokeWidth={3}
                  dot={{ fill: '#3B82F6', strokeWidth: 2, r: 5 }}
                  activeDot={{ r: 8, fill: '#3B82F6' }}
                />
                <Line
                  type="monotone"
                  dataKey="deductions"
                  name="Deductions"
                  stroke="#EF4444"
                  strokeWidth={3}
                  dot={{ fill: '#EF4444', strokeWidth: 2, r: 5 }}
                  activeDot={{ r: 8, fill: '#EF4444' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="relative">
              <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-indigo-500"></div>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="animate-pulse bg-indigo-500 rounded-full h-4 w-4"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <div className="container mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 p-3 rounded-xl shadow-lg">
              <Users className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 bg-clip-text text-transparent">
                Dashboard Overview
              </h1>
              <p className="text-lg text-gray-600 font-medium">
                Welcome back, {user?.name || 'Employee'}! Here's your performance summary.
              </p>
            </div>
          </div>
        </div>

        {renderStatisticCards()}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 mb-8">
          {renderAttendanceChart()}
          {renderLeaveBalanceChart()}
        </div>

        <div className="grid grid-cols-1 gap-8">
          {renderPayrollChart()}
        </div>
      </div>
    </div>
  );
}

export default EmployeeDashboard;