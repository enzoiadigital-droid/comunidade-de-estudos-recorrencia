import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import styles from './SummaryCards.module.css';

function formatTime(minutes) {
  if (!minutes || minutes === 0) return '0h 0m';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function Delta({ current, prev, unit = '' }) {
  if (prev === null || prev === undefined || prev === 0) return null;
  const pct = Math.round(((current - prev) / prev) * 100);
  if (Math.abs(pct) < 1) return <span className={styles.deltaFlat}><Minus size={12} /> Estável</span>;
  if (pct > 0) return <span className={styles.deltaUp}><TrendingUp size={12} /> +{pct}% vs. anterior</span>;
  return <span className={styles.deltaDown}><TrendingDown size={12} /> {pct}% vs. anterior</span>;
}

export default function SummaryCards({ sessions, prevSessions, streak, goalHours }) {
  // Current period
  const totalMins = sessions.reduce((s, x) => s + (x.duration_minutes || 0), 0);
  const uniqueDays = new Set(sessions.map(s => s.session_date)).size;
  const now = new Date();
  const weekStart = (() => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.setDate(diff)).toISOString().split('T')[0];
  })();
  const weekMins = sessions
    .filter(s => s.session_date >= weekStart)
    .reduce((sum, s) => sum + (s.duration_minutes || 0), 0);
  const goalPct = goalHours > 0 ? Math.min(100, Math.round((weekMins / (goalHours * 60)) * 100)) : 0;

  // Previous period
  const prevMins = prevSessions.reduce((s, x) => s + (x.duration_minutes || 0), 0);
  const prevDays = new Set(prevSessions.map(s => s.session_date)).size;

  const cards = [
    {
      label: 'Tempo Estudado',
      value: formatTime(totalMins),
      sub: `no período selecionado`,
      delta: <Delta current={totalMins} prev={prevMins} />,
      icon: '⏱',
      accent: 'gold',
    },
    {
      label: 'Dias Estudados',
      value: `${uniqueDays} ${uniqueDays === 1 ? 'dia' : 'dias'}`,
      sub: `sessões registradas`,
      delta: <Delta current={uniqueDays} prev={prevDays} />,
      icon: '📅',
      accent: 'blue',
    },
    {
      label: 'Sequência Atual',
      value: `${streak} ${streak === 1 ? 'dia' : 'dias'}`,
      sub: streak > 0 ? '🔥 continue assim!' : 'Estude hoje para começar',
      delta: null,
      icon: '🔥',
      accent: 'orange',
    },
    {
      label: 'Meta Semanal',
      value: `${goalPct}%`,
      sub: `${formatTime(weekMins)} de ${goalHours}h esta semana`,
      delta: null,
      icon: '🎯',
      accent: goalPct >= 100 ? 'green' : 'gold',
      bar: goalPct,
    },
  ];

  return (
    <div className={styles.grid}>
      {cards.map(card => (
        <div key={card.label} className={`${styles.card} ${styles[card.accent]}`}>
          <div className={styles.cardTop}>
            <span className={styles.icon}>{card.icon}</span>
            <span className={styles.label}>{card.label}</span>
          </div>
          <div className={styles.value}>{card.value}</div>
          {card.bar !== undefined && (
            <div className={styles.barTrack}>
              <div
                className={styles.barFill}
                style={{ width: `${Math.min(100, card.bar)}%`, background: card.bar >= 100 ? 'var(--color-success)' : 'var(--color-gold)' }}
              />
            </div>
          )}
          <div className={styles.sub}>{card.sub}</div>
          {card.delta}
        </div>
      ))}
    </div>
  );
}
