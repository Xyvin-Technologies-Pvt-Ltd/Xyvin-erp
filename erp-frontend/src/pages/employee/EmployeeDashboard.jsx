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
import { Moon, Sun } from "lucide-react";

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

const COLORS = {
  light: ["#22C55E", "#EAB308", "#EF4444"], // Green, Yellow, Red
  dark: ["#10B981", "#F59E0B", "#F87171"]   // Darker variants for dark theme
};

function EmployeeDashboard() {
  const { getMyAttendance, getMyLeave, getMyPayroll } = useHrmStore();
  const { user } = useAuthStore();
  
  const [darkMode, setDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('darkMode') === 'true' || 
             window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

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

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('darkMode', darkMode.toString());
      if (darkMode) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
  }, [darkMode]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

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

  const renderStatisticCards = () => (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card className={`p-4 transition-colors duration-200 ${
        darkMode 
          ? 'bg-gray-800 border-gray-700 hover:bg-gray-750' 
          : 'bg-white border-gray-200 hover:bg-gray-50'
      }`}>
        <h3 className={`text-sm font-medium ${
          darkMode ? 'text-gray-400' : 'text-gray-500'
        }`}>
          Attendance Rate
        </h3>
        <p className={`mt-2 text-3xl font-semibold ${
          darkMode ? 'text-emerald-400' : 'text-emerald-600'
        }`}>
          {attendanceStats.percentage}%
        </p>
        <p className={`mt-1 text-sm ${
          darkMode ? 'text-gray-300' : 'text-gray-600'
        }`}>
          {attendanceStats.present} days present
        </p>
      </Card>
      
      <Card className={`p-4 transition-colors duration-200 ${
        darkMode 
          ? 'bg-gray-800 border-gray-700 hover:bg-gray-750' 
          : 'bg-white border-gray-200 hover:bg-gray-50'
      }`}>
        <h3 className={`text-sm font-medium ${
          darkMode ? 'text-gray-400' : 'text-gray-500'
        }`}>
          Leave Balance
        </h3>
        <p className={`mt-2 text-3xl font-semibold ${
          darkMode ? 'text-blue-400' : 'text-blue-600'
        }`}>
          {leaveStats.annual.total - leaveStats.annual.used}
        </p>
        <p className={`mt-1 text-sm ${
          darkMode ? 'text-gray-300' : 'text-gray-600'
        }`}>
          Annual leave days remaining
        </p>
      </Card>
      
      <Card className={`p-4 transition-colors duration-200 ${
        darkMode 
          ? 'bg-gray-800 border-gray-700 hover:bg-gray-750' 
          : 'bg-white border-gray-200 hover:bg-gray-50'
      }`}>
        <h3 className={`text-sm font-medium ${
          darkMode ? 'text-gray-400' : 'text-gray-500'
        }`}>
          Late Arrivals
        </h3>
        <p className={`mt-2 text-3xl font-semibold ${
          darkMode ? 'text-amber-400' : 'text-amber-600'
        }`}>
          {attendanceStats.late}
        </p>
        <p className={`mt-1 text-sm ${
          darkMode ? 'text-gray-300' : 'text-gray-600'
        }`}>
          Days this month
        </p>
      </Card>
      
      <Card className={`p-4 transition-colors duration-200 ${
        darkMode 
          ? 'bg-gray-800 border-gray-700 hover:bg-gray-750' 
          : 'bg-white border-gray-200 hover:bg-gray-50'
      }`}>
        <h3 className={`text-sm font-medium ${
          darkMode ? 'text-gray-400' : 'text-gray-500'
        }`}>
          Sick Leave
        </h3>
        <p className={`mt-2 text-3xl font-semibold ${
          darkMode ? 'text-purple-400' : 'text-purple-600'
        }`}>
          {leaveStats.sick.total - leaveStats.sick.used}
        </p>
        <p className={`mt-1 text-sm ${
          darkMode ? 'text-gray-300' : 'text-gray-600'
        }`}>
          Days remaining
        </p>
      </Card>
    </div>
  );

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

    const colors = darkMode ? COLORS.dark : COLORS.light;

    return (
      <Card className={`p-6 transition-colors duration-200 ${
        darkMode 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'
      }`}>
        <h2 className={`text-lg font-semibold mb-4 ${
          darkMode ? 'text-gray-100' : 'text-gray-900'
        }`}>
          Monthly Attendance Distribution
        </h2>
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
                    fill={colors[index % colors.length]}
                    strokeWidth={darkMode ? 2 : 1}
                    stroke={darkMode ? '#374151' : '#ffffff'}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => [
                  `${value} days (${Math.round((value / total) * 100)}%)`,
                  name,
                ]}
                contentStyle={{
                  backgroundColor: darkMode ? '#1F2937' : '#ffffff',
                  border: `1px solid ${darkMode ? '#374151' : '#E5E7EB'}`,
                  borderRadius: '6px',
                  color: darkMode ? '#F3F4F6' : '#111827',
                }}
              />
              <Legend
                formatter={(value, entry) => {
                  const { payload } = entry;
                  return (
                    <span style={{ color: darkMode ? '#F3F4F6' : '#111827' }}>
                      {value} - {payload.value} days ({payload.percentage}%)
                    </span>
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>
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
      <Card className={`p-6 transition-colors duration-200 ${
        darkMode 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'
      }`}>
        <h2 className={`text-lg font-semibold mb-4 ${
          darkMode ? 'text-gray-100' : 'text-gray-900'
        }`}>
          Leave Balance Overview
        </h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke={darkMode ? '#374151' : '#E5E7EB'}
              />
              <XAxis 
                dataKey="name" 
                tick={{ fill: darkMode ? '#9CA3AF' : '#6B7280' }}
                tickLine={{ stroke: darkMode ? '#4B5563' : '#6B7280' }}
              />
              <YAxis 
                tick={{ fill: darkMode ? '#9CA3AF' : '#6B7280' }}
                tickLine={{ stroke: darkMode ? '#4B5563' : '#6B7280' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: darkMode ? '#1F2937' : '#ffffff',
                  border: `1px solid ${darkMode ? '#374151' : '#E5E7EB'}`,
                  borderRadius: '6px',
                  color: darkMode ? '#F3F4F6' : '#111827',
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="used"
                stroke={darkMode ? '#60A5FA' : '#3B82F6'}
                strokeWidth={2}
                name="Used Days"
              />
              <Line
                type="monotone"
                dataKey="remaining"
                stroke={darkMode ? '#34D399' : '#10B981'}
                strokeWidth={2}
                name="Remaining Days"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    );
  };

  const renderPayrollChart = () => {
    const chartData =
      recentPayslips.length > 0 ? recentPayslips : generateDefaultPayslips();

    return (
      <Card className={`p-6 transition-colors duration-200 ${
        darkMode 
          ? 'bg-gray-800 border-gray-700' 
          : 'bg-white border-gray-200'
      }`}>
        <h2 className={`text-lg font-semibold mb-4 ${
          darkMode ? 'text-gray-100' : 'text-gray-900'
        }`}>
          Salary Trend
        </h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke={darkMode ? '#374151' : '#E5E7EB'} 
              />
              <XAxis
                dataKey="month"
                tick={{ fill: darkMode ? '#9CA3AF' : '#6B7280' }}
                tickLine={{ stroke: darkMode ? '#4B5563' : '#6B7280' }}
              />
              <YAxis
                tick={{ fill: darkMode ? '#9CA3AF' : '#6B7280' }}
                tickLine={{ stroke: darkMode ? '#4B5563' : '#6B7280' }}
                tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}K`}
              />
              <Tooltip
                formatter={(value) => [`₹${value.toLocaleString()}`, "Amount"]}
                contentStyle={{
                  backgroundColor: darkMode ? '#1F2937' : '#ffffff',
                  border: `1px solid ${darkMode ? '#374151' : '#E5E7EB'}`,
                  borderRadius: '6px',
                  color: darkMode ? '#F3F4F6' : '#111827',
                }}
              />
              <Legend
                verticalAlign="top"
                height={36}
                wrapperStyle={{
                  paddingBottom: "20px",
                  color: darkMode ? '#F3F4F6' : '#111827',
                }}
              />
              <Line
                type="monotone"
                dataKey="grossSalary"
                name="Gross Salary"
                stroke={darkMode ? '#34D399' : '#22C55E'}
                strokeWidth={2}
                dot={{ fill: darkMode ? '#34D399' : '#22C55E', strokeWidth: 2 }}
                activeDot={{ r: 8 }}
              />
              <Line
                type="monotone"
                dataKey="amount"
                name="Net Salary"
                stroke={darkMode ? '#60A5FA' : '#3B82F6'}
                strokeWidth={2}
                dot={{ fill: darkMode ? '#60A5FA' : '#3B82F6', strokeWidth: 2 }}
                activeDot={{ r: 8 }}
              />
              <Line
                type="monotone"
                dataKey="deductions"
                name="Deductions"
                stroke={darkMode ? '#F87171' : '#EF4444'}
                strokeWidth={2}
                dot={{ fill: darkMode ? '#F87171' : '#EF4444', strokeWidth: 2 }}
                activeDot={{ r: 8 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </Card>
    );
  };

  if (loading) {
    return (
      <div className={`min-h-screen transition-colors duration-200 ${
        darkMode ? 'bg-gray-900' : 'bg-gray-50'
      }`}>
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className={`animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 ${
              darkMode ? 'border-blue-400' : 'border-blue-600'
            }`}></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen transition-colors duration-200 ${
      darkMode ? 'bg-gray-900' : 'bg-gray-50'
    }`}>
      <div className="container mx-auto px-4 py-8">
        {/* Header with Theme Toggle */}
        <div className="flex justify-between items-center mb-6">
          <h1 className={`text-2xl font-bold ${
            darkMode ? 'text-gray-100' : 'text-gray-900'
          }`}>
            Dashboard Overview
          </h1>
        
        </div>

        {renderStatisticCards()}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {renderAttendanceChart()}
          {renderLeaveBalanceChart()}
        </div>

        <div className="grid grid-cols-1 gap-6">
          {renderPayrollChart()}
        </div>
      </div>
    </div>
  );
}

export default EmployeeDashboard;