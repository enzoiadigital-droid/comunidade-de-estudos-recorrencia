import styles from './WeeklyGoalsSection.module.css';

function getWeekKey(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(new Date(dateStr + 'T12:00:00').setDate(diff));
  return monday.toISOString().split('T')[0];
}

function formatWeekRange(mondayStr) {
  const start = new Date(mondayStr + 'T12:00:00');
  const end = new Date(start);
  end.setDate(end.getDate() + 6);
  const fmt = d => d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
  return `${fmt(start)} – ${fmt(end)}`;
}

function formatTime(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function WeeklyGoalsSection({ sessions, goalHours }) {
  // All sessions, not filtered, group by week
  const weekMap = {};
  sessions.forEach(s => {
    const key = getWeekKey(s.session_date);
    weekMap[key] = (weekMap[key] || 0) + (s.duration_minutes || 0);
  });

  const weeks = Object.entries(weekMap)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 8);

  if (weeks.length === 0) {
    return (
      <div className={styles.empty}>
        <p>Sem histórico de semanas ainda. Comece a estudar para ver a evolução aqui!</p>
      </div>
    );
  }

  const goalMins = goalHours * 60;

  return (
    <div className={styles.list}>
      {weeks.map(([weekKey, mins]) => {
        const pct = goalMins > 0 ? Math.min(100, Math.round((mins / goalMins) * 100)) : 0;
        const done = pct >= 100;
        return (
          <div key={weekKey} className={styles.row}>
            <div className={styles.meta}>
              <span className={styles.week}>{formatWeekRange(weekKey)}</span>
              <div className={styles.right}>
                <span className={styles.time}>{formatTime(mins)} / {goalHours}h</span>
                <span className={`${styles.badge} ${done ? styles.done : styles.miss}`}>
                  {done ? '✓ Meta atingida' : `${pct}%`}
                </span>
              </div>
            </div>
            <div className={styles.track}>
              <div
                className={styles.fill}
                style={{
                  width: `${pct}%`,
                  background: done ? 'var(--color-success)' : pct >= 60 ? 'var(--color-gold)' : '#F97316'
                }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
