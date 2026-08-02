import styles from './QuestionsSection.module.css';

export default function QuestionsSection({ sessions }) {
  const qSessions = sessions.filter(
    s => (s.study_type === 'Questões' || s.study_type === 'Simulado') && s.questions_total
  );

  if (qSessions.length === 0) {
    return (
      <div className={styles.empty}>
        <span className={styles.emptyIcon}>📝</span>
        <p>Nenhuma sessão de questões ou simulado registrada no período.</p>
        <small>Registre sessões com tipo "Questões" ou "Simulado" e preencha os resultados para ver análises aqui.</small>
      </div>
    );
  }

  const total = qSessions.reduce((s, x) => s + (x.questions_total || 0), 0);
  const correct = qSessions.reduce((s, x) => s + (x.questions_correct || 0), 0);
  const wrong = total - correct;
  const rate = total > 0 ? Math.round((correct / total) * 100) : 0;

  // By subject
  const bySubject = {};
  qSessions.forEach(s => {
    if (!s.subject) return;
    if (!bySubject[s.subject]) bySubject[s.subject] = { total: 0, correct: 0 };
    bySubject[s.subject].total += s.questions_total || 0;
    bySubject[s.subject].correct += s.questions_correct || 0;
  });

  const subjectItems = Object.entries(bySubject)
    .map(([subject, d]) => ({
      subject,
      rate: d.total > 0 ? Math.round((d.correct / d.total) * 100) : 0,
      total: d.total,
      correct: d.correct,
    }))
    .sort((a, b) => b.rate - a.rate);

  return (
    <div className={styles.wrapper}>
      <div className={styles.statRow}>
        <div className={styles.statBox}>
          <span className={styles.statValue}>{total}</span>
          <span className={styles.statLabel}>Questões resolvidas</span>
        </div>
        <div className={styles.statBox}>
          <span className={styles.statValue} style={{ color: 'var(--color-success)' }}>{correct}</span>
          <span className={styles.statLabel}>Acertos</span>
        </div>
        <div className={styles.statBox}>
          <span className={styles.statValue} style={{ color: 'var(--color-error)' }}>{wrong}</span>
          <span className={styles.statLabel}>Erros</span>
        </div>
        <div className={styles.statBox}>
          <span className={styles.statValue} style={{ color: rate >= 70 ? 'var(--color-success)' : rate >= 50 ? 'var(--color-gold)' : 'var(--color-error)' }}>
            {rate}%
          </span>
          <span className={styles.statLabel}>Taxa de acerto</span>
        </div>
      </div>

      {subjectItems.length > 1 && (
        <div className={styles.bySubject}>
          <h4 className={styles.subtitle}>Desempenho por matéria</h4>
          {subjectItems.map(item => (
            <div key={item.subject} className={styles.subRow}>
              <div className={styles.subMeta}>
                <span className={styles.subName}>{item.subject}</span>
                <span className={styles.subRate} style={{ color: item.rate >= 70 ? 'var(--color-success)' : item.rate >= 50 ? 'var(--color-gold)' : 'var(--color-error)' }}>
                  {item.rate}% ({item.correct}/{item.total})
                </span>
              </div>
              <div className={styles.subTrack}>
                <div
                  className={styles.subFill}
                  style={{
                    width: `${item.rate}%`,
                    background: item.rate >= 70 ? 'var(--color-success)' : item.rate >= 50 ? 'var(--color-gold)' : 'var(--color-error)'
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
