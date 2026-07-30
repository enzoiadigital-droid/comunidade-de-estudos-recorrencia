import React, { useState, useEffect } from 'react';
import { Plus, Layers, Library, BrainCircuit, BookOpen, Clock, Zap, ArrowRight, CheckCircle } from 'lucide-react';
import styles from './Flashcards.module.css';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import CreateDeckModal from '../components/Flashcards/CreateDeckModal';
import DeckPreviewModal from '../components/Flashcards/DeckPreviewModal';

export default function Flashcards() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('meus_decks');
  const [myDecks, setMyDecks] = useState([]);
  const [officialDecks, setOfficialDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [previewDeck, setPreviewDeck] = useState(null);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  const userId = session?.user?.id;

  useEffect(() => {
    fetchDecks();
  }, [userId]);

  const fetchDecks = async () => {
    try {
      setLoading(true);

      // 1. Fetch user decks
      let myDecksData = [];
      if (userId) {
        const { data: myData } = await supabase
          .from('flashcard_decks')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
        if (myData) myDecksData = myData;
      }

      // 2. Fetch official decks
      const { data: offData } = await supabase
        .from('flashcard_decks')
        .select('*')
        .eq('is_official', true)
        .eq('is_published', true)
        .order('display_order', { ascending: true });
      let officialDecksData = offData || [];

      // 3. Fetch all flashcards to count them (optimised by selecting only needed columns)
      const { data: allCards } = await supabase
        .from('flashcards')
        .select('id, deck_id');

      // 4. Fetch reviews to calculate pendentes
      let allReviews = [];
      if (userId) {
        const { data: reviews } = await supabase
          .from('flashcard_reviews')
          .select('card_id, deck_id, next_review_date')
          .eq('user_id', userId);
        if (reviews) allReviews = reviews;
      }

      const now = new Date();

      // Enrich function to add cardCount and dueCount
      const enrichDecks = (decks, isOfficial) => {
        return decks.map(deck => {
          const deckCards = allCards?.filter(c => c.deck_id === deck.id) || [];
          
          let dueCount = 0;
          if (!isOfficial) {
            const deckReviews = allReviews?.filter(r => r.deck_id === deck.id) || [];
            deckCards.forEach(card => {
              const review = deckReviews.find(r => r.card_id === card.id);
              if (!review) dueCount++; // Never reviewed, due now
              else if (new Date(review.next_review_date) <= now) dueCount++; // Past due date
            });
          }

          return {
            ...deck,
            cardCount: deckCards.length,
            dueCount: isOfficial ? deckCards.length : dueCount
          };
        });
      };

      setMyDecks(enrichDecks(myDecksData, false));
      setOfficialDecks(enrichDecks(officialDecksData, true));
    } catch (error) {
      console.error('Error fetching decks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOfficialDeckClick = async (deck) => {
    if (!userId) return;
    try {
      setLoading(true);
      // Check if already cloned
      const { data: existing } = await supabase
        .from('flashcard_decks')
        .select('id')
        .eq('user_id', userId)
        .eq('name', deck.name)
        .maybeSingle();

      if (existing) {
        alert('Este deck já está na sua coleção!');
        setActiveTab('meus_decks');
        return;
      }

      // Clone the deck
      const { data: newDeck, error: deckError } = await supabase
        .from('flashcard_decks')
        .insert([{
          user_id: userId,
          name: deck.name,
          subject: deck.subject,
          topic: deck.topic,
          is_official: false,
          is_published: false,
        }])
        .select()
        .single();

      if (deckError) throw deckError;

      // Clone its cards
      const { data: originalCards } = await supabase
        .from('flashcards')
        .select('front, back')
        .eq('deck_id', deck.id);

      let addedCount = 0;
      if (originalCards && originalCards.length > 0) {
        await supabase.from('flashcards').insert(
          originalCards.map(c => ({ deck_id: newDeck.id, front: c.front, back: c.back }))
        );
        addedCount = originalCards.length;
      }

      // Add to myDecks state and switch tab
      const enrichedNewDeck = { ...newDeck, cardCount: addedCount, dueCount: addedCount };
      setMyDecks(prev => [enrichedNewDeck, ...prev]);
      setActiveTab('meus_decks');

    } catch (err) {
      console.error('Failed to clone deck:', err);
      alert('Erro ao adicionar deck: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleStartReviewAll = () => {
    // Find the deck with the most due cards
    const dueDecks = myDecks.filter(d => d.dueCount > 0);
    if (dueDecks.length === 0) {
      alert('Parabéns! Nenhuma revisão pendente para hoje.');
      return;
    }
    const target = dueDecks.sort((a, b) => b.dueCount - a.dueCount)[0];
    navigate(`/flashcards/study/${target.id}`);
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <header className={styles.header}>
        <div className={styles.titleArea}>
          <h1 className={styles.title}>Flashcards</h1>
          <p className={styles.subtitle}>Memorização eficiente com repetição espaçada</p>
        </div>
        <button className={styles.createButton} onClick={() => setIsCreateModalOpen(true)}>
          <Plus size={18} />
          Criar Deck
        </button>
      </header>

      {/* Highlight Card */}
      <section className={styles.highlightCard}>
        <div className={styles.highlightInfo}>
          <span className={styles.highlightBadge}>
            <Zap size={10} /> Revisão Diária
          </span>
          <h2>Revisões de Hoje</h2>
          <p>Estude com repetição espaçada e consolide o conhecimento de forma eficiente.</p>
        </div>
        <button className={styles.startButton} onClick={handleStartReviewAll}>
          Começar Revisão
        </button>
      </section>

      {/* Tabs */}
      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'meus_decks' ? styles.active : ''}`}
          onClick={() => setActiveTab('meus_decks')}
        >
          <Layers size={16} />
          Meus Decks
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'biblioteca' ? styles.active : ''}`}
          onClick={() => setActiveTab('biblioteca')}
        >
          <Library size={16} />
          Explorar Biblioteca
        </button>
      </div>

      {/* Content */}
      {loading ? (
        <div className={styles.emptyState}>
          <p style={{ color: 'var(--color-text-muted)' }}>Sincronizando decks e calculando revisões...</p>
        </div>
      ) : activeTab === 'meus_decks' ? (
        <div className={styles.grid}>
          {myDecks.length > 0 ? (
            myDecks.map(deck => (
              <div key={deck.id} className={styles.deckCard} onClick={() => navigate(`/flashcards/deck/${deck.id}`)}>
                <div className={styles.deckHeader}>
                  <span className={styles.deckSubject}>{deck.subject}</span>
                </div>
                <h3 className={styles.deckName}>{deck.name}</h3>
                <div className={styles.deckStats}>
                  <div className={styles.stat}>
                    <Layers size={14} /> {deck.cardCount} {deck.cardCount === 1 ? 'card' : 'cards'}
                  </div>
                  <div className={styles.stat} style={{ color: deck.dueCount > 0 ? 'var(--color-gold)' : 'inherit' }}>
                    <Clock size={14} /> {deck.dueCount} pendentes
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className={styles.emptyState}>
              <BrainCircuit size={44} style={{ color: 'var(--color-border)', marginBottom: '0.75rem' }} />
              <h3>Nenhum deck ainda</h3>
              <p>Crie seu primeiro deck ou explore a Biblioteca Oficial e adicione ao seu perfil.</p>
            </div>
          )}
        </div>
      ) : (
        <div className={styles.grid}>
          {officialDecks.length > 0 ? (
            officialDecks.map(deck => (
              <div
                key={deck.id}
                className={styles.deckCard}
                onClick={() => {
                  setPreviewDeck(deck);
                  setIsPreviewModalOpen(true);
                }}
                title="Clique para ver os cards deste deck"
              >
                <div className={styles.deckHeader}>
                  <span className={styles.deckSubject}>{deck.subject}</span>
                  <span className={styles.officialBadge}>✦ Oficial</span>
                </div>
                <h3 className={styles.deckName}>{deck.name}</h3>
                <div className={styles.deckStats}>
                  <div className={styles.stat}>
                    <Layers size={14} /> {deck.cardCount} {deck.cardCount === 1 ? 'card' : 'cards'}
                  </div>
                  <div className={styles.stat} style={{ marginLeft: 'auto', color: 'var(--color-gold)', fontWeight: 600, fontSize: '0.78rem' }}>
                    Ver Deck <ArrowRight size={13} style={{ marginLeft: '4px' }} />
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className={styles.emptyState}>
              <BookOpen size={44} style={{ color: 'var(--color-border)', marginBottom: '0.75rem' }} />
              <h3>Biblioteca Vazia</h3>
              <p>Nenhum deck oficial disponível no momento.</p>
            </div>
          )}
        </div>
      )}

      <CreateDeckModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={(newDeck) => {
          setMyDecks(prev => [{ ...newDeck, cardCount: 0, dueCount: 0 }, ...prev]);
          setIsCreateModalOpen(false);
          setActiveTab('meus_decks');
        }}
      />

      <DeckPreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        deck={previewDeck}
        onAddDeck={handleOfficialDeckClick}
      />
    </div>
  );
}
