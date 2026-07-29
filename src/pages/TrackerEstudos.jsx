import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import styles from './TrackerEstudos.module.css';

import TrackerSummary from '../components/Tracker/TrackerSummary';
import TrackerTimer from '../components/Tracker/TrackerTimer';
import TrackerCalendar from '../components/Tracker/TrackerCalendar';
import TrackerHistory from '../components/Tracker/TrackerHistory';

import GoalConfigModal from '../components/Tracker/modals/GoalConfigModal';
import StartSessionModal from '../components/Tracker/modals/StartSessionModal';
import FinishSessionModal from '../components/Tracker/modals/FinishSessionModal';
import ManualSessionModal from '../components/Tracker/modals/ManualSessionModal';

// ─── Helpers ───────────────────────────────────────────────────────────
function getLocalISODate(date = new Date()) {
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffset).toISOString().split('T')[0];
}

function getWeekStart() {
  const d = new Date();
  const day = d.getDay(); // 0=Sun
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(d.setDate(diff));
  return getLocalISODate(monday);
}

function getToday() {
  return getLocalISODate();
}

function calcStreak(sessions) {
  if (!sessions || sessions.length === 0) return 0;
  const uniqueDays = [...new Set(sessions.map(s => s.session_date))].sort().reverse();
  let streak = 0;
  let cursorStr = getToday();

  for (const dayStr of uniqueDays) {
    // Usando meio-dia para evitar problemas de horário de verão
    const cursor = new Date(cursorStr + 'T12:00:00');
    const day = new Date(dayStr + 'T12:00:00');
    const diff = Math.round((cursor - day) / (1000 * 60 * 60 * 24));
    
    if (diff === 0 || diff === 1) {
      streak++;
      cursorStr = dayStr;
    } else if (diff > 1) {
      break;
    }
  }
  return streak;
}

