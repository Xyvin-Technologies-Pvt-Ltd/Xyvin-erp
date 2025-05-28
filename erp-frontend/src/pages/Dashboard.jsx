import { useEffect, useState, useCallback } from "react";
import {
  UsersIcon,
  BuildingOfficeIcon,
  BriefcaseIcon,
  ClockIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";
import useHrmStore from "../stores/useHrmStore";

// Enhanced dark theme color palette
const darkColorPalette = {
  primary: "bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-700",
  secondary: "bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600",
  accent: "bg-gradient-to-br from-pink-500 via-rose-500 to-red-500",
  completed: "bg-gradient-to-br from-slate-600 via-gray-600 to-zinc-700",
  background: {
    primary: "bg-slate-900",
    secondary: "bg-slate-800",
    card: "bg-slate-800/50",
    hover: "hover:bg-slate-700/50",
  },
  text: {
    primary: "text-slate-100",
    secondary: "text-slate-300",
    muted: "text-slate-400",
  },
  border: "border-slate-700",
  accent_colors: {
    upcoming: "bg-blue-500",
    ongoing: "bg-amber-500",
    completed: "bg-emerald-500",
  }
};

const Dashboard = () => {
  const { events, eventsLoading, eventsError, fetchEvents } = useHrmStore();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());

  useEffect(() => {
    fetchEvents().catch((err) => {
      console.error("Error fetching events:", err);
    });
  }, [fetchEvents]);

  const getEventColor = useCallback((status) => {
    switch (status?.toLowerCase()) {
      case "upcoming":
        return "bg-blue-500";
      case "ongoing":
        return "bg-amber-500";
      case "completed":
        return "bg-emerald-500";
      default:
        return "bg-blue-500";
    }
  }, []);

  const getMonthlyEvents = useCallback(() => {
    if (!events) return [];
    const monthStart = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
    const monthEnd = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);

    return events.filter((event) => {
      const eventStart = new Date(event.startDate);
      const eventEnd = event.endDate ? new Date(event.endDate) : new Date(event.startDate);
      return (
        (eventStart >= monthStart && eventStart <= monthEnd) ||
        (eventEnd >= monthStart && eventEnd <= monthEnd) ||
        (eventStart <= monthStart && eventEnd >= monthEnd)
      );
    });
  }, [events, currentMonth]);

  // Generate calendar days
  const generateCalendarDays = useCallback(() => {
    const year = currentMonth.getFullYear();
    const month = currentMonth.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    const currentDate = new Date(startDate);
    
    for (let i = 0; i < 42; i++) {
      const dayEvents = events.filter(event => {
        const eventDate = new Date(event.startDate);
        return eventDate.toDateString() === currentDate.toDateString();
      });
      
      days.push({
        date: new Date(currentDate),
        isCurrentMonth: currentDate.getMonth() === month,
        isToday: currentDate.toDateString() === new Date().toDateString(),
        events: dayEvents
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    return days;
  }, [currentMonth, events]);

  const navigateMonth = (direction) => {
    setCurrentMonth(prev => {
      const newDate = new Date(prev);
      newDate.setMonth(prev.getMonth() + direction);
      return newDate;
    });
  };

  const cards = [
    {
      name: "Total Events",
      value: events?.length || 0,
      icon: UsersIcon,
      change: "+4.75%",
      changeType: "positive",
      gradient: darkColorPalette.primary,
    },
    {
      name: "Upcoming Events",
      value: events?.filter((e) => e.status?.toLowerCase() === "upcoming")?.length || 0,
      icon: BuildingOfficeIcon,
      change: "0%",
      changeType: "neutral",
      gradient: darkColorPalette.secondary,
    },
    {
      name: "Ongoing Events",
      value: events?.filter((e) => e.status?.toLowerCase() === "ongoing")?.length || 0,
      icon: BriefcaseIcon,
      change: "+2.5%",
      changeType: "positive",
      gradient: darkColorPalette.accent,
    },
    {
      name: "Completed Events",
      value: events?.filter((e) => e.status?.toLowerCase() === "completed")?.length || 0,
      icon: ClockIcon,
      change: "-3%",
      changeType: "negative",
      gradient: darkColorPalette.completed,
    },
  ];

  const monthlyEvents = getMonthlyEvents();
  const calendarDays = generateCalendarDays();
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  if (eventsLoading) {
    return (
      <div className={`min-h-screen ${darkColorPalette.background.primary} flex items-center justify-center`}>
        <motion.div
          className="h-16 w-16 rounded-full border-4 border-t-violet-500 border-slate-700 animate-spin"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
        />
      </div>
    );
  }

  if (eventsError) {
    return (
      <div className={`min-h-screen ${darkColorPalette.background.primary} flex items-center justify-center`}>
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <p className="text-red-400 text-lg">Error loading events: {eventsError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen w-full ${darkColorPalette.background.primary} font-sans m-0 p-0`}>
      <div className="space-y-8 p-6 w-full">
        {/* Stats Cards */}
        <motion.div
          className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {cards.map((card, index) => (
            <motion.div
              key={card.name}
              className={`relative overflow-hidden rounded-2xl p-6 shadow-2xl backdrop-blur-sm border border-white/10 transform transition-all duration-300 hover:scale-105 hover:shadow-violet-500/25 ${card.gradient}`}
              whileHover={{ y: -8, scale: 1.02 }}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent opacity-50" />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="rounded-xl bg-white/20 backdrop-blur-sm p-3 shadow-lg">
                    <card.icon className="h-7 w-7 text-white" />
                  </div>
                  <div className="text-right">
                    <p
                      className={`text-sm font-semibold ${
                        card.changeType === "positive"
                          ? "text-green-200"
                          : card.changeType === "negative"
                          ? "text-red-200"
                          : "text-gray-200"
                      }`}
                    >
                      {card.change}
                    </p>
                  </div>
                </div>
                <div>
                  <p className="text-sm font-medium text-white/90 mb-2">{card.name}</p>
                  <p className="text-4xl font-bold text-white">{card.value}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Calendar and Monthly Events */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Enhanced Calendar */}
          <motion.div
            className={`rounded-2xl ${darkColorPalette.background.card} backdrop-blur-sm p-6 shadow-2xl border ${darkColorPalette.border}`}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className={`text-2xl font-bold ${darkColorPalette.text.primary}`}>
                Event Calendar
              </h3>
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => navigateMonth(-1)}
                  className={`p-2 rounded-lg ${darkColorPalette.background.secondary} ${darkColorPalette.background.hover} ${darkColorPalette.text.primary} transition-colors`}
                >
                  <ChevronLeftIcon className="h-5 w-5" />
                </button>
                <span className={`px-4 py-2 rounded-lg ${darkColorPalette.background.secondary} ${darkColorPalette.text.primary} font-semibold`}>
                  {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
                </span>
                <button
                  onClick={() => navigateMonth(1)}
                  className={`p-2 rounded-lg ${darkColorPalette.background.secondary} ${darkColorPalette.background.hover} ${darkColorPalette.text.primary} transition-colors`}
                >
                  <ChevronRightIcon className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-2 mb-4">
              {weekDays.map(day => (
                <div key={day} className={`text-center py-2 ${darkColorPalette.text.secondary} font-semibold text-sm`}>
                  {day}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((day, index) => (
                <motion.div
                  key={index}
                  className={`relative p-2 h-20 rounded-lg transition-all duration-200 ${
                    day.isCurrentMonth 
                      ? `${darkColorPalette.background.secondary} ${darkColorPalette.background.hover}` 
                      : 'bg-slate-900/20'
                  } ${
                    day.isToday ? 'ring-2 ring-violet-500 bg-violet-500/20' : ''
                  }`}
                  whileHover={{ scale: 1.05 }}
                >
                  <span className={`text-sm font-medium ${
                    day.isCurrentMonth 
                      ? darkColorPalette.text.primary 
                      : darkColorPalette.text.muted
                  } ${day.isToday ? 'text-violet-200' : ''}`}>
                    {day.date.getDate()}
                  </span>
                  {day.events.length > 0 && (
                    <div className="absolute bottom-1 left-1 right-1 flex space-x-1">
                      {day.events.slice(0, 2).map((event, i) => (
                        <div
                          key={i}
                          className={`h-1.5 flex-1 rounded-full ${getEventColor(event.status)}`}
                        />
                      ))}
                      {day.events.length > 2 && (
                        <div className="text-xs text-violet-400 font-semibold">
                          +{day.events.length - 2}
                        </div>
                      )}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Enhanced Monthly Event Listing */}
          <motion.div
            className={`rounded-2xl ${darkColorPalette.background.card} backdrop-blur-sm p-6 shadow-2xl border ${darkColorPalette.border}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <h3 className={`text-2xl font-bold ${darkColorPalette.text.primary} mb-6`}>
              Monthly Events ({currentMonth.toLocaleString("default", { month: "long" })} {currentMonth.getFullYear()})
            </h3>
            <div className="max-h-[500px] overflow-y-auto pr-2 space-y-4 custom-scrollbar">
              <AnimatePresence>
                {monthlyEvents.length > 0 ? (
                  monthlyEvents.map((event, index) => (
                    <motion.div
                      key={event._id}
                      className={`rounded-xl p-4 ${darkColorPalette.background.secondary} ${darkColorPalette.background.hover} border ${darkColorPalette.border} transition-all duration-300 hover:shadow-lg hover:shadow-violet-500/10`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      whileHover={{ scale: 1.02, y: -2 }}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <div
                              className={`w-3 h-3 rounded-full ${getEventColor(event.status)} shadow-lg`}
                            />
                            <h4 className={`font-bold ${darkColorPalette.text.primary} text-lg`}>
                              {event.title}
                            </h4>
                          </div>
                          <p className={`${darkColorPalette.text.secondary} text-sm mb-2`}>
                            {new Date(event.startDate).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric'
                            })}
                            {event.endDate && event.endDate !== event.startDate &&
                              ` - ${new Date(event.endDate).toLocaleDateString('en-US', {
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric'
                              })}`}
                          </p>
                          {event.description && (
                            <p className={`${darkColorPalette.text.muted} text-sm leading-relaxed`}>
                              {event.description}
                            </p>
                          )}
                        </div>
                        <div className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          event.status === 'upcoming' ? 'bg-blue-500/20 text-blue-300' :
                          event.status === 'ongoing' ? 'bg-amber-500/20 text-amber-300' :
                          'bg-emerald-500/20 text-emerald-300'
                        }`}>
                          {event.status}
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <div className={`text-6xl ${darkColorPalette.text.muted} mb-4`}>📅</div>
                    <p className={`${darkColorPalette.text.muted} text-lg`}>No events this month</p>
                    <p className={`${darkColorPalette.text.muted} text-sm mt-2`}>Check back later for updates</p>
                  </div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>

      <style jsx>{`
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          background-color: rgb(15 23 42) !important;
          margin: 0 !important;
          padding: 0 !important;
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgb(30 41 59);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgb(100 116 139);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgb(148 163 184);
        }
      `}</style>
    </div>
  );
};

export default Dashboard;