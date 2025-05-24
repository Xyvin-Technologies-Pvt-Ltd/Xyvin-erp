import { useEffect, useState, useCallback } from "react";
import {
  UsersIcon,
  BuildingOfficeIcon,
  BriefcaseIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import { Tooltip } from "react-tooltip";
import { motion, AnimatePresence } from "framer-motion";
import useHrmStore from "../stores/useHrmStore";

// Define a modern color palette
const colorPalette = {
  primary: "bg-gradient-to-r from-indigo-500 to-purple-600",
  secondary: "bg-gradient-to-r from-teal-400 to-cyan-500",
  accent: "bg-gradient-to-r from-pink-500 to-rose-500",
  text: {
    primary: "text-gray-900",
    secondary: "text-gray-600",
  },
};

const Dashboard = () => {
  const { events, eventsLoading, eventsError, fetchEvents } = useHrmStore();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [calendarApi, setCalendarApi] = useState(null);

  useEffect(() => {
    fetchEvents().catch((err) => {
      console.error("Error fetching events:", err);
    });
  }, [fetchEvents]);

  const getEventColor = useCallback((status) => {
    switch (status?.toLowerCase()) {
      case "upcoming":
        return "bg-blue-400";
      case "ongoing":
        return "bg-yellow-400";
      case "completed":
        return "bg-green-400";
      default:
        return "bg-blue-400";
    }
  }, []);

  const calendarEvents = useCallback(() => {
    return (
      events?.map((event) => ({
        id: event._id,
        title: event.title,
        start: event.startDate,
        end: event.endDate,
        status: event.status,
        backgroundColor: getEventColor(event.status).split(" ")[0].replace("bg-", "#"),
        borderColor: getEventColor(event.status).split(" ")[0].replace("bg-", "#"),
        description: event.description,
      })) || []
    );
  }, [events, getEventColor]);

  const getMonthlyEvents = useCallback(() => {
    if (!events) return [];
    const monthStart = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    monthStart.setHours(0, 0, 0, 0);
    const monthEnd = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
    monthEnd.setHours(23, 59, 59, 999);

    return events.filter((event) => {
      const eventStart = new Date(event.startDate);
      const eventEnd = event.endDate ? new Date(event.endDate) : new Date(event.startDate);
      eventStart.setHours(0, 0, 0, 0);
      eventEnd.setHours(23, 59, 59, 999);
      return (
        (eventStart >= monthStart && eventStart <= monthEnd) ||
        (eventEnd >= monthStart && eventEnd <= monthEnd) ||
        (eventStart <= monthStart && eventEnd >= monthEnd)
      );
    });
  }, [events, selectedDate]);

  const handleDatesSet = useCallback((arg) => {
    const displayedDate = new Date(arg.view.currentStart);
    setSelectedDate(new Date(displayedDate.getFullYear(), displayedDate.getMonth(), 1));
  }, []);

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
      gradient: colorPalette.primary,
    },
    {
      name: "Upcoming Events",
      value: events?.filter((e) => e.status?.toLowerCase() === "upcoming")?.length || 0,
      icon: BuildingOfficeIcon,
      change: "0%",
      changeType: "neutral",
      gradient: colorPalette.secondary,
    },
    {
      name: "Ongoing Events",
      value: events?.filter((e) => e.status?.toLowerCase() === "ongoing")?.length || 0,
      icon: BriefcaseIcon,
      change: "+2.5%",
      changeType: "positive",
      gradient: colorPalette.accent,
    },
    {
      name: "Completed Events",
      value: events?.filter((e) => e.status?.toLowerCase() === "completed")?.length || 0,
      icon: ClockIcon,
      change: "-3%",
      changeType: "negative",
      gradient: "bg-gradient-to-r from-gray-400 to-gray-600",
    },
  ];

  if (eventsLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <motion.div
          className="h-12 w-12 rounded-full border-4 border-t-indigo-500 border-gray-200 animate-spin"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        />
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
    <div className="space-y-8 p-6 bg-gray-50 min-h-screen font-sans">
      {/* Stats Cards */}
      <motion.div
        className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {cards.map((card) => (
          <motion.div
            key={card.name}
            className={`relative overflow-hidden rounded-xl p-6 shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-xl ${card.gradient}`}
            whileHover={{ y: -5 }}
          >
            <div className="absolute top-4 left-4 rounded-lg bg-white/20 p-3">
              <card.icon className="h-6 w-6 text-white" aria-hidden="true" />
            </div>
            <div className="ml-16">
              <p className="text-sm font-medium text-white/80">{card.name}</p>
              <div className="flex items-baseline mt-2">
                <p className="text-3xl font-bold text-white">{card.value}</p>
                <p
                  className={`ml-3 text-sm font-semibold ${
                    card.changeType === "positive"
                      ? "text-green-300"
                      : card.changeType === "negative"
                      ? "text-red-300"
                      : "text-gray-300"
                  }`}
                >
                  {card.change}
                </p>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Calendar and Monthly Events */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* FullCalendar */}
        <motion.div
          className="rounded-xl bg-white p-6 shadow-lg"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h3 className={`text-xl font-semibold ${colorPalette.text.primary} mb-4`}>
            Event Calendar
          </h3>
          <div className="h-[450px] rounded-lg overflow-hidden">
            <FullCalendar
              ref={handleCalendarRef}
              plugins={[dayGridPlugin]}
              initialView="dayGridMonth"
              events={currentCalendarEvents}
              eventContent={(eventInfo) => (
                <div
                  className="cursor-pointer p-1 rounded"
                  data-tooltip-id={`tooltip-${eventInfo.event.id}`}
                  data-tooltip-content={`${eventInfo.event.title}\n${eventInfo.event.extendedProps.status}\n${eventInfo.event.extendedProps.description || "No description"}`}
                >
                  <b className="text-sm">{eventInfo.event.title}</b>
                  <p className="text-xs text-gray-600">{eventInfo.event.extendedProps.status}</p>
                </div>
              )}
              datesSet={handleDatesSet}
              height="100%"
              initialDate={selectedDate}
              firstDay={1}
              eventDisplay="block"
              eventBorderColor="transparent"
              dayMaxEvents={3}
              moreLinkContent={({ num }) => `+${num} more`}
              moreLinkClassNames="text-indigo-600 font-semibold"
            />
            <Tooltip
              id="tooltip"
              place="top"
              style={{ backgroundColor: "#1F2937", color: "#fff", borderRadius: "8px", padding: "8px" }}
            />
          </div>
        </motion.div>

        {/* Monthly Event Listing */}
        <motion.div
          className="rounded-xl bg-white p-6 shadow-lg"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <h3 className={`text-xl font-semibold ${colorPalette.text.primary} mb-4`}>
            Monthly Events ({selectedDate.toLocaleString("default", { month: "long" })} {selectedDate.getFullYear()})
          </h3>
          <div className="max-h-[450px] overflow-y-auto pr-2">
            <AnimatePresence>
              {monthlyEvents.length > 0 ? (
                <ul className="space-y-3">
                  {monthlyEvents.map((event) => (
                    <motion.li
                      key={event._id}
                      className={`flex items-center justify-between rounded-lg p-4 border ${getEventColor(event.status)} bg-opacity-10 hover:bg-opacity-20 transition-all duration-200`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div>
                        <p className={`font-semibold ${colorPalette.text.primary}`}>{event.title}</p>
                        <p className={`text-sm ${colorPalette.text.secondary}`}>
                          {new Date(event.startDate).toLocaleDateString()}
                          {event.endDate && event.endDate !== event.startDate &&
                            ` - ${new Date(event.endDate).toLocaleDateString()}`} • {event.status}
                        </p>
                        {event.description && (
                          <p className="mt-1 text-sm text-gray-600 line-clamp-2">{event.description}</p>
                        )}
                      </div>
                      <span
                        className="inline-block h-3 w-3 rounded-full"
                        style={{ backgroundColor: getEventColor(event.status).split(" ")[0].replace("bg-", "#") }}
                      />
                    </motion.li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-500">No events this month.</p>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Dashboard;