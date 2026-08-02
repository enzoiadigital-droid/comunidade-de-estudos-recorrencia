import { useState, useRef } from 'react';
import styles from './StudyChart.module.css';

const W = 700, H = 220, PAD = { top: 20, right: 20, bottom: 40, left: 48 };
const INNER_W = W - PAD.left - PAD.right;
const INNER_H = H - PAD.top - PAD.bottom;

function formatLabel(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
}

function buildDailyPoints(sessions, startDate, endDate) {
  const map = {};
  const cur = new Date(startDate + 'T12:00:00');
  const end = new Date(endDate + 'T12:00:00');
  while (cur <= end) {
    map[cur.toISOString().split('T')[0]] = 0;
    cur.setDate(cur.getDate() + 1);
  }
  sessions.forEach(s => {
    if (map[s.session_date] !== undefined) {
      map[s.session_date] += (s.duration_minutes || 0);
    }
  });
  return Object.entries(map).map(([date, mins]) => ({ date, hours: +(mins / 60).toFixed(2) }));
}

function buildWeeklyPoints(sessions, startDate, endDate) {
  const map = {};
  sessions.forEach(s => {
    const d = new Date(s.session_date + 'T12:00:00');
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(new Date(s.session_date + 'T12:00:00').setDate(diff));
    const key = monday.toISOString().split('T')[0];
    map[key] = (map[key] || 0) + (s.duration_minutes || 0);
  });
  return Object.entries(map)
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([date, mins]) => ({ date, hours: +(mins / 60).toFixed(2) }));
}

export default function StudyChart({ sessions, startDate, endDate }) {
  const [tooltip, setTooltip] = useState(null);
  const svgRef = useRef(null);

  const daysDiff = startDate && endDate
    ? Math.ceil((new Date(endDate) - new Date(startDate)) / 86400000)
    : 30;

  const points = daysDiff > 30
    ? buildWeeklyPoints(sessions, startDate, endDate)
    : buildDailyPoints(sessions, startDate, endDate);

  if (points.length === 0) {
    return (
      <div className={styles.empty}>
        <p>📊 Nenhum dado para exibir no período selecionado.</p>
      </div>
    );
  }

  const maxH = Math.max(...points.map(p => p.hours), 0.1);
  const yMax = Math.ceil(maxH) || 1;

  const toX = i => PAD.left + (i / Math.max(points.length - 1, 1)) * INNER_W;
  const toY = h => PAD.top + INNER_H - (h / yMax) * INNER_H;

  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${toX(i).toFixed(1)} ${toY(p.hours).toFixed(1)}`).join(' ');
  const areaD = `${pathD} L ${toX(points.length - 1).toFixed(1)} ${(PAD.top + INNER_H).toFixed(1)} L ${PAD.left} ${(PAD.top + INNER_H).toFixed(1)} Z`;

  // Y ticks
  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(f => +(yMax * f).toFixed(1));

  // X labels: show at most 8
  const step = Math.ceil(points.length / 8);
  const xLabels = points.filter((_, i) => i % step === 0 || i === points.length - 1);

  const handleMouseMove = (e) => {
    const svg = svgRef.current;
    if (!svg) return;
    const rect = svg.getBoundingClientRect();
    const scaleX = W / rect.width;
    const mx = (e.clientX - rect.left) * scaleX - PAD.left;
    const idx = Math.round((mx / INNER_W) * (points.length - 1));
    if (idx >= 0 && idx < points.length) {
      const pt = points[idx];
      const x = toX(idx);
      const y = toY(pt.hours);
      setTooltip({ x, y, date: pt.date, hours: pt.hours });
    }
  };

  return (
    <div className={styles.wrapper}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${W} ${H}`}
        className={styles.svg}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setTooltip(null)}
      >
        <defs>
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%"   stopColor="#D4AF37" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#D4AF37" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {yTicks.map(t => (
          <g key={t}>
            <line
              x1={PAD.left} y1={toY(t)} x2={PAD.left + INNER_W} y2={toY(t)}
              stroke="rgba(255,255,255,0.06)" strokeWidth="1"
            />
            <text x={PAD.left - 6} y={toY(t) + 4} textAnchor="end" fontSize="11" fill="#9CA3AF">
              {t}h
            </text>
          </g>
        ))}

        {/* Area fill */}
        <path d={areaD} fill="url(#areaGrad)" />

        {/* Line */}
        <path d={pathD} fill="none" stroke="#D4AF37" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Dots */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={toX(i)} cy={toY(p.hours)} r={p.hours > 0 ? 3 : 2}
            fill={p.hours > 0 ? '#D4AF37' : 'rgba(212,175,55,0.3)'}
          />
        ))}

        {/* X labels */}
        {xLabels.map((p, i) => {
          const idx = points.indexOf(p);
          return (
            <text key={i} x={toX(idx)} y={H - 8} textAnchor="middle" fontSize="10" fill="#9CA3AF">
              {formatLabel(p.date)}
            </text>
          );
        })}

        {/* Tooltip */}
        {tooltip && (
          <g>
            <line x1={tooltip.x} y1={PAD.top} x2={tooltip.x} y2={PAD.top + INNER_H} stroke="rgba(212,175,55,0.4)" strokeWidth="1" strokeDasharray="4,3" />
            <circle cx={tooltip.x} cy={tooltip.y} r={5} fill="#D4AF37" />
            <rect x={tooltip.x + 8} y={tooltip.y - 22} width={90} height={26} rx={5} fill="#1a2234" stroke="#D4AF37" strokeOpacity="0.5" />
            <text x={tooltip.x + 53} y={tooltip.y - 12} textAnchor="middle" fontSize="11" fill="#F3F4F6" fontWeight="600">
              {formatLabel(tooltip.date)} — {tooltip.hours.toFixed(1)}h
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
