import React, { Fragment } from 'react';
import { Menu, Transition } from '@headlessui/react';
import { BellIcon, CheckIcon, TrashIcon } from '@heroicons/react/24/outline';
import { formatDistanceToNow } from 'date-fns';
import useNotificationStore from "../hooks/useNotificationsStore"
import { Link } from 'react-router-dom';

const NotificationDropdown = () => {
  const {
    notifications,
    unreadCount,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    isLoading,
    error,
    fetchNotifications,
  } = useNotificationStore();

  // Fetch notifications when the component mounts
  React.useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  // Format the notification date
  const formatDate = (dateString) => {
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (error) {
      return 'Unknown date';
    }
  };

  return (
    <Menu as="div" className="relative inline-block text-left">
      <div>
        <Menu.Button className="bg-white p-1 rounded-full text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 relative">
          <span className="sr-only">View notifications</span>
          <BellIcon className="h-6 w-6" aria-hidden="true" />
          {unreadCount > 0 && (
            <span className="absolute top-1 block h-4 w-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center transform -translate-y-1/2 translate-x-1/2">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Menu.Button>
      </div>

      <Transition
        as={Fragment}
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="origin-top-right absolute right-0 mt-2 w-80 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
          <div className="py-1">
            <div className="px-4 py-2 border-b border-gray-200 flex justify-between items-center">
              <h3 className="text-sm font-medium text-gray-900">Notifications</h3>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={markAllAsRead}
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  Mark all as read
                </button>
              )}
            </div>

            {isLoading ? (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">Loading...</div>
            ) : error ? (
              <div className="px-4 py-3 text-sm text-red-500 text-center">{error}</div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">No notifications</div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                {notifications.slice(0, 5).map((notification) => (
                  <Menu.Item key={notification._id}>
                    {({ active }) => (
                      <div
                        className={`
                          ${active ? 'bg-gray-50' : ''}
                          ${!notification.read ? 'bg-blue-50' : ''}
                          px-4 py-2 border-b border-gray-100 last:border-b-0
                        `}
                      >
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <Link
                              to={notification.link || '#'}
                              className="text-sm font-medium text-gray-900 hover:text-blue-600"
                            >
                              {notification.title}
                            </Link>
                            <p className="text-sm text-gray-600 mt-0.5">{notification.message}</p>
                            <p className="text-xs text-gray-400 mt-1">
                              {formatDate(notification.createdAt)}
                            </p>
                          </div>
                          <div className="flex space-x-1 ml-2">
                            {!notification.read && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  markAsRead(notification._id);
                                }}
                                className="p-1 text-blue-600 hover:text-blue-800 rounded-full hover:bg-blue-50"
                              >
                                <span className="sr-only">Mark as read</span>
                                <CheckIcon className="h-4 w-4" aria-hidden="true" />
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteNotification(notification._id);
                              }}
                              className="p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                            >
                              <span className="sr-only">Delete</span>
                              <TrashIcon className="h-4 w-4" aria-hidden="true" />
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </Menu.Item>
                ))}
              </div>
            )}

            {notifications.length > 0 && (
              <div className="px-4 py-2 border-t border-gray-200 text-center">
                <Link
                  to="/notifications"
                  className="text-xs text-blue-600 hover:text-blue-800 font-medium"
                >
                  View all notifications
                </Link>
              </div>
            )}
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
};

export default NotificationDropdown;