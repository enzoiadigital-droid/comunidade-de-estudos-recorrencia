import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';
import styles from './TrackerCalendar.module.css';

// Helper functions (same as TrackerEstudos.jsx)
function getLocalISODate(date = new Date()) {
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffset).toISOString().split('T')[0];
}

function formatDuration(minutes) {
  if (!minutes) return '0m';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function TrackerCalendar({ sessions = [], selectedDate, onSelectDate }) {
  const [viewMode, setViewMode] = useState('week'); // 'week' | 'month'
  const [currentDate, setCurrentDate] = useState(new Date());

  const todayStr = getLocalISODate(new Date());

  // Aggregate study time per day (YYYY-MM-DD -> minutes)
  const studyTimeByDay = useMemo(() => {
    const map = {};
    sessions.forEach(s => {
      const d = s.session_date;
      if (!map[d]) map[d] = 0;
      map[d] += (s.duration_minutes || 0);
    });
    return map;
  }, [sessions]);

  // Navigation
  const handlePrev = () => {
    const d = new Date(currentDate);
    if (viewMode === 'week') d.setDate(d.getDate() - 7);
    else d.setMonth(d.getMonth() - 1);
    setCurrentDate(d);
  };

  const handleNext = () => {
    const d = new Date(currentDate);
    if (viewMode === 'week') d.setDate(d.getDate() + 7);
    else d.setMonth(d.getMonth() + 1);
    setCurrentDate(d);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
    onSelectDate(todayStr);
  };

  const toggleDate = (dateStr) => {
    if (selectedDate === dateStr) {
      onSelectDate(null); // deselect
    } else {
      onSelectDate(dateStr);
    }
  };

  // Week View
  const renderWeek = () => {
    // Find Sunday of the current week
    const d = new Date(currentDate);
    const day = d.getDay();
    const sunday = new Date(d);
    sunday.setDate(d.getDate() - day);
    
    const days = [];
    for (let i = 0; i < 7; i++) {
      const current = new Date(sunday);
      current.setDate(sunday.getDate() + i);
      const dateStr = getLocalISODate(current);
      
      const dayName = current.toLocaleDateString('pt-BR', { weekday: 'short' }).slice(0, 3);
      const dayNum = current.getDate();
      
      const mins = studyTimeByDay[dateStr] || 0;
      const isToday = dateStr === todayStr;
      const isSelected = dateStr === selectedDate;
      const hasStudy = mins > 0;

      days.push(
        <div 
          key={dateStr}
          className={`${styles.dayCard} ${isToday ? styles.isToday : ''} ${isSelected ? styles.isSelected : ''} ${hasStudy ? styles.hasStudy : ''}`}
          onClick={() => toggleDate(dateStr)}
        >
          <span className={styles.dayName}>{dayName}</span>
          <span className={styles.dayNumber}>{dayNum}</span>
          {hasStudy ? (
            <span className={styles.dayTime}>{formatDuration(mins)}</span>
          ) : (
             <span className={styles.dayTime} style={{ opacity: 0 }}>0m</span>
          )}
        </div>
      );
    }

    return <div className={styles.weekGrid}>{days}</div>;
  };

  // Month View
  const renderMonth = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const startingDay = firstDay.getDay();
    const totalDays = lastDay.getDate();
    
    const days = [];
    
    // Previous month's trailing days
    for (let i = 0; i < startingDay; i++) {
      const prevDate = new Date(year, month, -startingDay + i + 1);
      days.push({ date: prevDate, isOtherMonth: true });
    }
    
    // Current month's days
    for (let i = 1; i <= totalDays; i++) {
      days.push({ date: new Date(year, month, i), isOtherMonth: false });
    }
    
    // Next month's leading days to complete grid (42 cells max)
    const remaining = 42 - days.length;
    if (remaining > 0 && remaining < 14) { 
        for (let i = 1; i <= remaining; i++) {
          days.push({ date: new Date(year, month + 1, i), isOtherMonth: true });
        }
    }

    const weekdays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    return (
      <div>
        <div className={styles.monthHeader}>
          {weekdays.map(w => <span key={w} className={styles.monthHeaderName}>{w}</span>)}
        </div>
        <div className={styles.monthGrid}>
          {days.map((item, idx) => {
            const dateStr = getLocalISODate(item.date);
            const mins = studyTimeByDay[dateStr] || 0;
            const isToday = dateStr === todayStr;
            const isSelected = dateStr === selectedDate;
            const hasStudy = mins > 0;

            return (
              <div 
                key={idx}
                className={`${styles.monthDay} ${item.isOtherMonth ? styles.isOtherMonth : ''} ${isToday ? styles.isToday : ''} ${isSelected ? styles.isSelected : ''}`}
                onClick={() => toggleDate(dateStr)}
              >
                <span className={styles.monthDayNumber}>{item.date.getDate()}</span>
                {hasStudy ? (
                  <>
                    <span className={styles.monthDayTime}>{formatDuration(mins)}</span>
                    <div className={styles.monthDayDot}></div>
                  </>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const monthName = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.titleArea}>
          <h2>Calendário</h2>
          <span className={styles.currentMonth}>{monthName}</span>
        </div>

        <div className={styles.controls}>
          <button className={styles.todayBtn} onClick={handleToday}>
            Hoje
          </button>
          
          <div className={styles.navGroup}>
            <button className={styles.navBtn} onClick={handlePrev}><ChevronLeft size={18} /></button>
            <button className={styles.navBtn} onClick={handleNext}><ChevronRight size={18} /></button>
          </div>

          <div className={styles.viewToggle}>
            <button 
              className={`${styles.toggleBtn} ${viewMode === 'week' ? styles.active : ''}`}
              onClick={() => setViewMode('week')}
            >
              Semana
            </button>
            <button 
              className={`${styles.toggleBtn} ${viewMode === 'month' ? styles.active : ''}`}
              onClick={() => setViewMode('month')}
            >
              Mês
            </button>
          </div>
        </div>
      </div>

      {viewMode === 'week' ? renderWeek() : renderMonth()}
    </div>
  );
}
