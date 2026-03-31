import React, { useMemo, useState } from 'react';
import {
  eachDayOfInterval,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  format,
  isSameMonth,
  isToday,
  subMonths, addMonths
} from 'date-fns';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const CalendarView = ({ loggedDays, onDayClick }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const calendarMonths = useMemo(() => {
    return [subMonths(currentDate, 1), currentDate, addMonths(currentDate, 1)];
  }, [currentDate]);

  const goToPreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const goToNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const goToToday = () => {
    setCurrentDate(new Date());
  };

  const renderMonth = (monthDate, index) => {
    const firstDay = startOfMonth(monthDate);
    const lastDay = endOfMonth(monthDate);
    const startDay = startOfWeek(firstDay);
    const endDay = endOfWeek(lastDay);
    const monthDays = eachDayOfInterval({ start: startDay, end: endDay });

    return (
      <div 
        key={format(monthDate, 'yyyy-MM')}
        className={index > 0 ? "md:border-l md:pl-4 lg:pl-6" : ""}
        style={{ borderColor: 'rgba(255, 255, 255, 0.08)' }}
      >
        <div className={index < 2 ? "md:pr-4 lg:pr-6" : ""}>
        <h3 className="text-sm font-semibold text-center text-white mb-3" style={{ fontFamily: 'Manrope, sans-serif' }}>
          {format(monthDate, 'MMMM yyyy')}
        </h3>
        <div className="grid grid-cols-7 gap-1 text-center text-xs" style={{ color: 'rgba(255,255,255,0.5)' }}>
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(day => (
            <div key={day}>{day}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1 mt-2">
          {monthDays.map((day) => {
            const dayKey = format(day, 'yyyy-MM-dd');
            const isLogged = loggedDays.has(dayKey);
            const isCurrentMonth = isSameMonth(day, monthDate);
            const isTodayDate = isToday(day);

            return (
              <button
                key={day.toString()}
                disabled={!isLogged}
                onClick={() => isLogged && onDayClick(day)}
                className="relative w-9 h-9 flex items-center justify-center rounded-full text-xs transition-colors"
                style={{
                  color: isCurrentMonth ? 'white' : 'rgba(255,255,255,0.3)',
                  backgroundColor: isTodayDate ? 'rgba(0, 180, 216, 0.2)' : 'transparent',
                  border: isTodayDate ? '1px solid #00B4D8' : '1px solid transparent',
                  cursor: isLogged ? 'pointer' : 'default',
                }}
              >
                {isLogged && (
                  <div
                    className="absolute inset-0.5 rounded-full"
                    style={{
                      border: '2px solid #00B4D8',
                      boxShadow: '0 0 8px rgba(0, 180, 216, 0.5)',
                    }}
                  />
                )}
                <span className="relative z-10">{format(day, 'd')}</span>
              </button>
            );
          })}
        </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-4 rounded-2xl" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
      <div className="flex items-center justify-between mb-4 px-2">
        <h2 className="text-lg font-bold text-white" style={{ fontFamily: 'Manrope, sans-serif' }}>
          {format(currentDate, 'yyyy')}
        </h2>
        <div className="flex items-center gap-1">
          <button
            onClick={goToToday}
            className="px-3 py-1.5 rounded-full text-xs font-semibold transition-colors hover:bg-white/10 mr-1"
            style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.05)', 
              color: 'rgba(255, 255, 255, 0.8)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              fontFamily: 'Manrope, sans-serif'
            }}
          >
            Today
          </button>
          <button
            onClick={goToPreviousMonth}
            className="p-2 rounded-full transition-colors hover:bg-white/10"
            aria-label="Previous month"
          >
            <ChevronLeft size={20} className="text-white" />
          </button>
          <button
            onClick={goToNextMonth}
            className="p-2 rounded-full transition-colors hover:bg-white/10"
            aria-label="Next month"
          >
            <ChevronRight size={20} className="text-white" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-0">
        {calendarMonths.map(renderMonth)}
      </div>
    </div>
  );
};

export default CalendarView;