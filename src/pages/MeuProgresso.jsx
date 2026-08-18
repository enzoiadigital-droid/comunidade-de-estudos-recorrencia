import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import styles from './MeuProgresso.module.css';

import FilterBar from '../components/Progresso/FilterBar';
import SummaryCards from '../components/Progresso/SummaryCards';
import StudyChart from '../components/Progresso/StudyChart';
import SubjectChart from '../components/Progresso/SubjectChart';
import QuestionsSection from '../components/Progresso/QuestionsSection';
import FlashcardsSection from '../components/Progresso/FlashcardsSection';
import ConsistencyHeatmap from '../components/Progresso/ConsistencyHeatmap';
import WeeklyGoalsSection from '../components/Progresso/WeeklyGoalsSection';
import InsightsSection from '../components/Progresso/InsightsSection';
import SkeletonCard from '../components/Progresso/SkeletonCard';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function getLocalISODate(date = new Date()) {
  const tzOffset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - tzOffset).toISOString().split('T')[0];
}

function addDays(dateStr, n) {
  const d = new Date(dateStr + 'T12:00:00');
  d.setDate(d.getDate() + n);
  return getLocalISODate(d);
}

function calcStreak(sessions) {
  if (!sessions || sessions.length === 0) return 0;
  const uniqueDays = [...new Set(sessions.map(s => s.session_date))].sort().reverse();
  let streak = 0;
  let cursorStr = getLocalISODate();
  for (const dayStr of uniqueDays) {
    const cursor = new Date(cursorStr + 'T12:00:00');
    const day = new Date(dayStr + 'T12:00:00');
    const diff = Math.round((cursor - day) / (1000 * 60 * 60 * 24));
    if (diff === 0 || diff === 1) { streak++; cursorStr = dayStr; }
    else if (diff > 1) break;
  }
  return streak;
}

function getPeriodDates(period, customStart, customEnd) {
  const today = getLocalISODate();
  if (period === 'custom') {
    return { start: customStart || addDays(today, -30), end: customEnd || today };
  }
  return { start: addDays(today, -(period - 1)), end: today };
}

// ─── Section wrapper ─────────────────────────────────────────────────────────
function Section({ title, children, loading }) {
  return (
    <section className={styles.section}>
      <h2 className={styles.sectionTitle}>{title}</h2>
      <div className={`glass-panel ${styles.sectionBody}`}>
        {loading ? <SkeletonCard height="180px" /> : children}
      </div>
    </section>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function MeuProgresso() {
  const { session } = useAuth();
  const userId = session?.user?.id;

  const [loading, setLoading] = useState(true);
  const [allSessions, setAllSessions] = useState([]);
  const [allReviews, setAllReviews] = useState([]);
  const [allDecks, setAllDecks] = useState([]);
  const [goalHours, setGoalHours] = useState(10);

  // Filters
  const today = getLocalISODate();
  const [period, setPeriod] = useState(30);
  const [customStart, setCustomStart] = useState(addDays(today, -30));
  const [customEnd, setCustomEnd] = useState(today);
  const [subject, setSubject] = useState('');

  // ─── Fetch all raw data once ──────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      const [{ data: sessionsData }, { data: reviewsData }, { data: decksData }, { data: goalData }] = await Promise.all([
        supabase
          .from('study_sessions')
          .select('*')
          .eq('user_id', userId)
          .eq('status', 'completed')
          .order('session_date', { ascending: true }),
        supabase
          .from('flashcard_reviews')
          .select('*')
          .eq('user_id', userId),
        supabase
          .from('flashcard_decks')
          .select('id, name, subject, is_official')
          .eq('user_id', userId)
          .eq('is_official', false),
        supabase
          .from('study_goals')
          .select('weekly_goal_hours')
          .eq('user_id', userId)
          .single(),
      ]);
      setAllSessions(sessionsData || []);
      setAllReviews(reviewsData || []);
      setAllDecks(decksData || []);
      if (goalData) setGoalHours(Number(goalData.weekly_goal_hours) || 10);
    } catch (e) {
      console.error('Progresso fetch error', e);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // ─── Derived filtered data ────────────────────────────────────────────────
  const { start, end } = getPeriodDates(period, customStart, customEnd);

  const filteredSessions = allSessions.filter(s => {
    const inPeriod = s.session_date >= start && s.session_date <= end;
    const inSubject = !subject || s.subject === subject;
    return inPeriod && inSubject;
  });

  // Previous period (same span, shifted back)
  const days = Math.ceil((new Date(end + 'T12:00:00') - new Date(start + 'T12:00:00')) / 86400000) + 1;
  const prevEnd = addDays(start, -1);
  const prevStart = addDays(prevEnd, -(days - 1));
  const prevSessions = allSessions.filter(s => s.session_date >= prevStart && s.session_date <= prevEnd);

  // All subjects from raw data (for filter dropdown)
  const subjects = [...new Set(allSessions.map(s => s.subject).filter(Boolean))].sort();

  const streak = calcStreak(allSessions);

  return (
    <div className={styles.page}>
      {/* Page header */}
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Meu Progresso</h1>
          <p className={styles.subtitle}>Análise completa da sua evolução de estudos</p>
        </div>
      </header>

      {/* Filters */}
      <FilterBar
        period={period} setPeriod={setPeriod}
        customStart={customStart} setCustomStart={setCustomStart}
        customEnd={customEnd} setCustomEnd={setCustomEnd}
        subject={subject} setSubject={setSubject}
        subjects={subjects}
      />

      {/* Summary Cards */}
      {loading ? (
        <div className={styles.skeletonGrid}>
          {[1,2,3,4].map(i => <SkeletonCard key={i} height="130px" />)}
        </div>
      ) : (
        <SummaryCards
          sessions={filteredSessions}
          prevSessions={prevSessions}
          streak={streak}
          goalHours={goalHours}
        />
      )}

      {/* Main charts row */}
      <div className={styles.chartsRow}>
        <Section title="📈 Evolução dos Estudos" loading={loading}>
          <StudyChart sessions={filteredSessions} startDate={start} endDate={end} />
        </Section>
        <Section title="📚 Tempo por Matéria" loading={loading}>
          <SubjectChart sessions={filteredSessions} />
        </Section>
      </div>

      {/* Heatmap */}
      <Section title="🗓 Calendário de Consistência" loading={loading}>
        <ConsistencyHeatmap sessions={allSessions} />
      </Section>

      {/* Questions + Flashcards row */}
      <div className={styles.chartsRow}>
        <Section title="📝 Desempenho em Questões" loading={loading}>
          <QuestionsSection sessions={filteredSessions} />
        </Section>
        <Section title="🃏 Progresso nos Flashcards" loading={loading}>
          <FlashcardsSection sessions={filteredSessions} reviews={allReviews} decks={allDecks} />
        </Section>
      </div>

      {/* Weekly goals */}
      <Section title="🎯 Histórico de Metas Semanais" loading={loading}>
        <WeeklyGoalsSection sessions={allSessions} goalHours={goalHours} />
      </Section>

      {/* Insights */}
      <Section title="💡 Insights Automáticos" loading={loading}>
        <InsightsSection
          sessions={filteredSessions}
          prevSessions={prevSessions}
          streak={streak}
        />
      </Section>
    </div>
  );
}
