import { Navigate, Outlet, useLocation } from "react-router-dom";
import useAuthStore from "@/stores/auth.store";
import { useEffect, useState } from "react";

const ProtectedRoute = () => {
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuthStore();
  const isAuthenticated = localStorage.getItem("token");
  const location = useLocation();

  // If there's a token but no user in the store, try to load from localStorage
  useEffect(() => {
    if (isAuthenticated && !user) {
      try {
        const storedUser = JSON.parse(localStorage.getItem("user"));
        if (storedUser) {
          // Update the user in the store
          const { updateUser } = useAuthStore.getState();
          updateUser(storedUser);
        }
      } catch (error) {
        console.error("Error parsing user from localStorage:", error);
      }
    }
    setIsLoading(false);
  }, [isAuthenticated, user]);

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If still loading, show nothing
  if (isLoading) {
    return null;
  }

  // Get user from localStorage as fallback if store is empty
  const userFromStorage =
    user ||
    (localStorage.getItem("user")
      ? JSON.parse(localStorage.getItem("user"))
      : null);

  if (!userFromStorage) {
    // If no user data is available, clear token and redirect to login
    localStorage.removeItem("token");
    return <Navigate to="/login" replace />;
  }

  // Ensure user has a role property
  if (!userFromStorage.role) {
    // Assign default Employee role
    userFromStorage.role = "Employee";

    // Update localStorage with the updated user object
    localStorage.setItem("user", JSON.stringify(userFromStorage));
  }

  // Check role-based access
  const path = location.pathname.toLowerCase();
  const userRole = userFromStorage.role;

  // Log for debugging
  console.log("Current user:", userFromStorage);
  console.log("Current user role:", userRole);
  console.log("Current path:", path);

  // If user has no role, grant access to at least basic routes
  if (!userRole) {
    if (path === "/" || path === "/dashboard" || path === "/profile") {
      return <Outlet />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  // Define role-based route permissions
  const routePermissions = {
    Employee: [
      "/",
      "/dashboard",
      "/profile",
      "/projects",
      "/employee",
      "/employee/dashboard",
      "/employee/profile",
      "/employee/leaveapplication",
      "/employee/myattendance",
      "/employee/payslip",
      "/employee/projects",
    ],
    "ERP System Administrator": [
      "/",
      "/dashboard",
      "/employee",
      "/profile",
      "/hrm",
      "/clients",
      "/projects",
      "/frm",
      "/hrm/dashboard",
      "/hrm/employees",
      "/hrm/departments",
      "/hrm/positions",
      "/hrm/attendance",
      "/hrm/leave",
      "/hrm/payroll",
      "/hrm/events",
      "/clients/list",
      "/projects/list",
      "/projects/details",
      "/frm/dashboard",
      "/frm/expenses",
      "/frm/personal-loans",
      "/frm/office-loans",
      "/frm/profits",
    ],
    "Admin": [
      "/",
      "/dashboard",
      "/employee",
      "/profile",
      "/hrm",
      "/clients",
      "/projects",
      "/frm",
      "/hrm/dashboard",
      "/hrm/employees",
      "/hrm/departments",
      "/hrm/positions",
      "/hrm/attendance",
      "/hrm/leave",
      "/hrm/payroll",
      "/hrm/events",
      "/clients/list",
      "/projects/list",
      "/projects/details",
      "/frm/dashboard",
      "/frm/expenses",
      "/frm/personal-loans",
      "/frm/office-loans",
      "/frm/profits",
    ],
    "IT Manager": [
      "/",
      "/dashboard",
      "/profile",
      "/employee",
      "/projects",
      "/projects/list",
      "/projects/details",
      "/hrm/departments",
      "/hrm/positions",
    ],
    "Project Manager": [
      "/",
      "/dashboard",
      "/employee",
      "/profile",
      "/projects",
      "/projects/list",
      "/projects/details",
      "/hrm/departments",
      "/hrm/positions",
    ],
    "HR Manager": [
      "/",
      "/dashboard",
      "/employee",
      "/profile",
      "/hrm",
      "/hrm/dashboard",
      "/hrm/employees",
      "/hrm/departments",
      "/hrm/positions",
      "/hrm/attendance",
      "/hrm/leave",
      "/hrm/payroll",
      "/hrm/events",
    ],
    "Finance Manager": [
      "/",
      "/dashboard",
      "/employee",
      "/profile",
      "/frm",
      "/frm/dashboard",
      "/frm/expenses",
      "/frm/personal-loans",
      "/frm/office-loans",
      "/frm/profits",
    ],
    "Sales Manager": [
      "/",
      "/dashboard",
      "/employee",
      "/profile",
      "/clients",
      "/clients/list",
    ],
  };

  // Check if user has access to the current path based on their role
  const allowedPaths = routePermissions[userRole] || [];
  const hasAccess = allowedPaths.some((allowedPath) => {
    const normalizedPath = path.toLowerCase();
    const normalizedAllowedPath = allowedPath.toLowerCase();

    // Handle exact matches
    if (normalizedPath === normalizedAllowedPath) return true;

    // Handle child paths (e.g., /projects/details/123 should match /projects/details)
    if (normalizedPath.startsWith(normalizedAllowedPath + "/")) return true;

    // Root path check (special case)
    if (normalizedAllowedPath === "/" && normalizedPath === "/") return true;

    return false;
  });

  console.log("Has access:", hasAccess, "for path:", path);

  // If user doesn't have access to the current path, redirect to dashboard
  if (!hasAccess && path !== "/") {
    console.log("Redirecting to /dashboard from:", path);
    return <Navigate to="/dashboard" replace />;
  }

  // If authenticated and has access, render child routes
  return <Outlet />;
};

export default ProtectedRoute;
