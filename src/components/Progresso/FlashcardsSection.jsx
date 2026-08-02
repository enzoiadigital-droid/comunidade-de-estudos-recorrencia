import styles from './FlashcardsSection.module.css';

export default function FlashcardsSection({ sessions, reviews, decks }) {
  // Flashcard sessions from tracker
  const fcSessions = sessions.filter(s => s.study_type === 'Flashcards');

  // From flashcard_reviews
  const totalReviews = reviews.length;
  const newCards = reviews.filter(r => {
    const created = new Date(r.last_reviewed_at);
    // heuristic: interval == 0 or 1 means new/learning
    return r.interval <= 1;
  }).length;

  const reviewedDays = new Set(
    reviews.map(r => r.last_reviewed_at ? r.last_reviewed_at.split('T')[0] : null).filter(Boolean)
  ).size;

  // Accuracy from flashcard sessions
  const fcWithRate = fcSessions.filter(s => s.accuracy_rate !== null);
  const avgAccuracy = fcWithRate.length > 0
    ? Math.round(fcWithRate.reduce((s, x) => s + Number(x.accuracy_rate), 0) / fcWithRate.length)
    : null;

  // Deck most studied
  const deckCount = {};
  reviews.forEach(r => {
    if (r.deck_id) deckCount[r.deck_id] = (deckCount[r.deck_id] || 0) + 1;
  });
  const topDeckId = Object.entries(deckCount).sort((a, b) => b[1] - a[1])[0]?.[0];
  const topDeck = decks.find(d => d.id === topDeckId);

  // Distribution: use status as proxy
  const learning = reviews.filter(r => r.status === 'learning').length;
  const review = reviews.filter(r => r.status === 'review').length;
  const hardCount = reviews.filter(r => r.status === 'review' && r.interval <= 3).length;
  const easyCount = reviews.filter(r => r.status === 'review' && r.interval > 7).length;
  const okCount = review - hardCount - easyCount;

  if (totalReviews === 0 && fcSessions.length === 0) {
    return (
      <div className={styles.empty}>
        <span>🃏</span>
        <p>Nenhuma sessão de Flashcards registrada no período.</p>
        <small>Estude alguns decks para ver seu progresso aqui.</small>
      </div>
    );
  }

  const distItems = [
    { label: 'Aprendendo', count: learning, color: '#EF4444' },
    { label: 'Difícil', count: hardCount, color: '#F97316' },
    { label: 'Acertei', count: okCount, color: '#3B82F6' },
    { label: 'Fácil', count: easyCount, color: '#10B981' },
  ];
  const distTotal = distItems.reduce((s, x) => s + x.count, 0);

  return (
    <div className={styles.wrapper}>
      <div className={styles.statRow}>
        <div className={styles.statBox}>
          <span className={styles.statValue}>{totalReviews}</span>
          <span className={styles.statLabel}>Total revisados</span>
        </div>
        <div className={styles.statBox}>
          <span className={styles.statValue}>{newCards}</span>
          <span className={styles.statLabel}>Cards novos / aprendendo</span>
        </div>
        <div className={styles.statBox}>
          <span className={styles.statValue} style={{ color: avgAccuracy !== null ? (avgAccuracy >= 70 ? 'var(--color-success)' : 'var(--color-gold)') : 'var(--color-text-muted)' }}>
            {avgAccuracy !== null ? `${avgAccuracy}%` : '—'}
          </span>
          <span className={styles.statLabel}>Taxa de acerto (sessões)</span>
        </div>
        <div className={styles.statBox}>
          <span className={styles.statValue}>{reviewedDays}</span>
          <span className={styles.statLabel}>Dias de revisão</span>
        </div>
      </div>

      {topDeck && (
        <div className={styles.topDeck}>
          <span className={styles.topDeckLabel}>🏆 Deck mais estudado</span>
          <span className={styles.topDeckName}>{topDeck.name}</span>
          <span className={styles.topDeckCount}>{deckCount[topDeckId]} revisões</span>
        </div>
      )}

      {distTotal > 0 && (
        <div className={styles.dist}>
          <h4 className={styles.distTitle}>Distribuição de cards por status</h4>
          <div className={styles.distBar}>
            {distItems.map(item => (
              item.count > 0 && (
                <div
                  key={item.label}
                  className={styles.distSegment}
                  style={{ flex: item.count, background: item.color }}
                  title={`${item.label}: ${item.count}`}
                />
              )
            ))}
          </div>
          <div className={styles.distLegend}>
            {distItems.map(item => (
              item.count > 0 && (
                <div key={item.label} className={styles.legendItem}>
                  <span className={styles.legendDot} style={{ background: item.color }} />
                  <span>{item.label} ({distTotal > 0 ? Math.round((item.count / distTotal) * 100) : 0}%)</span>
                </div>
              )
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
