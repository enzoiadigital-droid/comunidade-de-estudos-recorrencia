import { useState } from 'react';
import styles from './ConsistencyHeatmap.module.css';

function getLocalDate(dateStr) {
  return new Date(dateStr + 'T12:00:00');
}

function addDays(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function toISO(date) {
  return date.toISOString().split('T')[0];
}

function getIntensity(mins) {
  if (!mins || mins === 0) return 0;
  if (mins <= 30) return 1;
  if (mins <= 60) return 2;
  if (mins <= 120) return 3;
  return 4;
}

function formatDate(dateStr) {
  return new Date(dateStr + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatTime(mins) {
  if (!mins) return 'Sem estudo';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

const DAYS_LABEL = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
const MONTHS_PT = ['Jan','Fev','Mar','Abr','Mai','Jun','Jul','Ago','Set','Out','Nov','Dez'];

export default function ConsistencyHeatmap({ sessions }) {
  const [tooltip, setTooltip] = useState(null);

  // Build map date → minutes
  const map = {};
  sessions.forEach(s => {
    map[s.session_date] = (map[s.session_date] || 0) + (s.duration_minutes || 0);
  });

  // Build 17 weeks back from today
  const today = new Date();
  const WEEKS = 17;

  // Start from the nearest Sunday (17 weeks ago)
  const startDate = new Date(today);
  startDate.setDate(startDate.getDate() - today.getDay() - (WEEKS - 1) * 7);

  const weeks = [];
  for (let w = 0; w < WEEKS; w++) {
    const days = [];
    for (let d = 0; d < 7; d++) {
      const date = addDays(startDate, w * 7 + d);
      const iso = toISO(date);
      const mins = map[iso] || 0;
      const isFuture = date > today;
      days.push({ date: iso, mins, intensity: isFuture ? -1 : getIntensity(mins), isFuture });
    }
    weeks.push(days);
  }

  // Month labels: detect first day of each month in our range
  const monthLabels = [];
  weeks.forEach((week, wi) => {
    week.forEach(day => {
      const d = getLocalDate(day.date);
      if (d.getDate() === 1 || (wi === 0 && d.getDate() <= 7)) {
        const existingMonth = monthLabels.find(m => m.month === d.getMonth() && m.year === d.getFullYear());
        if (!existingMonth) {
          monthLabels.push({ month: d.getMonth(), year: d.getFullYear(), weekIdx: wi });
        }
      }
    });
  });

  return (
    <div className={styles.wrapper}>
      <div className={styles.heatmap}>
        {/* Day labels column */}
        <div className={styles.dayLabels}>
          <div className={styles.monthRow} /> {/* spacer for month row */}
          {DAYS_LABEL.map((d, i) => (
            <div key={i} className={styles.dayLabel}>{i % 2 === 1 ? d : ''}</div>
          ))}
        </div>

        {/* Weeks grid */}
        <div className={styles.weeksScroll}>
          {/* Month labels */}
          <div className={styles.monthRow}>
            {weeks.map((_, wi) => {
              const label = monthLabels.find(m => m.weekIdx === wi);
              return (
                <div key={wi} className={styles.monthCell}>
                  {label ? MONTHS_PT[label.month] : ''}
                </div>
              );
            })}
          </div>

          {/* Day cells */}
          <div className={styles.grid}>
            {weeks.map((week, wi) => (
              <div key={wi} className={styles.week}>
                {week.map((day, di) => (
                  <div
                    key={di}
                    className={`${styles.cell} ${styles[`i${day.intensity < 0 ? 'future' : day.intensity}`]}`}
                    onMouseEnter={e => !day.isFuture && setTooltip({ ...day, rect: e.target.getBoundingClientRect() })}
                    onMouseLeave={() => setTooltip(null)}
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Tooltip */}
      {tooltip && (
        <div className={styles.tooltip} style={{ '--tx': `${tooltip.rect.left}px`, '--ty': `${tooltip.rect.top}px` }}>
          <strong>{formatDate(tooltip.date)}</strong>
          <span>{formatTime(tooltip.mins)}</span>
        </div>
      )}

      {/* Legend */}
      <div className={styles.legend}>
        <span className={styles.legendLabel}>Menos</span>
        {[0,1,2,3,4].map(i => <div key={i} className={`${styles.legendCell} ${styles[`i${i}`]}`} />)}
        <span className={styles.legendLabel}>Mais</span>
      </div>
    </div>
  );
}
