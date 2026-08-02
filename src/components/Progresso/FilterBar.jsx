import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import styles from './FilterBar.module.css';

const PERIODS = [
  { label: '7 dias', value: 7 },
  { label: '30 dias', value: 30 },
  { label: '90 dias', value: 90 },
  { label: 'Personalizado', value: 'custom' },
];

export default function FilterBar({ period, setPeriod, customStart, setCustomStart, customEnd, setCustomEnd, subject, setSubject, subjects }) {
  return (
    <div className={styles.bar}>
      <div className={styles.periodGroup}>
        {PERIODS.map(p => (
          <button
            key={p.value}
            className={`${styles.periodBtn} ${period === p.value ? styles.active : ''}`}
            onClick={() => setPeriod(p.value)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {period === 'custom' && (
        <div className={styles.customRange}>
          <input
            type="date"
            value={customStart}
            onChange={e => setCustomStart(e.target.value)}
            className={styles.dateInput}
          />
          <span className={styles.dateSep}>até</span>
          <input
            type="date"
            value={customEnd}
            onChange={e => setCustomEnd(e.target.value)}
            className={styles.dateInput}
          />
        </div>
      )}

      <div className={styles.subjectWrapper}>
        <select
          className={styles.subjectSelect}
          value={subject}
          onChange={e => setSubject(e.target.value)}
        >
          <option value="">Todas as matérias</option>
          {subjects.map(s => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <ChevronDown size={14} className={styles.chevron} />
      </div>
    </div>
  );
}
