import { useState, useEffect, useRef } from 'react';
import { Play, Pause, StopCircle, XCircle, Clock, BookOpen, Tag, Target } from 'lucide-react';
import styles from './TrackerTimer.module.css';

// Calcula segundos totais com base nos dados de sessão ativa do banco
function calcActiveSeconds(session) {
  if (!session) return 0;
  let accumulated = session.accumulated_seconds || 0;
  if (session.status === 'running' && session.last_started_at) {
    const diff = Math.floor((Date.now() - new Date(session.last_started_at).getTime()) / 1000);
    accumulated += diff;
  }
  return accumulated;
}

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600).toString().padStart(2, '0');
  const m = Math.floor((seconds % 3600) / 60).toString().padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${h}:${m}:${s}`;
}

export default function TrackerTimer({
  activeSession,
  onStartRequest,
  onManualRequest,
  onPause,
  onResume,
  onFinishRequest,
  onCancelRequest,
}) {
  const [displaySeconds, setDisplaySeconds] = useState(() => calcActiveSeconds(activeSession));
  const timerRef = useRef(null);

  useEffect(() => {
    setDisplaySeconds(calcActiveSeconds(activeSession));

    if (activeSession?.status === 'running') {
      timerRef.current = setInterval(() => {
        setDisplaySeconds(calcActiveSeconds(activeSession));
      }, 1000);
    }

    return () => clearInterval(timerRef.current);
  }, [activeSession]);

  // Sem sessão ativa
  if (!activeSession) {
    return (
      <div className={styles.card}>
        <div className={styles.timerIdle}>
          <Clock size={48} className={styles.idleIcon} />
          <div className={styles.timerDisplay}>00:00:00</div>
          <p className={styles.idleText}>Pronta para estudar? Inicie uma sessão.</p>
        </div>
        <div className={styles.idleActions}>
          <button className={styles.btnPrimary} onClick={onStartRequest}>
            <Play size={20} />
            Iniciar sessão
          </button>
          <button className={styles.btnSecondary} onClick={onManualRequest}>
            <BookOpen size={18} />
            Registrar estudo manualmente
          </button>
        </div>
      </div>
    );
  }

  // Com sessão ativa
  const isRunning = activeSession.status === 'running';
  const isPaused = activeSession.status === 'paused';

  return (
    <div className={styles.card}>
      {/* Info da sessão */}
      <div className={styles.sessionInfo}>
        <div className={styles.sessionTag}>{activeSession.study_type}</div>
        <div className={styles.sessionDetails}>
          <span className={styles.sessionSubject}><BookOpen size={14} /> {activeSession.subject}</span>
          {activeSession.topic && <span className={styles.sessionMeta}><Tag size={14} /> {activeSession.topic}</span>}
          {activeSession.goal && <span className={styles.sessionMeta}><Target size={14} /> {activeSession.goal}</span>}
        </div>
      </div>

      {/* Timer */}
      <div className={`${styles.timerDisplay} ${isPaused ? styles.timerPaused : ''}`}>
        {formatTime(displaySeconds)}
      </div>

      {isPaused && <p className={styles.pausedLabel}>⏸ Sessão pausada</p>}

      {/* Controles */}
      <div className={styles.controls}>
        {isRunning && (
          <button className={styles.btnControl} onClick={onPause}>
            <Pause size={18} /> Pausar
          </button>
        )}
        {isPaused && (
          <button className={styles.btnControl} onClick={onResume}>
            <Play size={18} /> Continuar
          </button>
        )}
        <button className={styles.btnFinish} onClick={onFinishRequest}>
          <StopCircle size={18} /> Finalizar sessão
        </button>
        <button className={styles.btnCancel} onClick={onCancelRequest}>
          <XCircle size={18} /> Cancelar
        </button>
      </div>
    </div>
  );
}
