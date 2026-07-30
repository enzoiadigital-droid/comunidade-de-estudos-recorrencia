import React, { useState, useEffect } from 'react';
import { Plus, Layers, Library, BrainCircuit, BookOpen, Clock } from 'lucide-react';
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

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Flashcards</h1>
          <p className={styles.subtitle}>Memorização eficiente com repetição espaçada</p>
        </div>
        <button className={styles.createButton} onClick={() => setIsCreateModalOpen(true)}>
          <Plus size={20} />
          Criar Deck
        </button>
      </header>

      <section className={styles.highlightCard}>
        <div className={styles.highlightInfo}>
          <h2>Revisões de Hoje</h2>
          <p>Organize seu estudo com repetição espaçada e memorize mais em menos tempo.</p>
        </div>
        <button className={styles.startButton}>Começar Revisão</button>
      </section>

      <div className={styles.tabs}>
        <button
          className={`${styles.tab} ${activeTab === 'meus_decks' ? styles.active : ''}`}
          onClick={() => setActiveTab('meus_decks')}
        >
          <Layers size={18} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom' }} />
          Meus Decks
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'biblioteca' ? styles.active : ''}`}
          onClick={() => setActiveTab('biblioteca')}
        >
          <Library size={18} style={{ display: 'inline', marginRight: '8px', verticalAlign: 'text-bottom' }} />
          Explorar Biblioteca
        </button>
      </div>

      {loading ? (
        <div className={styles.emptyState}>
          <p style={{ color: 'var(--color-text-muted)' }}>Carregando decks...</p>
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
                  <div className={styles.stat} title="Total de Cards">
                    <Layers size={16} /> 0 cards
                  </div>
                  <div className={styles.stat} title="Para Revisar Hoje">
                    <Clock size={16} /> 0 pendentes
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className={styles.emptyState} style={{ gridColumn: '1 / -1' }}>
              <BrainCircuit size={48} style={{ color: 'var(--color-border)', marginBottom: '1rem' }} />
              <h3>Nenhum deck ainda</h3>
              <p>Clique em "Criar Deck" ou explore a Biblioteca Oficial para começar.</p>
            </div>
          )}
        </div>
      ) : (
        <div className={styles.grid}>
          {officialDecks.length > 0 ? (
            officialDecks.map(deck => (
              <div key={deck.id} className={styles.deckCard}>
                <div className={styles.deckHeader}>
                  <span className={styles.deckSubject}>{deck.subject}</span>
                  <span style={{ fontSize: '0.75rem', background: 'var(--color-gold)', color: '#000', padding: '2px 8px', borderRadius: '12px', fontWeight: '600' }}>
                    Oficial
                  </span>
                </div>
                <h3 className={styles.deckName}>{deck.name}</h3>
                <div className={styles.deckStats}>
                  <div className={styles.stat}>
                    <Layers size={16} /> 0 cards
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className={styles.emptyState} style={{ gridColumn: '1 / -1' }}>
              <BookOpen size={48} style={{ color: 'var(--color-border)', marginBottom: '1rem' }} />
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
