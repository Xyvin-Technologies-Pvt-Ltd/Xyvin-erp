import { Fragment } from "react";
import { Menu, Transition } from "@headlessui/react";
import {
  Bars3Icon,
  BellIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { useNavigate } from "react-router-dom";
import useAuthStore from "@/stores/auth.store";
import { useEffect, useState } from "react";
import NotificationDropdown from "@/pages/notification/NotificationDropdown";

const userNavigation = [
  { name: "Your Profile", href: "/employee/profile" },
  // { name: "Settings", href: "/settings" },
];

function classNames(...classes) {
  return classes.filter(Boolean).join(" ");
}

const Header = ({ onMenuClick }) => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const { logout } = useAuthStore();

  useEffect(() => {
    const currentUser = useAuthStore.getState().user;
    setUser(currentUser);
  }, []);

  // Get display name from user object
  const getDisplayName = () => {
    if (!user) return "User";
    return user.username || user.email?.split("@")[0] || "User";
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 bg-[#1e2251] px-4 shadow-md sm:gap-x-6 sm:px-6 lg:px-8">
      <button
        type="button"
        className="-m-2.5 p-2.5 text-gray-200 hover:text-white lg:hidden transition-colors duration-200 ease-in-out"
        onClick={onMenuClick}
      >
        <span className="sr-only">Open sidebar</span>
        <Bars3Icon className="h-6 w-6" aria-hidden="true" />
      </button>

      {/* Separator */}
      <div className="h-6 w-px bg-gray-600 lg:hidden" aria-hidden="true" />

      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        <div className="flex flex-1" />
        <div className="flex items-center gap-x-4 lg:gap-x-6">
          <NotificationDropdown />
          {/* Separator */}
          <div
            className="hidden lg:block lg:h-6 lg:w-px lg:bg-gray-600"
            aria-hidden="true"
          />

          {/* Profile dropdown */}
          <Menu as="div" className="relative">
            <Menu.Button className="-m-1.5 flex items-center p-1.5 group hover:bg-indigo-700 rounded-lg transition-all duration-200 ease-in-out">
              <span className="sr-only">Open user menu</span>
              <UserCircleIcon
                className="h-8 w-8 text-gray-400 group-hover:text-white transition-colors duration-200"
                aria-hidden="true"
              />
              <span className="hidden lg:flex lg:items-center">
                <span
                  className="ml-4 text-sm font-medium leading-6 text-white group-hover:text-white"
                  aria-hidden="true"
                >
                  {getDisplayName()}
                </span>
                <span className="ml-2 text-sm text-gray-400 group-hover:text-white transition-colors duration-200">
                  ({user?.role || "user"})
                </span>
              </span>
            </Menu.Button>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-150"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-100"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 z-10 mt-2.5 w-36 origin-top-right rounded-lg bg-[#1e2251] py-2 shadow-lg ring-1 ring-indigo-900/50 focus:outline-none">
                {userNavigation.map((item) => (
                  <Menu.Item key={item.name}>
                    {({ active }) => (
                      <a
                        href={item.href}
                        className={classNames(
                          active ? "bg-indigo-700 text-white" : "text-gray-200",
                          "block px-4 py-2 text-sm leading-6 hover:bg-indigo-700 hover:text-white transition-all duration-200 ease-in-out"
                        )}
                      >
                        {item.name}
                      </a>
                    )}
                  </Menu.Item>
                ))}
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={handleLogout}
                      className={classNames(
                        active ? "bg-indigo-700 text-white" : "text-gray-200",
                        "block w-full px-4 py-2 text-left text-sm leading-6 hover:bg-indigo-700 hover:text-white transition-all duration-200 ease-in-out"
                      )}
                    >
                      Sign out
                    </button>
                  )}
                </Menu.Item>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </div>
    </div>
  );
};

export default Header;