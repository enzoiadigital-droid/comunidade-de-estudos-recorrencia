import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { X, Trophy, BrainCircuit } from 'lucide-react';
import styles from './StudySession.module.css';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

export default function StudySession() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { session } = useAuth();

  const [deck, setDeck] = useState(null);
  const [cards, setCards] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [sessionStats, setSessionStats] = useState({ reviewed: 0, correct: 0 });
  const [loading, setLoading] = useState(true);
  const [finished, setFinished] = useState(false);

  const sessionStartTime = useRef(Date.now());
  const userId = session?.user?.id;

  useEffect(() => {
    fetchSessionData();
  }, [id]);

  const fetchSessionData = async () => {
    try {
      setLoading(true);
      const { data: deckData, error: deckError } = await supabase
        .from('flashcard_decks')
        .select('*')
        .eq('id', id)
        .single();
      if (deckError) throw deckError;
      setDeck(deckData);

      const { data: cardsData, error: cardsError } = await supabase
        .from('flashcards')
        .select('*')
        .eq('deck_id', id);
      if (cardsError) throw cardsError;

      let reviewsData = [];
      if (userId) {
        const { data } = await supabase
          .from('flashcard_reviews')
          .select('*')
          .eq('deck_id', id)
          .eq('user_id', userId);
        reviewsData = data || [];
      }

      const now = new Date();
      let dueCards = [];
      for (const card of (cardsData || [])) {
        const review = reviewsData.find(r => r.card_id === card.id);
        if (!review) {
          dueCards.push({ ...card, review: null });
        } else {
          const nextDate = new Date(review.next_review_date);
          if (nextDate <= now) {
            dueCards.push({ ...card, review });
          }
        }
      }

      // Shuffle
      dueCards = dueCards.sort(() => Math.random() - 0.5);
      setCards(dueCards);
    } catch (error) {
      console.error('Error fetching session:', error);
      navigate('/flashcards');
    } finally {
      setLoading(false);
    }
  };

  const handleRate = async (rating) => {
    const card = cards[currentIndex];
    const review = card.review;

    let interval = review ? review.interval : 0;
    let easeFactor = review ? review.ease_factor : 2.5;

    if (rating === 1) {
      interval = 0;
      easeFactor = Math.max(1.3, easeFactor - 0.2);
    } else if (rating === 2) {
      interval = interval === 0 ? 1 : interval * 1.2;
      easeFactor = Math.max(1.3, easeFactor - 0.15);
    } else if (rating === 3) {
      interval = interval === 0 ? 3 : interval * easeFactor;
    } else if (rating === 4) {
      interval = interval === 0 ? 5 : interval * easeFactor * 1.3;
      easeFactor += 0.15;
    }

    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + Math.max(1, Math.round(interval)));

    if (userId) {
      if (review) {
        supabase.from('flashcard_reviews').update({
          interval, ease_factor: easeFactor,
          next_review_date: nextDate.toISOString(),
          last_reviewed_at: new Date().toISOString(),
          status: rating === 1 ? 'learning' : 'review'
        }).eq('id', review.id).then();
      } else {
        supabase.from('flashcard_reviews').insert([{
          user_id: userId, card_id: card.id, deck_id: deck.id,
          interval, ease_factor: easeFactor,
          next_review_date: nextDate.toISOString(),
          last_reviewed_at: new Date().toISOString(),
          status: rating === 1 ? 'learning' : 'review'
        }]).then();
      }
    }

    const newStats = {
      reviewed: sessionStats.reviewed + 1,
      correct: rating >= 3 ? sessionStats.correct + 1 : sessionStats.correct
    };
    setSessionStats(newStats);

    if (currentIndex < cards.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setShowAnswer(false);
    } else {
      finishSession(newStats);
    }
  };

  const finishSession = async (stats = sessionStats) => {
    setFinished(true);
    if (!userId || !deck) return;
    const durationSeconds = Math.floor((Date.now() - sessionStartTime.current) / 1000);
    const durationMinutes = Math.max(1, Math.round(durationSeconds / 60));
    try {
      await supabase.from('study_sessions').insert([{
        user_id: userId,
        subject: deck.subject,
        topic: deck.name,
        study_type: 'Flashcards',
        status: 'completed',
        duration_minutes: durationMinutes,
        session_date: new Date().toISOString().split('T')[0],
        end_time: new Date().toISOString(),
        accuracy_rate: stats.reviewed > 0 ? Math.round((stats.correct / stats.reviewed) * 100) : null
      }]);
    } catch (e) {
      console.error('Failed to log to tracker', e);
    }
  };

  const handleExit = () => {
    if (window.confirm('Deseja sair? O progresso até agora foi salvo.')) {
      finishSession();
      navigate('/flashcards');
    }
  };

  if (loading) return <div className={styles.container}><p style={{ color: 'var(--color-text-muted)' }}>Carregando...</p></div>;

  if (finished || cards.length === 0) {
    return (
      <div className={styles.container} style={{ justifyContent: 'center' }}>
        <div className={styles.summaryCard}>
          <Trophy size={64} className={styles.summaryIcon} />
          <h2 className={styles.summaryTitle}>Sessão Finalizada!</h2>
          {cards.length === 0 ? (
            <p style={{ color: 'var(--color-text-muted)' }}>Nenhum card pendente para revisão hoje neste deck.</p>
          ) : (
            <div className={styles.summaryStats}>
              <div className={styles.statItem}>
                <span className={styles.statValue}>{sessionStats.reviewed}</span>
                <span className={styles.statLabel}>Revisados</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statValue}>{Math.round((Date.now() - sessionStartTime.current) / 60000)}m</span>
                <span className={styles.statLabel}>Tempo</span>
              </div>
              <div className={styles.statItem}>
                <span className={styles.statValue}>
                  {sessionStats.reviewed > 0 ? Math.round((sessionStats.correct / sessionStats.reviewed) * 100) : 0}%
                </span>
                <span className={styles.statLabel}>Acerto</span>
              </div>
            </div>
          )}
          <button className={styles.showAnswerBtn} onClick={() => navigate('/flashcards')}>
            Voltar para Flashcards
          </button>
        </div>
      </div>
    );
  }

  const currentCard = cards[currentIndex];
  const progress = (currentIndex / cards.length) * 100;

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <BrainCircuit size={24} style={{ color: 'var(--color-gold)' }} />
          <h1 className={styles.title}>{deck.name}</h1>
        </div>

        <div className={styles.progressContainer}>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${progress}%` }}></div>
          </div>
          <span className={styles.progressText}>{currentIndex + 1} de {cards.length} cards</span>
        </div>

        <button className={styles.exitButton} onClick={handleExit}>
          <X size={18} /> Sair
        </button>
      </header>

      <div className={styles.cardArea}>
        <div className={styles.flashcard}>
          <div className={styles.cardContent}>
            <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
              {currentCard.front}
            </ReactMarkdown>
          </div>

          {showAnswer && (
            <>
              <div className={styles.divider}></div>
              <div className={styles.cardContent}>
                <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                  {currentCard.back}
                </ReactMarkdown>
              </div>
            </>
          )}
        </div>

        {!showAnswer ? (
          <button className={styles.showAnswerBtn} onClick={() => setShowAnswer(true)}>
            Mostrar Resposta
          </button>
        ) : (
          <div className={styles.ratingButtons}>
            <button className={`${styles.rateBtn} ${styles.rate1}`} onClick={() => handleRate(1)}>
              Não Lembrei<span>&lt; 1 dia</span>
            </button>
            <button className={`${styles.rateBtn} ${styles.rate2}`} onClick={() => handleRate(2)}>
              Difícil<span>~ 1 dia</span>
            </button>
            <button className={`${styles.rateBtn} ${styles.rate3}`} onClick={() => handleRate(3)}>
              Acertei<span>Bom</span>
            </button>
            <button className={`${styles.rateBtn} ${styles.rate4}`} onClick={() => handleRate(4)}>
              Fácil<span>Longo</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
