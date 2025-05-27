import { Fragment, useState } from "react";
import { Dialog, Transition } from "@headlessui/react";
import {
  XMarkIcon,
  ChevronDownIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import { Link, useLocation } from "react-router-dom";
import {
  HomeIcon,
  UsersIcon,
  BuildingOfficeIcon,
  BriefcaseIcon,
  ClockIcon,
  CalendarIcon,
  BanknotesIcon,
  UserCircleIcon,
  DocumentTextIcon,
  UserGroupIcon,
  FolderIcon,
  CurrencyRupeeIcon,
  CreditCardIcon,
} from "@heroicons/react/24/outline";
import useAuthStore from "@/stores/auth.store";

const frmNavigation = {
  name: "Financial Management",
  icon: BanknotesIcon,
  children: [
    { name: "Dashboard", href: "/frm/dashboard", icon: ChartBarIcon },
    { name: "Expenses", href: "/frm/expenses", icon: CurrencyRupeeIcon },
    {
      name: "Personal Loans",
      href: "/frm/personal-loans",
      icon: CreditCardIcon,
    },
    { name: "Office Loans", href: "/frm/office-loans", icon: BanknotesIcon },
    { name: "Revenue", href: "/frm/profits", icon: FolderIcon },
  ],
};

const baseNavigation = [
  { name: "Dashboard", href: "/dashboard", icon: HomeIcon },
];

const employeeNavigation = {
  name: "Employee",
  icon: UserCircleIcon,
  children: [
    { name: "Dashboard", href: "/employee/dashboard", icon: ChartBarIcon },
    { name: "Profile", href: "/employee/profile", icon: UserCircleIcon },
    {
      name: "Leave Application",
      href: "/employee/leaveapplication",
      icon: CalendarIcon,
    },
    { name: "My Attendance", href: "/employee/myattendance", icon: ClockIcon },
    { name: "Pay Slip", href: "/employee/payslip", icon: DocumentTextIcon },
    { name: "My Projects", href: "/employee/projects", icon: FolderIcon },
  ],
};

const hrmNavigation = {
  name: "HRM",
  icon: UsersIcon,
  children: [
    { name: "Dashboard", href: "/hrm/dashboard", icon: ChartBarIcon },
    { name: "Employees", href: "/hrm/employees", icon: UsersIcon },
    { name: "Departments", href: "/hrm/departments", icon: BuildingOfficeIcon },
    { name: "Positions", href: "/hrm/positions", icon: BriefcaseIcon },
    { name: "Attendance", href: "/hrm/attendance", icon: ClockIcon },
    { name: "Leave", href: "/hrm/leave", icon: CalendarIcon },
    { name: "Payroll", href: "/hrm/payroll", icon: BanknotesIcon },
    { name: "Events", href: "/hrm/events", icon: CalendarIcon },
  ],
};

const clientsNavigation = {
  name: "Clients",
  icon: UserGroupIcon,
  children: [
    { name: "All Clients", href: "/clients/list", icon: UserGroupIcon },
  ],
};

const projectsNavigation = {
  name: "Project Management",
  icon: FolderIcon,
  children: [
    { name: "All Projects", href: "/projects/list", icon: FolderIcon },
    {
      name: "Project Details",
      href: "/projects/details",
      icon: DocumentTextIcon,
    },
  ],
};

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

const Sidebar = ({ open, setOpen }) => {
  const location = useLocation();
  const { user } = useAuthStore();
  const [openMenu, setOpenMenu] = useState(null);

  // Get user from localStorage as fallback if store is empty
  const userFromStorage =
    user ||
    (localStorage.getItem("user")
      ? JSON.parse(localStorage.getItem("user"))
      : null);

  // Use userFromStorage for roles
  const userRoles = userFromStorage?.role || "";

  console.log("Sidebar - Current user role:", userRoles);

  // Define role-based navigation permissions
  const navigationPermissions = {
    Employee: ["base", "employee"],
    "ERP System Administrator": [
      "base",
      "employee",
      "hrm",
      "clients",
      "projects",
      "frm",
    ],
    "IT Manager": ["base", "employee", "projects"],
    "Project Manager": ["base", "employee", "projects"],
    "HR Manager": ["base", "employee", "hrm"],
  };

  // Get allowed navigation sections for current user
  // Check all roles the user has, not just the first one
  let allowedSections = ["base", "employee"]; // default

  // Add sections from each role the user has
  const roleSections = navigationPermissions[userRoles] || [];
roleSections.forEach((section) => {
  if (!allowedSections.includes(section)) {
    allowedSections.push(section);
  }
});

  console.log("Sidebar - Allowed sections:", allowedSections);

  // Initialize navigation with base items if allowed
  const navigation = allowedSections.includes("base")
    ? [...baseNavigation]
    : [];

  // Add employee navigation if allowed
  if (allowedSections.includes("employee")) {
    navigation.push(employeeNavigation);
  }

  // Add HRM navigation if allowed
  if (allowedSections.includes("hrm")) {
    navigation.push(hrmNavigation);
  }

  // Add clients navigation if allowed
  if (allowedSections.includes("clients")) {
    navigation.push(clientsNavigation);
  }

  // Add projects navigation if allowed
  if (allowedSections.includes("projects")) {
    navigation.push(projectsNavigation);
  }

  // Add frm navigation if allowed
  if (allowedSections.includes("frm")) {
    navigation.push(frmNavigation);
  }

  console.log("Sidebar - Final navigation:", navigation);

  const toggleMenu = (menuName) => {
    // If clicking the same menu, close it. Otherwise, open the new menu and close others
    setOpenMenu(openMenu === menuName ? null : menuName);
  };

  const NavItem = ({ item, mobile = false }) => {
    const isExpanded = openMenu === item.name;

    if (!item.children) {
      return (
        <Link
          to={item.href}
          className={classNames(
            location.pathname === item.href
              ? "bg-gray-50 text-primary-600"
              : "text-gray-700 hover:text-primary-600 hover:bg-gray-50",
            "group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold"
          )}
        >
          <item.icon
            className={classNames(
              location.pathname === item.href
                ? "text-primary-600"
                : "text-gray-400 group-hover:text-primary-600",
              "h-6 w-6 shrink-0"
            )}
            aria-hidden="true"
          />
          {item.name}
        </Link>
      );
    }

    return (
      <div className="space-y-1">
        <button
          onClick={() => toggleMenu(item.name)}
          className={classNames(
            "w-full group flex items-center justify-between rounded-md p-2 text-sm font-semibold leading-6",
            isExpanded
              ? "text-primary-600 bg-gray-50"
              : "text-gray-700 hover:text-primary-600 hover:bg-gray-50"
          )}
        >
          <div className="flex items-center gap-x-3">
            <item.icon
              className={classNames(
                isExpanded
                  ? "text-primary-600"
                  : "text-gray-400 group-hover:text-primary-600",
                "h-6 w-6 shrink-0"
              )}
              aria-hidden="true"
            />
            {item.name}
          </div>
          <ChevronDownIcon
            className={classNames(
              "h-5 w-5 shrink-0 transition-transform duration-200",
              isExpanded ? "transform rotate-180" : ""
            )}
          />
        </button>
        <Transition
          show={isExpanded}
          enter="transition ease-out duration-200"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-150"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <ul role="list" className="pl-8 space-y-1">
            {item.children.map((child) => (
              <li key={child.name}>
                <Link
                  to={child.href}
                  className={classNames(
                    location.pathname === child.href
                      ? "bg-gray-50 text-primary-600"
                      : "text-gray-700 hover:text-primary-600 hover:bg-gray-50",
                    "group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-semibold"
                  )}
                >
                  <child.icon
                    className={classNames(
                      location.pathname === child.href
                        ? "text-primary-600"
                        : "text-gray-400 group-hover:text-primary-600",
                      "h-6 w-6 shrink-0"
                    )}
                    aria-hidden="true"
                  />
                  {child.name}
                </Link>
              </li>
            ))}
          </ul>
        </Transition>
      </div>
    );
  };

  return (
    <>
      {/* Mobile sidebar */}
      <Transition.Root show={open} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={setOpen}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-900/80" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                <Transition.Child
                  as={Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                    <button
                      type="button"
                      className="-m-2.5 p-2.5"
                      onClick={() => setOpen(false)}
                    >
                      <span className="sr-only">Close sidebar</span>
                      <XMarkIcon
                        className="h-6 w-6 text-white"
                        aria-hidden="true"
                      />
                    </button>
                  </div>
                </Transition.Child>

                <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white px-6 pb-4">
                  <div className="flex h-16 shrink-0 items-center">
                    <img
                      className="h-8 w-auto"
                      src="/logo.svg"
                      alt="Your Company"
                    />
                  </div>
                  <nav className="flex flex-1 flex-col">
                    <ul role="list" className="flex flex-1 flex-col gap-y-7">
                      <li>
                        <ul role="list" className="-mx-2 space-y-1">
                          {navigation.map((item) => (
                            <li key={item.name}>
                              <NavItem item={item} mobile={true} />
                            </li>
                          ))}
                        </ul>
                      </li>
                    </ul>
                  </nav>
                </div>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Static sidebar for desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-gray-200 bg-white px-6 pb-4">
          <div className="flex h-16 shrink-0 items-center">
            <img className="h-8 w-auto" src="/logo.svg" alt="Your Company" />
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => (
                    <li key={item.name}>
                      <NavItem item={item} />
                    </li>
                  ))}
                </ul>
              </li>
            </ul>
          </nav>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
