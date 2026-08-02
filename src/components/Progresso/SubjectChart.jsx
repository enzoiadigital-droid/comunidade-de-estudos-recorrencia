import styles from './SubjectChart.module.css';

function formatTime(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function SubjectChart({ sessions }) {
  const map = {};
  sessions.forEach(s => {
    if (s.subject) map[s.subject] = (map[s.subject] || 0) + (s.duration_minutes || 0);
  });

  const items = Object.entries(map)
    .map(([subject, mins]) => ({ subject, mins }))
    .sort((a, b) => b.mins - a.mins);

  const total = items.reduce((s, x) => s + x.mins, 0);

  if (items.length === 0) {
    return (
      <div className={styles.empty}>
        <p>📚 Nenhum dado de matéria no período selecionado.</p>
      </div>
    );
  }

  const COLORS = ['#D4AF37','#E6C555','#B8972C','#F59E0B','#FBBF24','#FCD34D'];

  return (
    <div className={styles.list}>
      {items.map((item, i) => {
        const pct = total > 0 ? Math.round((item.mins / total) * 100) : 0;
        return (
          <div key={item.subject} className={styles.row}>
            <div className={styles.meta}>
              <span className={styles.name}>{item.subject}</span>
              <span className={styles.time}>{formatTime(item.mins)} · {pct}%</span>
            </div>
            <div className={styles.track}>
              <div
                className={styles.fill}
                style={{ width: `${pct}%`, background: COLORS[i % COLORS.length] }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}
