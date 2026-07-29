import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Play, Pause, Square, Plus, BarChart2, Calendar, Target, Clock } from 'lucide-react';
import styles from './TrackerEstudos.module.css';

export default function TrackerEstudos() {
  const { session } = useAuth();
  const [sessions, setSessions] = useState([]);
  const [goals, setGoals] = useState(null);
  const [loading, setLoading] = useState(true);

  // Timer state
  const [timerActive, setTimerActive] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [currentSession, setCurrentSession] = useState(null);

  useEffect(() => {
    if (session?.user?.id) {
      fetchData();
    }
  }, [session]);

  useEffect(() => {
    let interval = null;
    if (timerActive) {
      interval = setInterval(() => {
        setTimerSeconds(s => s + 1);
      }, 1000);
    } else if (!timerActive && timerSeconds !== 0) {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [timerActive, timerSeconds]);

  const fetchData = async () => {
    try {
      setLoading(true);
      // Fetch goals
      const { data: goalData, error: goalError } = await supabase
        .from('study_goals')
        .select('*')
        .eq('user_id', session.user.id)
        .single();
      
      if (!goalError && goalData) {
        setGoals(goalData);
      }

      // Fetch sessions (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { data: sessionData, error: sessionError } = await supabase
        .from('study_sessions')
        .select('*')
        .eq('user_id', session.user.id)
        .gte('created_at', thirtyDaysAgo.toISOString())
        .order('created_at', { ascending: false });

      if (!sessionError && sessionData) {
        setSessions(sessionData);
      }
    } catch (err) {
      console.error('Error fetching tracker data:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (totalSeconds) => {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleStartTimer = () => {
    if (!currentSession) {
      // In a real app, open modal to select subject first
      setCurrentSession({ subject: 'Geral', type: 'Teoria' });
    }
    setTimerActive(true);
  };

  const handlePauseTimer = () => {
    setTimerActive(false);
  };

  const handleStopTimer = async () => {
    setTimerActive(false);
    
    // Save session
    if (timerSeconds > 60) {
      try {
        const newSession = {
          user_id: session.user.id,
          subject: currentSession?.subject || 'Geral',
          study_type: currentSession?.type || 'Teoria',
          duration_minutes: Math.round(timerSeconds / 60),
          session_date: new Date().toISOString().split('T')[0]
        };

        const { error } = await supabase.from('study_sessions').insert([newSession]);
        if (!error) {
          fetchData(); // Refresh data
        }
      } catch (err) {
        console.error('Failed to save session', err);
      }
    }
    
    // Reset timer
    setTimerSeconds(0);
    setCurrentSession(null);
  };

  const timeToday = sessions
    .filter(s => s.session_date === new Date().toISOString().split('T')[0])
    .reduce((acc, s) => acc + s.duration_minutes, 0);

  const timeThisWeek = sessions.reduce((acc, s) => acc + s.duration_minutes, 0); // Simplified for demo
  const goalHours = goals?.weekly_goal_hours || 10;
  const progressPercent = Math.min(100, Math.round((timeThisWeek / 60) / goalHours * 100));

  if (loading) {
    return <div className={styles.container}>Carregando dados...</div>;
  }

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1>Tracker de Estudos</h1>
        <p>Acompanhe seu progresso, registre suas sessões e bata suas metas semanais.</p>
      </header>

      {/* Resumo Section */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}><Clock size={24} /></div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Estudado Hoje</span>
            <span className={styles.statValue}>{Math.floor(timeToday / 60)}h {timeToday % 60}m</span>
          </div>
        </div>
        
        <div className={styles.statCard}>
          <div className={styles.statIcon}><BarChart2 size={24} /></div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Estudado na Semana</span>
            <span className={styles.statValue}>{Math.floor(timeThisWeek / 60)}h {timeThisWeek % 60}m</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}><Target size={24} /></div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Meta Semanal</span>
            <span className={styles.statValue}>{goalHours}h</span>
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className={styles.progressContainer}>
        <div className={styles.progressHeader}>
          <span>Progresso da Semana</span>
          <span>{progressPercent}%</span>
        </div>
        <div className={styles.progressBar}>
          <div className={styles.progressFill} style={{ width: `${progressPercent}%` }}></div>
        </div>
      </div>

      <div className={styles.mainGrid}>
        {/* Timer Section */}
        <section className={styles.timerSection}>
          <h2>Cronômetro</h2>
          <div className={styles.timerDisplay}>
            {formatTime(timerSeconds)}
          </div>
          <div className={styles.timerControls}>
            {!timerActive ? (
              <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleStartTimer}>
                <Play size={20} /> Iniciar Sessão
              </button>
            ) : (
              <button className={`${styles.btn} ${styles.btnSecondary}`} onClick={handlePauseTimer}>
                <Pause size={20} /> Pausar
              </button>
            )}
            <button 
              className={`${styles.btn} ${styles.btnDanger}`} 
              onClick={handleStopTimer}
              disabled={timerSeconds === 0 && !timerActive}
            >
              <Square size={20} /> Parar & Salvar
            </button>
          </div>
        </section>

        {/* Historico Section */}
        <section className={styles.historySection}>
          <div className={styles.historyHeader}>
            <h2>Sessões Recentes</h2>
            <button className={styles.btnText}>
              <Plus size={16} /> Registro Manual
            </button>
          </div>
          
          {sessions.length === 0 ? (
            <div className={styles.emptyState}>
              <Calendar size={32} />
              <p>Nenhuma sessão registrada recentemente.</p>
            </div>
          ) : (
            <ul className={styles.sessionList}>
              {sessions.slice(0, 5).map(session => (
                <li key={session.id} className={styles.sessionItem}>
                  <div className={styles.sessionMeta}>
                    <strong>{session.subject}</strong>
                    <span>{session.study_type}</span>
                  </div>
                  <div className={styles.sessionTime}>
                    <span>{session.duration_minutes} min</span>
                    <span className={styles.sessionDate}>{new Date(session.created_at).toLocaleDateString()}</span>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
