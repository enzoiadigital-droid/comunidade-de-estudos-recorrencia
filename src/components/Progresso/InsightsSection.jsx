import styles from './InsightsSection.module.css';

function formatTime(mins) {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

export default function InsightsSection({ sessions, prevSessions, streak }) {
  const insights = [];

  if (sessions.length < 2) {
    return (
      <div className={styles.empty}>
        <span>💡</span>
        <p>Continue estudando para gerar insights automáticos sobre sua evolução!</p>
      </div>
    );
  }

  const totalMins = sessions.reduce((s, x) => s + (x.duration_minutes || 0), 0);
  const prevMins = prevSessions.reduce((s, x) => s + (x.duration_minutes || 0), 0);

  // Insight 1: trend vs previous
  if (prevMins > 0) {
    const diff = totalMins - prevMins;
    const pct = Math.abs(Math.round((diff / prevMins) * 100));
    if (diff > 0) {
      insights.push({ icon: '📈', color: 'green', text: `Seu tempo de estudo aumentou ${pct}% em relação ao período anterior. Continue assim!` });
    } else if (diff < 0) {
      insights.push({ icon: '📉', color: 'orange', text: `Seu tempo de estudo caiu ${pct}% em relação ao período anterior. Hora de retomar o ritmo!` });
    }
  }

  // Insight 2: most studied subject
  const subjectMap = {};
  sessions.forEach(s => { if (s.subject) subjectMap[s.subject] = (subjectMap[s.subject] || 0) + (s.duration_minutes || 0); });
  const subjects = Object.entries(subjectMap).sort((a, b) => b[1] - a[1]);
  if (subjects.length > 0) {
    insights.push({ icon: '📚', color: 'gold', text: `Matéria mais estudada no período: ${subjects[0][0]} (${formatTime(subjects[0][1])}).` });
  }
  if (subjects.length > 1) {
    insights.push({ icon: '⚠️', color: 'warning', text: `Menor dedicação no período: ${subjects[subjects.length - 1][0]} (${formatTime(subjects[subjects.length - 1][1])}). Vale a pena equilibrar?` });
  }

  // Insight 3: questions accuracy
  const qSessions = sessions.filter(s => (s.study_type === 'Questões' || s.study_type === 'Simulado') && s.questions_total);
  if (qSessions.length > 0) {
    const total = qSessions.reduce((s, x) => s + (x.questions_total || 0), 0);
    const correct = qSessions.reduce((s, x) => s + (x.questions_correct || 0), 0);
    const rate = total > 0 ? Math.round((correct / total) * 100) : 0;
    const color = rate >= 70 ? 'green' : rate >= 50 ? 'gold' : 'red';
    const msg = rate >= 70 ? 'Excelente desempenho!' : rate >= 50 ? 'Você está progredindo.' : 'Revise os conteúdos com mais erros.';
    insights.push({ icon: '🎯', color, text: `Taxa de acerto em questões/simulados: ${rate}%. ${msg}` });
  }

  // Insight 4: streak
  if (streak >= 3) {
    insights.push({ icon: '🔥', color: 'orange', text: `Você está em uma sequência de ${streak} dias consecutivos de estudo. Incrível!` });
  } else if (streak === 0) {
    insights.push({ icon: '📅', color: 'warning', text: `Nenhuma sequência ativa. Estude hoje para começar uma nova série!` });
  }

  // Insight 5: best day of week
  const dayMap = { 0:0, 1:0, 2:0, 3:0, 4:0, 5:0, 6:0 };
  sessions.forEach(s => {
    const d = new Date(s.session_date + 'T12:00:00').getDay();
    dayMap[d] = (dayMap[d] || 0) + (s.duration_minutes || 0);
  });
  const dayNames = ['Domingo','Segunda','Terça','Quarta','Quinta','Sexta','Sábado'];
  const bestDay = Object.entries(dayMap).sort((a, b) => b[1] - a[1])[0];
  if (bestDay && bestDay[1] > 0) {
    insights.push({ icon: '⭐', color: 'gold', text: `Seu dia mais produtivo é ${dayNames[bestDay[0]]} com ${formatTime(bestDay[1])} no total.` });
  }

  if (insights.length === 0) {
    return (
      <div className={styles.empty}>
        <span>💡</span>
        <p>Não há insights suficientes para o período selecionado. Registre mais sessões!</p>
      </div>
    );
  }

  return (
    <div className={styles.list}>
      {insights.map((ins, i) => (
        <div key={i} className={`${styles.card} ${styles[ins.color]}`}>
          <span className={styles.insightIcon}>{ins.icon}</span>
          <p className={styles.insightText}>{ins.text}</p>
        </div>
      ))}
    </div>
  );
}
