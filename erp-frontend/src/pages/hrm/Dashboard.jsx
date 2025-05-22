import { useEffect, useState } from "react";
import {
  UserGroupIcon,
  BuildingOfficeIcon,
  BriefcaseIcon,
  ClockIcon,
  CalendarIcon,
  BanknotesIcon,
  CheckCircleIcon,
  XCircleIcon,
} from "@heroicons/react/24/outline";
import useHrmStore from "../../stores/useHrmStore";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { Line, Bar, Doughnut } from "react-chartjs-2";
import { formatDistanceToNow } from "date-fns";

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

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

const Dashboard = () => {
  const {
    employees,
    departments,
    positions,
    attendance,
    leaves,
    payroll,
    fetchEmployees,
    fetchDepartments,
    fetchPositions,
    fetchAttendance,
    fetchLeaves,
    fetchPayroll,
    departmentsLoading,
    employeesLoading
  } = useHrmStore();

  const [stats, setStats] = useState({
    totalEmployees: 0,
    totalDepartments: 0,
    totalPositions: 0,
    totalAttendance: 0,
    totalLeaves: 0,
    totalPayroll: 0,
  });

  const [recentActivities, setRecentActivities] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([
          fetchEmployees(),
          fetchDepartments(),
          fetchPositions(),
          fetchAttendance(),
          fetchLeaves(),
          fetchPayroll(),
        ]);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    // Calculate stats when data changes
    setStats({
      totalEmployees: employees?.length || 0,
      totalDepartments: departments?.length || 0,
      totalPositions: positions?.length || 0,
      totalAttendance: attendance?.length || 0,
      totalLeaves: leaves?.length || 0,
      totalPayroll: payroll?.length || 0,
    });
  }, [employees, departments, positions, attendance, leaves, payroll]);

  // Function to generate recent activities
  useEffect(() => {
    const generateRecentActivities = () => {
      const activities = [];

      // Add new employees (joined in the last 30 days)
      if (Array.isArray(employees)) {
        employees.forEach((emp) => {
          if (emp.joiningDate) {
            const joinDate = new Date(emp.joiningDate);
            const thirtyDaysAgo = new Date();
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

            if (joinDate >= thirtyDaysAgo) {
              activities.push({
                type: "employee_joined",
                content: `${emp.firstName} ${emp.lastName} joined as ${
                  emp.position?.title || "Employee"
                }`,
                date: joinDate,
                icon: UserGroupIcon,
                iconBackground: "bg-blue-500",
              });
            }
          }
        });
      }

      // Add recent attendance records
      if (Array.isArray(attendance)) {
        attendance.forEach((record) => {
          if (record.date) {
            const date = new Date(record.date);
            activities.push({
              type: "attendance",
              content: `${record.employee?.firstName} ${record.employee?.lastName} marked as ${record.status}`,
              date: date,
              icon: ClockIcon,
              iconBackground:
                record.status === "Present"
                  ? "bg-green-500"
                  : record.status === "Late"
                  ? "bg-yellow-500"
                  : "bg-red-500",
            });
          }
        });
      }

      // Add recent leave requests
      if (Array.isArray(leaves)) {
        leaves.forEach((leave) => {
          if (leave.createdAt || leave.updatedAt) {
            const date = new Date(leave.updatedAt || leave.createdAt);
            activities.push({
              type: "leave",
              content: `Leave request ${leave.status.toLowerCase()} for ${
                leave.employee?.firstName
              } ${leave.employee?.lastName}`,
              date: date,
              icon: CalendarIcon,
              iconBackground:
                leave.status === "Approved"
                  ? "bg-green-500"
                  : leave.status === "Pending"
                  ? "bg-yellow-500"
                  : "bg-red-500",
            });
          }
        });
      }

      // Add recent payroll activities
      if (Array.isArray(payroll)) {
        payroll.forEach((pay) => {
          if (pay.createdAt || pay.processedDate) {
            const date = new Date(pay.processedDate || pay.createdAt);
            activities.push({
              type: "payroll",
              content: `Payroll processed for ${pay.employee?.firstName} ${pay.employee?.lastName}`,
              date: date,
              icon: BanknotesIcon,
              iconBackground: "bg-indigo-500",
            });
          }
        });
      }

      // Sort activities by date (most recent first) and take only the last 5
      return activities.sort((a, b) => b.date - a.date).slice(0, 5);
    };

    const activities = generateRecentActivities();
    setRecentActivities(activities);
  }, [employees, attendance, leaves, payroll]);

  // Add debug logging for data arrays
  useEffect(() => {
    console.log("Raw employees data:", employees);
    console.log("Is employees an array?", Array.isArray(employees));
    console.log("Employees length:", employees?.length);
    
    console.log("Raw attendance data:", attendance);
    console.log("Is attendance an array?", Array.isArray(attendance));
    console.log("Attendance length:", attendance?.length);
    
    console.log("Raw payroll data:", payroll);
    console.log("Is payroll an array?", Array.isArray(payroll));
    console.log("Payroll length:", payroll?.length);
  }, [employees, attendance, payroll]);

  // Attendance Status Distribution
  const attendanceData = {
    labels: ["Present", "Absent", "Late", "Leave"],
    datasets: [
      {
        data: [
          attendance?.filter((a) => a.status === "Present").length || 0,
          attendance?.filter((a) => a.status === "Absent").length || 0,
          attendance?.filter((a) => a.status === "Late").length || 0,
          attendance?.filter((a) => a.status === "On-Leave").length || 0,
        ],
        backgroundColor: ["#22c55e", "#ef4444", "#eab308", "#6366f1"],
      },
    ],
  };

  // Department Employee Distribution
  const departmentData = {
    labels: Array.isArray(departments) ? departments.map((dept) => dept.name) : [],
    datasets: [
      {
        label: "Number of Employees",
        data: Array.isArray(departments)
          ? departments.map((dept) => {
              // Count employees in this department
              const count =
                employees?.filter(
                  (emp) =>
                    emp.department &&
                    (emp.department._id === dept._id ||
                      emp.department.id === dept.id)
                ).length || 0;
              return count;
            })
          : [],
        backgroundColor: [
          "#3b82f6", // blue
          "#ef4444", // red
          "#22c55e", // green
          "#f59e0b", // yellow
          "#6366f1", // indigo
          "#ec4899", // pink
          "#8b5cf6", // purple
          "#14b8a6", // teal
        ],
        borderWidth: 1,
      },
    ],
  };

  // Add console logs for debugging
  useEffect(() => {
    console.log("Raw departments data:", departments);
    console.log("Is departments an array?", Array.isArray(departments));
    console.log("Departments length:", departments?.length);
    console.log("Department Data:", departmentData);
  }, [departments]);

  // Department chart options
  const departmentChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context) => {
            const label = context.dataset.label || "";
            const value = context.parsed.y;
            return `${label}: ${value} employees`;
          },
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          precision: 0,
        },
        title: {
          display: true,
          text: "Number of Employees",
        },
      },
      x: {
        ticks: {
          autoSkip: false,
          maxRotation: 45,
          minRotation: 45,
        },
        title: {
          display: true,
          text: "Departments",
        },
      },
    },
  };

  // Leave Status Distribution
  const leaveData = {
    labels: ["Approved", "Pending", "Rejected"],
    datasets: [
      {
        data: [
          Array.isArray(leaves) ? leaves.filter((l) => l.status === "Approved").length : 0,
          Array.isArray(leaves) ? leaves.filter((l) => l.status === "Pending").length : 0,
          Array.isArray(leaves) ? leaves.filter((l) => l.status === "Rejected").length : 0,
        ],
        backgroundColor: ["#22c55e", "#eab308", "#ef4444"],
      },
    ],
  };

  // Add debug logging for leaves data
  useEffect(() => {
    console.log("Raw leaves data:", leaves);
    console.log("Is leaves an array?", Array.isArray(leaves));
    console.log("Leaves length:", leaves?.length);
  }, [leaves]);

  // Monthly Payroll Trend
  const payrollData = {
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    datasets: [
      {
        label: "Total Payroll",
        data: Array(6)
          .fill(0)
          .map(() => Math.floor(Math.random() * 50000) + 30000),
        borderColor: "#6366f1",
        tension: 0.4,
      },
    ],
  };

  // Add loading state check at the beginning of the render
  if (isLoading || departmentsLoading || employeesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6 lg:p-8">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <SummaryCard
          icon={UserGroupIcon}
          title="Total Employees"
          value={stats.totalEmployees}
          change="+5.25%"
          isIncrease={true}
        />
        <SummaryCard
          icon={BuildingOfficeIcon}
          title="Departments"
          value={stats.totalDepartments}
          change="+2.5%"
          isIncrease={true}
        />
        <SummaryCard
          icon={BriefcaseIcon}
          title="Positions"
          value={stats.totalPositions}
          change="+3.2%"
          isIncrease={true}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Attendance Distribution */}
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h3 className="text-lg font-medium text-gray-900">
            Attendance Distribution
          </h3>
          <div className="mt-6 h-80">
            <Doughnut
              data={attendanceData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: "bottom",
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Department Employee Distribution */}
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h3 className="text-lg font-medium text-gray-900">
            Employees by Department
          </h3>
          <div className="mt-6 h-80">
            {departments?.length > 0 && employees?.length > 0 ? (
              <Bar data={departmentData} options={departmentChartOptions} />
            ) : (
              <div className="flex h-full items-center justify-center">
                <p className="text-gray-500">
                  No department or employee data available
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Leave Status Distribution */}
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h3 className="text-lg font-medium text-gray-900">
            Leave Status Distribution
          </h3>
          <div className="mt-6 h-80">
            <Doughnut
              data={leaveData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: "bottom",
                  },
                },
              }}
            />
          </div>
        </div>

        {/* Payroll Trend */}
        <div className="rounded-lg bg-white p-6 shadow-sm">
          <h3 className="text-lg font-medium text-gray-900">
            Monthly Payroll Trend
          </h3>
          <div className="mt-6 h-80">
            <Line
              data={payrollData}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    display: false,
                  },
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    ticks: {
                      callback: (value) => `$${value.toLocaleString()}`,
                    },
                  },
                },
              }}
            />
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
        <div className="mt-6">
          <div className="flow-root">
            <ul className="-mb-8">
              {recentActivities.length > 0 ? (
                recentActivities.map((activity, activityIdx) => (
                  <li key={activityIdx}>
                    <div className="relative pb-8">
                      {activityIdx !== recentActivities.length - 1 ? (
                        <span
                          className="absolute left-4 top-4 -ml-px h-full w-0.5 bg-gray-200"
                          aria-hidden="true"
                        />
                      ) : null}
                      <div className="relative flex space-x-3">
                        <div>
                          <span
                            className={`${activity.iconBackground} flex h-8 w-8 items-center justify-center rounded-full ring-8 ring-white`}
                          >
                            <activity.icon
                              className="h-5 w-5 text-white"
                              aria-hidden="true"
                            />
                          </span>
                        </div>
                        <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                          <div>
                            <p className="text-sm text-gray-500">
                              {activity.content}
                            </p>
                          </div>
                          <div className="whitespace-nowrap text-right text-sm text-gray-500">
                            <time dateTime={activity.date.toISOString()}>
                              {formatDistanceToNow(activity.date, {
                                addSuffix: true,
                              })}
                            </time>
                          </div>
                        </div>
                      </div>
                    </div>
                  </li>
                ))
              ) : (
                <div className="text-center py-4 text-gray-500">
                  No recent activities
                </div>
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
