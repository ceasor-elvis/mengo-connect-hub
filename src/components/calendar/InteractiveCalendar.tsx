import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Clock, MapPin, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CalendarEvent {
  id: string | number;
  title: string;
  start: Date;
  end: Date;
  resource?: {
    description?: string;
    visibility?: string;
    location?: string;
  };
}

interface InteractiveCalendarProps {
  events: CalendarEvent[];
}

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

function isSameDay(d1: Date, d2: Date) {
  return d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate();
}

export const InteractiveCalendar: React.FC<InteractiveCalendarProps> = ({ events }) => {
  const today = new Date();
  const [currentMonth, setCurrentMonth] = useState(today.getMonth());
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [direction, setDirection] = useState(0);

  const daysInMonth = getDaysInMonth(currentYear, currentMonth);
  const firstDay = getFirstDayOfMonth(currentYear, currentMonth);

  const calendarDays = useMemo(() => {
    const days: (number | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  }, [firstDay, daysInMonth]);

  const getEventsForDay = (day: number) => {
    const date = new Date(currentYear, currentMonth, day);
    return events.filter(e => isSameDay(e.start, date));
  };

  const goToPrevMonth = () => {
    setDirection(-1);
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
    setSelectedDate(null);
  };

  const goToNextMonth = () => {
    setDirection(1);
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
    setSelectedDate(null);
  };

  const isToday = (day: number) => {
    return day === today.getDate() &&
      currentMonth === today.getMonth() &&
      currentYear === today.getFullYear();
  };

  const selectedDayEvents = selectedDate ? getEventsForDay(selectedDate.getDate()) : [];

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -300 : 300, opacity: 0 }),
  };

  return (
    <div className="relative w-full">
      {/* Calendar Header */}
      <div className="flex items-center justify-between mb-6">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={goToPrevMonth}
          className="p-2 rounded-xl bg-muted hover:bg-muted/80 transition-colors"
        >
          <ChevronLeft className="w-5 h-5 text-foreground" />
        </motion.button>

        <motion.h3
          key={`${currentYear}-${currentMonth}`}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xl font-bold text-foreground"
        >
          {MONTHS[currentMonth]} {currentYear}
        </motion.h3>

        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={goToNextMonth}
          className="p-2 rounded-xl bg-muted hover:bg-muted/80 transition-colors"
        >
          <ChevronRight className="w-5 h-5 text-foreground" />
        </motion.button>
      </div>

      {/* Weekday Headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {WEEKDAYS.map(day => (
          <div key={day} className="text-center text-xs font-semibold text-muted-foreground uppercase tracking-wider py-2">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar Grid with Animation */}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={`${currentYear}-${currentMonth}`}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
          className="grid grid-cols-7 gap-1"
        >
          {calendarDays.map((day, idx) => {
            if (day === null) {
              return <div key={`empty-${idx}`} className="h-14 sm:h-20" />;
            }

            const dayEvents = getEventsForDay(day);
            const hasEvents = dayEvents.length > 0;
            const isSelected = selectedDate?.getDate() === day &&
              selectedDate?.getMonth() === currentMonth &&
              selectedDate?.getFullYear() === currentYear;

            return (
              <motion.button
                key={`day-${day}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.01 }}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedDate(new Date(currentYear, currentMonth, day))}
                className={`
                  relative h-14 sm:h-20 rounded-xl border transition-all duration-200
                  flex flex-col items-center justify-start pt-1.5 sm:pt-2 gap-0.5
                  ${isToday(day)
                    ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/30"
                    : isSelected
                      ? "bg-accent border-primary/50 text-accent-foreground"
                      : hasEvents
                        ? "bg-card border-border hover:border-primary/40 hover:shadow-md"
                        : "bg-card/50 border-transparent hover:bg-card hover:border-border"
                  }
                `}
              >
                <span className={`text-sm font-medium ${isToday(day) ? "font-bold" : ""}`}>
                  {day}
                </span>

                {hasEvents && (
                  <div className="flex gap-0.5 mt-0.5">
                    {dayEvents.slice(0, 3).map((e, i) => (
                      <motion.div
                        key={i}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.2 + i * 0.05 }}
                        className={`w-1.5 h-1.5 rounded-full ${
                          e.resource?.visibility === "private"
                            ? "bg-purple-500"
                            : isToday(day) ? "bg-primary-foreground" : "bg-primary"
                        }`}
                      />
                    ))}
                  </div>
                )}

                {/* Event preview on larger screens */}
                {hasEvents && (
                  <div className="hidden sm:block w-full px-1 overflow-hidden">
                    <p className={`text-[9px] truncate font-medium ${
                      isToday(day) ? "text-primary-foreground/80" : "text-muted-foreground"
                    }`}>
                      {dayEvents[0].title}
                    </p>
                  </div>
                )}
              </motion.button>
            );
          })}
        </motion.div>
      </AnimatePresence>

      {/* Selected Day Events Panel */}
      <AnimatePresence>
        {selectedDate && (
          <motion.div
            initial={{ opacity: 0, y: 20, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: 20, height: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className="mt-4 overflow-hidden"
          >
            <div className="rounded-2xl border bg-card p-4 sm:p-6 shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-bold text-foreground">
                  {selectedDate.toLocaleDateString("en-US", {
                    weekday: "long",
                    month: "long",
                    day: "numeric",
                  })}
                </h4>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setSelectedDate(null)}
                  className="p-1 rounded-lg hover:bg-muted"
                >
                  <X className="w-4 h-4 text-muted-foreground" />
                </motion.button>
              </div>

              {selectedDayEvents.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">
                  No events scheduled for this day.
                </p>
              ) : (
                <div className="space-y-3">
                  {selectedDayEvents.map((event, i) => (
                    <motion.div
                      key={event.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => setSelectedEvent(event)}
                      className={`
                        p-4 rounded-xl border cursor-pointer transition-all
                        ${event.resource?.visibility === "private"
                          ? "border-purple-500/30 bg-purple-500/5 hover:bg-purple-500/10"
                          : "border-primary/20 bg-primary/5 hover:bg-primary/10"
                        }
                      `}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h5 className="font-semibold text-foreground">{event.title}</h5>
                          {event.resource?.description && (
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {event.resource.description}
                            </p>
                          )}
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-[10px] shrink-0 ${
                            event.resource?.visibility === "private"
                              ? "border-purple-500/50 text-purple-600"
                              : "border-primary/50 text-primary"
                          }`}
                        >
                          {event.resource?.visibility === "private" ? "Private" : "Public"}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {event.start.toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                          })}
                        </span>
                        {event.resource?.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {event.resource.location}
                          </span>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Event Detail Modal */}
      <AnimatePresence>
        {selectedEvent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
            onClick={() => setSelectedEvent(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card rounded-2xl border shadow-2xl p-6 max-w-md w-full"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-xl font-bold text-foreground">{selectedEvent.title}</h3>
                <motion.button
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setSelectedEvent(null)}
                  className="p-1 rounded-lg hover:bg-muted"
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Clock className="w-4 h-4 text-primary" />
                  {selectedEvent.start.toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </div>

                {selectedEvent.resource?.location && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MapPin className="w-4 h-4 text-primary" />
                    {selectedEvent.resource.location}
                  </div>
                )}

                {selectedEvent.resource?.description && (
                  <div className="mt-4 p-4 rounded-xl bg-muted/50 text-sm text-foreground leading-relaxed">
                    {selectedEvent.resource.description}
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
