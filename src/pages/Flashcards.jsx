import React, { useState, useEffect } from 'react';
import { Plus, Layers, Library, BrainCircuit, BookOpen, Clock, Zap, ArrowRight } from 'lucide-react';
import styles from './Flashcards.module.css';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import CreateDeckModal from '../components/Flashcards/CreateDeckModal';

export default function Flashcards() {
  const { session } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('meus_decks');
  const [myDecks, setMyDecks] = useState([]);
  const [officialDecks, setOfficialDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const userId = session?.user?.id;

  useEffect(() => {
    fetchDecks();
  }, [userId]);

  const fetchDecks = async () => {
    try {
      setLoading(true);

      if (userId) {
        const { data: myData, error: myError } = await supabase
          .from('flashcard_decks')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });
        if (!myError) setMyDecks(myData || []);
      }

      const { data: offData, error: offError } = await supabase
        .from('flashcard_decks')
        .select('*')
        .eq('is_official', true)
        .eq('is_published', true)
        .order('display_order', { ascending: true });

      if (!offError) setOfficialDecks(offData || []);
    } catch (error) {
      console.error('Error fetching decks:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOfficialDeckClick = async (deck) => {
    if (!userId) return;
    // Clone to user's decks and navigate to it
    try {
      // Check if already cloned
      const { data: existing } = await supabase
        .from('flashcard_decks')
        .select('id')
        .eq('user_id', userId)
        .eq('name', deck.name)
        .maybeSingle();

      if (existing) {
        navigate(`/flashcards/deck/${existing.id}`);
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

      if (originalCards && originalCards.length > 0) {
        await supabase.from('flashcards').insert(
          originalCards.map(c => ({ deck_id: newDeck.id, front: c.front, back: c.back }))
        );
      }

      setMyDecks(prev => [newDeck, ...prev]);
      navigate(`/flashcards/deck/${newDeck.id}`);
    } catch (err) {
      console.error('Failed to clone deck:', err);
    }
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

      {/* Highlight Card — elegant glassmorphism */}
      <section className={styles.highlightCard}>
        <div className={styles.highlightInfo}>
          <span className={styles.highlightBadge}>
            <Zap size={10} /> Revisão Diária
          </span>
          <h2>Revisões de Hoje</h2>
          <p>Estude com repetição espaçada e consolide o conhecimento de forma eficiente.</p>
        </div>
        <button className={styles.startButton}>
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
          <p>Carregando decks...</p>
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
                    <Layers size={14} /> 0 cards
                  </div>
                  <div className={styles.stat}>
                    <Clock size={14} /> 0 pendentes
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
                onClick={() => handleOfficialDeckClick(deck)}
                title="Clique para adicionar aos seus decks e estudar"
              >
                <div className={styles.deckHeader}>
                  <span className={styles.deckSubject}>{deck.subject}</span>
                  <span className={styles.officialBadge}>✦ Oficial</span>
                </div>
                <h3 className={styles.deckName}>{deck.name}</h3>
                <div className={styles.deckStats}>
                  <div className={styles.stat}>
                    <Layers size={14} /> 0 cards
                  </div>
                  <div className={styles.stat} style={{ marginLeft: 'auto', color: 'var(--color-gold)', fontWeight: 600, fontSize: '0.78rem' }}>
                    Adicionar <ArrowRight size={13} />
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
          setMyDecks(prev => [newDeck, ...prev]);
          setIsCreateModalOpen(false);
        }}
      />
    </div>
  );
}
