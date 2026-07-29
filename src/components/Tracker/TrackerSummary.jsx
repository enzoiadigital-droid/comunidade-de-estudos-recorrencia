import { Settings, Clock, Target, Flame } from 'lucide-react';
import styles from './TrackerSummary.module.css';

export default function TrackerSummary({ 
  timeToday, 
  timeThisWeek, 
  goalHours, 
  streak,
  onOpenConfig 
}) {
  const progressPercent = Math.min(100, Math.round((timeThisWeek / 60) / goalHours * 100));

  const formatHrsMins = (totalMins) => {
    const h = Math.floor(totalMins / 60);
    const m = totalMins % 60;
    return `${h}h ${m}m`;
  };

  return (
    <div className={styles.container}>
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}><Clock size={24} /></div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Estudado Hoje</span>
            <span className={styles.statValue}>{formatHrsMins(timeToday)}</span>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon}><Target size={24} /></div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Estudado na Semana</span>
            <span className={styles.statValue}>{formatHrsMins(timeThisWeek)}</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIconWrapper}>
            <div className={styles.statIcon}><Flame size={24} style={{ color: '#ff6b6b' }} /></div>
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Sequência Atual</span>
            <span className={styles.statValue}>{streak} {streak === 1 ? 'dia' : 'dias'} consecutivos</span>
          </div>
        </div>
      </div>

      <div className={styles.progressContainer}>
        <div className={styles.progressHeader}>
          <div className={styles.progressTitle}>
            <span>Meta desta semana</span>
            <span className={styles.progressText}>
              {formatHrsMins(timeThisWeek)} estudadas de {goalHours}h
            </span>
          </div>
          <div className={styles.progressActions}>
            <span className={styles.progressPercent}>{progressPercent}%</span>
            <button className={styles.configBtn} onClick={onOpenConfig} aria-label="Configurar Meta">
              <Settings size={18} />
            </button>
          </div>
        </div>
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${progressPercent}%` }}></div>
        </div>
      </div>
    </div>
  );
}
