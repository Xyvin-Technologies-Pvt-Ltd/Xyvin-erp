import {
  Routes,
  Route,
  createBrowserRouter,
  RouterProvider,
} from "react-router-dom";
import DashboardLayout from "@/components/layouts/DashboardLayout";
import ProtectedRoute from "@/components/common/ProtectedRoute";

// Auth Pages
import Login from "@/pages/auth/Login";

// Dashboard Pages
import Dashboard from "@/pages/Dashboard";

// Employee Pages
import Profile from "@/pages/employee/Profile";
import EmployeeDashboard from "@/pages/employee/EmployeeDashboard";
import PaySlip from "@/pages/employee/PaySlip";
import LeaveApplication from "@/pages/employee/LeaveApplication";
import MyAttendance from "@/pages/employee/MyAttendance";
import MyProjects from "@/pages/employee/MyProjects";
import MyProjectKanban from "@/pages/employee/MyProjectKanban";

// HRM Pages
import HRMDashboard from "@/pages/hrm/Dashboard";
import Employees from "@/pages/hrm/Employees";
import Departments from "@/pages/hrm/Departments";
import Positions from "@/pages/hrm/Positions";
import Attendance from "@/pages/hrm/Attendance";
import Leave from "@/pages/hrm/Leave";
import Payroll from "@/pages/hrm/Payroll";

// Client Pages
import ClientList from "@/pages/clients/ClientList";

// Project Management Pages
import ProjectList from "@/pages/projects/ProjectList";
import ProjectKanban from "@/pages/projects/ProjectKanban";
import AssignProject from "@/pages/projects/AssignProject";
import AssignedProjects from "@/pages/projects/AssignedProjects";
import ProjectDetails from "@/pages/projects/ProjectDetails";

// FRM Pages
import FRMDashboard from "@/pages/frm/Dashboard";
import Expenses from "@/pages/frm/Expenses";
import PersonalLoans from "@/pages/frm/PersonalLoans";
import OfficeLoans from "@/pages/frm/OfficeLoans";
import Profits from "@/pages/frm/Profits";
import Events from "@/pages/hrm/Events";
import Notification from "@/pages/notification/Notification";

const router = createBrowserRouter(
  [
    {
      path: "/",
      element: <ProtectedRoute />,
      children: [
        {
          element: <DashboardLayout />,
          children: [
            {
              path: "/",
              element: <Dashboard />,
            },
            {
              path: "dashboard",
              element: <Dashboard />,
            },
            {
              path: "notifications",              
              element: <Notification />,
            },
            // Employee Routes
            {
              path: "employee",
              children: [
                {
                  path: "dashboard",
                  element: <EmployeeDashboard />,
                },
                {
                  path: "profile",
                  element: <Profile />,
                },
                {
                  path: "leaveapplication",
                  element: <LeaveApplication />,
                },
                {
                  path: "myattendance",
                  element: <MyAttendance />,
                },
                {
                  path: "payslip",
                  element: <PaySlip />,
                },
                {
                  path: "projects",
                  element: <MyProjects />,
                },
                {
                  path: "projects/kanban/:projectId",
                  element: <MyProjectKanban />,
                },
              ],
            },
            // HRM Routes
            {
              path: "hrm",
              children: [
                {
                  path: "dashboard",
                  element: <HRMDashboard />,
                },
                {
                  path: "employees",
                  element: <Employees />,
                },
                {
                  path: "departments",
                  element: <Departments />,
                },
                {
                  path: "positions",
                  element: <Positions />,
                },
                {
                  path: "attendance",
                  element: <Attendance />,
                },
                {
                  path: "leave",
                  element: <Leave />,
                },
                {
                  path: "payroll",
                  element: <Payroll />,
                },
                {
                  path: "events",
                  element: <Events />,
                },
              ],
            },
            // Client Routes
            {
              path: "clients",
              children: [
                {
                  path: "list",
                  element: <ClientList />,
                },
              ],
            },
            // Project Routes
            {
              path: "projects",
              children: [
                {
                  path: "list",
                  element: <ProjectList />,
                },
                {
                  path: "assign",
                  element: <AssignProject />,
                },
                {
                  path: "kanban/:projectId",
                  element: <ProjectKanban />,
                },
                {
                  path: "details/:projectId",
                  element: <ProjectDetails />,
                },
                {
                  path: "details",
                  element: <ProjectDetails />,
                },
              ],
            },
            // FRM Routes
            {
              path: "frm",
              children: [
                {
                  path: "dashboard",
                  element: <FRMDashboard />,
                },
                {
                  path: "expenses",
                  element: <Expenses />,
                },
                {
                  path: "personal-loans",
                  element: <PersonalLoans />,
                },
                {
                  path: "office-loans",
                  element: <OfficeLoans />,
                },
                {
                  path: "profits",
                  element: <Profits />,
                },
              ],
            },
          ],
        },
      ],
    },
    {
      path: "login",
      element: <Login />,
    },
  ],
  {
    future: {
      v7_startTransition: true,
      v7_relativeSplatPath: true,
    },
  }
);

const AppRoutes = () => {
  return <RouterProvider router={router} />;
};

export default AppRoutes;