// ─── Component ─────────────────────────────────────────────────────────
export default function TrackerEstudos() {
  const { session } = useAuth();

  // Data
  const [activeSession, setActiveSession] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [goalHours, setGoalHours] = useState(10);
  const [loading, setLoading] = useState(true);
  const [historyLoading, setHistoryLoading] = useState(true);

  // Stats
  const [timeToday, setTimeToday] = useState(0); // in minutes
  const [timeThisWeek, setTimeThisWeek] = useState(0); // in minutes
  const [streak, setStreak] = useState(0);

  // Modals
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [showStartModal, setShowStartModal] = useState(false);
  const [showFinishModal, setShowFinishModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [editSession, setEditSession] = useState(null);

  // Toast
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // ─── Fetch all data ───────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    if (!session?.user?.id) return;

    try {
      // 1. Fetch goal
      const { data: goalData } = await supabase
        .from('study_goals')
        .select('weekly_goal_hours')
        .eq('user_id', session.user.id)
        .single();
      if (goalData) setGoalHours(Number(goalData.weekly_goal_hours));

      // 2. Fetch active session (running or paused)
      const { data: activeSess } = await supabase
        .from('study_sessions')
        .select('*')
        .eq('user_id', session.user.id)
        .in('status', ['running', 'paused'])
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
      setActiveSession(activeSess || null);

      // 3. Fetch completed sessions for history + stats
      const { data: allSessions } = await supabase
        .from('study_sessions')
        .select('*')
        .eq('user_id', session.user.id)
        .eq('status', 'completed')
        .order('session_date', { ascending: false })
        .order('created_at', { ascending: false });

      const completed = allSessions || [];
      setSessions(completed);

      // Stats
      const today = getToday();
      const weekStart = getWeekStart();

      const todayMins = completed
        .filter(s => s.session_date === today)
        .reduce((sum, s) => sum + (s.duration_minutes || 0), 0);

      const weekMins = completed
        .filter(s => s.session_date >= weekStart)
        .reduce((sum, s) => sum + (s.duration_minutes || 0), 0);

      setTimeToday(todayMins);
      setTimeThisWeek(weekMins);
      setStreak(calcStreak(completed));
    } finally {
      setLoading(false);
      setHistoryLoading(false);
    }
  }, [session]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ─── Timer: Start ─────────────────────────────────────────────────────
  const handleStart = async ({ subject, topic, studyType, goal }) => {
    setShowStartModal(false);
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('study_sessions')
      .insert({
        user_id: session.user.id,
        subject,
        topic,
        study_type: studyType,
        goal,
        status: 'running',
        accumulated_seconds: 0,
        last_started_at: now,
        session_date: getToday(),
        duration_minutes: 0,
      })
      .select()
      .single();

    if (!error && data) {
      setActiveSession(data);
    } else {
      showToast('Erro ao iniciar sessão.', 'error');
    }
  };

  // ─── Timer: Pause ─────────────────────────────────────────────────────
  const handlePause = async () => {
    if (!activeSession) return;
    const now = new Date();
    const elapsed = activeSession.last_started_at
      ? Math.floor((now - new Date(activeSession.last_started_at)) / 1000)
      : 0;
    const newAccumulated = (activeSession.accumulated_seconds || 0) + elapsed;

    const { data, error } = await supabase
      .from('study_sessions')
      .update({ status: 'paused', accumulated_seconds: newAccumulated, last_started_at: null })
      .eq('id', activeSession.id)
      .select()
      .single();

    if (!error && data) setActiveSession(data);
  };

  // ─── Timer: Resume ────────────────────────────────────────────────────
  const handleResume = async () => {
    if (!activeSession) return;
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('study_sessions')
      .update({ status: 'running', last_started_at: now })
      .eq('id', activeSession.id)
      .select()
      .single();

    if (!error && data) setActiveSession(data);
  };

  // ─── Timer: Finish (open modal) ───────────────────────────────────────
  const handleFinishRequest = () => setShowFinishModal(true);

  const handleFinishConfirm = async (finishData) => {
    if (!activeSession) return;
    setShowFinishModal(false);

    // Calculate final duration
    let totalSeconds = activeSession.accumulated_seconds || 0;
    if (activeSession.status === 'running' && activeSession.last_started_at) {
      totalSeconds += Math.floor((Date.now() - new Date(activeSession.last_started_at)) / 1000);
    }
    const durationMinutes = Math.max(1, Math.round(totalSeconds / 60));

    const { error } = await supabase
      .from('study_sessions')
      .update({
        status: 'completed',
        duration_minutes: durationMinutes,
        goal_status: finishData.goalStatus,
        focus_level: finishData.focusLevel,
        notes: finishData.notes || null,
        questions_total: finishData.questionsTotal ?? null,
        questions_correct: finishData.questionsCorrect ?? null,
        questions_wrong: finishData.questionsWrong ?? null,
        accuracy_rate: finishData.accuracyRate ?? null,
        end_time: new Date().toISOString(),
        last_started_at: null,
      })
      .eq('id', activeSession.id);

    if (!error) {
      setActiveSession(null);
      showToast('Sessão finalizada e salva!');
      fetchData();
    } else {
      showToast('Erro ao finalizar sessão.', 'error');
    }
  };

  // ─── Timer: Cancel ────────────────────────────────────────────────────
  const handleCancelRequest = async () => {
    if (!activeSession) return;
    if (!window.confirm('Tem certeza que deseja cancelar a sessão? O progresso não será salvo.')) return;

    const { error } = await supabase
      .from('study_sessions')
      .delete()
      .eq('id', activeSession.id);

    if (!error) {
      setActiveSession(null);
      showToast('Sessão cancelada.', 'info');
    }
  };

  // ─── Manual session ───────────────────────────────────────────────────
  const handleManualSave = async (data) => {
    setShowManualModal(false);
    setEditSession(null);

    const payload = {
      user_id: session.user.id,
      subject: data.subject,
      topic: data.topic || null,
      study_type: data.studyType,
      goal: data.goal || null,
      session_date: data.date,
      duration_minutes: data.durationMinutes,
      goal_status: data.goalStatus || null,
      focus_level: data.focusLevel || null,
      notes: data.notes || null,
      questions_total: data.questionsTotal ?? null,
      questions_correct: data.questionsCorrect ?? null,
      questions_wrong: data.questionsWrong ?? null,
      accuracy_rate: data.accuracyRate ?? null,
      is_manual: true,
      status: 'completed',
    };

    let error;
    if (data.id) {
      ({ error } = await supabase.from('study_sessions').update(payload).eq('id', data.id));
    } else {
      ({ error } = await supabase.from('study_sessions').insert(payload));
    }

    if (!error) {
      showToast(data.id ? 'Sessão atualizada!' : 'Sessão registrada!');
      fetchData();
    } else {
      showToast('Erro ao salvar sessão.', 'error');
    }
  };

  // ─── Edit ─────────────────────────────────────────────────────────────
  const handleEdit = (sess) => {
    setEditSession(sess);
    setShowManualModal(true);
  };

  // ─── Delete ───────────────────────────────────────────────────────────
  const handleDelete = async (sess) => {
    if (!window.confirm(`Excluir a sessão de "${sess.subject}"? Esta ação não pode ser desfeita.`)) return;
    const { error } = await supabase.from('study_sessions').delete().eq('id', sess.id);
    if (!error) {
      showToast('Sessão excluída.');
      fetchData();
    } else {
      showToast('Erro ao excluir.', 'error');
    }
  };

  // ─── Repeat ───────────────────────────────────────────────────────────
  const handleRepeat = (sess) => {
    // Pre-fill start modal with session data — we open start modal with preset values
    // We'll open ManualModal with only the metadata pre-filled, without date/duration
    setEditSession({ 
      subject: sess.subject, 
      topic: sess.topic, 
      study_type: sess.study_type, 
      goal: sess.goal,
      id: null // force as new session
    });
    setShowManualModal(true);
  };

  // ─── Render ───────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className={styles.page}>
        <div className={styles.loadingState}>
          <div className={styles.spinner}></div>
          <p>Carregando Tracker...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.page}>
      {/* Toast */}
      {toast && (
        <div className={`${styles.toast} ${styles[`toast_${toast.type}`]}`}>
          {toast.msg}
        </div>
      )}

      <div className={styles.header}>
        <h1>Tracker de Estudos</h1>
        <p>Registre e acompanhe cada sessão de estudo.</p>
      </div>

      {/* Summary */}
      <TrackerSummary
        timeToday={timeToday}
        timeThisWeek={timeThisWeek}
        goalHours={goalHours}
        streak={streak}
        onOpenConfig={() => setShowGoalModal(true)}
      />

      {/* Timer */}
      <TrackerTimer
        activeSession={activeSession}
        onStartRequest={() => setShowStartModal(true)}
        onManualRequest={() => { setEditSession(null); setShowManualModal(true); }}
        onPause={handlePause}
        onResume={handleResume}
        onFinishRequest={handleFinishRequest}
        onCancelRequest={handleCancelRequest}
      />

      {/* Calendar */}
      <TrackerCalendar 
        sessions={sessions}
        selectedDate={selectedDate}
        onSelectDate={setSelectedDate}
      />

      {/* History */}
      <TrackerHistory
        sessions={sessions}
        selectedDate={selectedDate}
        onClearDate={() => setSelectedDate(null)}
        loading={historyLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onRepeat={handleRepeat}
      />

      {/* Modals */}
      <GoalConfigModal
        isOpen={showGoalModal}
        onClose={() => setShowGoalModal(false)}
        currentGoal={goalHours}
        onGoalUpdated={(h) => { setGoalHours(h); showToast('Meta atualizada!'); }}
        session={session}
      />

      <StartSessionModal
        isOpen={showStartModal}
        onClose={() => setShowStartModal(false)}
        onStart={handleStart}
      />

      <FinishSessionModal
        isOpen={showFinishModal}
        onClose={() => setShowFinishModal(false)}
        onFinish={handleFinishConfirm}
        sessionData={activeSession ? {
          goal: activeSession.goal,
          studyType: activeSession.study_type
        } : null}
      />

      <ManualSessionModal
        isOpen={showManualModal}
        onClose={() => { setShowManualModal(false); setEditSession(null); }}
        onSave={handleManualSave}
        initialData={editSession}
      />
    </div>
  );
}
