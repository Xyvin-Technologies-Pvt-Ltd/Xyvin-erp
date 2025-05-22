import { useEffect, useState, useCallback } from "react";
import {
  UsersIcon,
  BuildingOfficeIcon,
  BriefcaseIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import useHrmStore from "../stores/useHrmStore";

const Dashboard = () => {
  const { events, eventsLoading, eventsError, fetchEvents } = useHrmStore();

  // State for selected month in calendar
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarApi, setCalendarApi] = useState(null);

  useEffect(() => {
    console.log(events);
    fetchEvents().catch((err) => {
      console.error("Error fetching events:", err);
    });
  }, [fetchEvents]);

  // Helper function to get event color based on status
  const getEventColor = useCallback((status) => {
    switch (status?.toLowerCase()) {
      case "upcoming":
        return "#36A2EB";
      case "ongoing":
        return "#FFCE56";
      case "completed":
        return "#4BC0C0";
      default:
        return "#36A2EB";
    }
  }, []);

  // Transform events for calendar display
  const calendarEvents = useCallback(() => {
    return (
      events?.map((event) => ({
        id: event._id,
        title: event.title,
        start: event.startDate,
        end: event.endDate,
        status: event.status,
        backgroundColor: getEventColor(event.status),
        description: event.description,
      })) || []
    );
  }, [events, getEventColor]);

  // Filter events for the current month
  const getMonthlyEvents = useCallback(() => {
    if (!events) return [];

    // Create date objects for the first and last day of the selected month
    const monthStart = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth(),
      1
    );
    monthStart.setHours(0, 0, 0, 0);

    const monthEnd = new Date(
      selectedDate.getFullYear(),
      selectedDate.getMonth() + 1,
      0
    );
    monthEnd.setHours(23, 59, 59, 999);

    return events.filter((event) => {
      const eventStart = new Date(event.startDate);
      const eventEnd = event.endDate
        ? new Date(event.endDate)
        : new Date(event.startDate);

      // Normalize the time parts to avoid time-of-day comparison issues
      eventStart.setHours(0, 0, 0, 0);
      eventEnd.setHours(23, 59, 59, 999);

      return (
        (eventStart >= monthStart && eventStart <= monthEnd) || // Starts in this month
        (eventEnd >= monthStart && eventEnd <= monthEnd) || // Ends in this month
        (eventStart <= monthStart && eventEnd >= monthEnd) // Spans across this month
      );
    });
  }, [events, selectedDate]);

  const handleDatesSet = useCallback((arg) => {
    // Get the displayed date from the calendar
    const displayedDate = new Date(arg.view.currentStart);

    // Create a new date object to avoid reference issues
    const newDate = new Date(
      displayedDate.getFullYear(),
      displayedDate.getMonth(),
      1
    );

    // Update the selected date state
    setSelectedDate(newDate);
  }, []);

  // Handle calendar reference
  const handleCalendarRef = useCallback((ref) => {
    if (ref !== null) {
      setCalendarApi(ref.getApi());
    }
  }, []);

  const cards = [
    {
      name: "Total Events",
      value: events?.length || 0,
      icon: UsersIcon,
      change: "+4.75%",
      changeType: "positive",
    },
    {
      name: "Upcoming Events",
      value:
        events?.filter((e) => e.status?.toLowerCase() === "upcoming")?.length ||
        0,
      icon: BuildingOfficeIcon,
      change: "0%",
      changeType: "neutral",
    },
    {
      name: "Ongoing Events",
      value:
        events?.filter((e) => e.status?.toLowerCase() === "ongoing")?.length ||
        0,
      icon: BriefcaseIcon,
      change: "+2.5%",
      changeType: "positive",
    },
    {
      name: "Completed Events",
      value:
        events?.filter((e) => e.status?.toLowerCase() === "completed")
          ?.length || 0,
      icon: ClockIcon,
      change: "-3%",
      changeType: "negative",
    },
  ];

  if (eventsLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="spinner" />
      </div>
    );
  }

  if (eventsError) {
    return (
      <div className="flex h-full items-center justify-center text-red-600">
        <p>Error loading events: {eventsError}</p>
      </div>
    );
  }

  const monthlyEvents = getMonthlyEvents();
  const currentCalendarEvents = calendarEvents();

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <div
            key={card.name}
            className="relative overflow-hidden rounded-lg bg-white px-4 pb-12 pt-5 shadow sm:px-6 sm:pt-6"
          >
            <dt>
              <div className="absolute rounded-md bg-primary-500 p-3">
                <card.icon className="h-6 w-6 text-white" aria-hidden="true" />
              </div>
              <p className="ml-16 truncate text-sm font-medium text-gray-500">
                {card.name}
              </p>
            </dt>
            <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
              <p className="text-2xl font-semibold text-gray-900">
                {card.value}
              </p>
              <p
                className={`ml-2 flex items-baseline text-sm font-semibold ${
                  card.changeType === "positive"
                    ? "text-green-600"
                    : card.changeType === "negative"
                    ? "text-red-600"
                    : "text-gray-500"
                }`}
              >
                {card.change}
              </p>
            </dd>
          </div>
        ))}
      </div>

      {/* Calendar and Monthly Events */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* FullCalendar */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            Event Calendar
          </h3>
          <div className="mt-4 h-[400px]">
            <FullCalendar
              ref={handleCalendarRef}
              plugins={[dayGridPlugin]}
              initialView="dayGridMonth"
              events={currentCalendarEvents}
              eventContent={(eventInfo) => (
                <div className="cursor-pointer">
                  <b>{eventInfo.event.title}</b>
                  <p className="text-xs">
                    {eventInfo.event.extendedProps.status}
                  </p>
                </div>
              )}
              datesSet={handleDatesSet}
              height="100%"
              initialDate={selectedDate}
              firstDay={1}
            />
          </div>
        </div>

        {/* Monthly Event Listing */}
        <div className="rounded-lg bg-white p-6 shadow">
          <h3 className="text-lg font-medium leading-6 text-gray-900">
            Monthly Events (
            {selectedDate.toLocaleString("default", { month: "long" })}{" "}
            {selectedDate.getFullYear()})
          </h3>
          <div className="mt-4 max-h-[400px] overflow-y-auto">
            {monthlyEvents.length > 0 ? (
              <ul className="space-y-2">
                {monthlyEvents.map((event) => (
                  <li
                    key={event._id}
                    className="flex items-center justify-between rounded-md border p-2"
                  >
                    <div>
                      <p className="font-semibold">{event.title}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(event.startDate).toLocaleDateString()}
                        {event.endDate &&
                          event.endDate !== event.startDate &&
                          ` - ${new Date(
                            event.endDate
                          ).toLocaleDateString()}`}{" "}
                        • {event.status}
                      </p>
                      {event.description && (
                        <p className="mt-1 text-sm text-gray-600 line-clamp-2">
                          {event.description}
                        </p>
                      )}
                    </div>
                    <span
                      className="inline-block h-3 w-3 rounded-full"
                      style={{ backgroundColor: getEventColor(event.status) }}
                    />
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No events this month.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
