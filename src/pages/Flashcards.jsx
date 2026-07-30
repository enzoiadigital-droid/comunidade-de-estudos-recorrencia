import React, { useState, useEffect } from 'react';
import { Plus, Layers, Library, BrainCircuit, BookOpen, Clock } from 'lucide-react';
import styles from './Flashcards.module.css';
import supabase from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import CreateDeckModal from '../components/Flashcards/CreateDeckModal';

export default function Flashcards() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('meus_decks');
  const [myDecks, setMyDecks] = useState([]);
  const [officialDecks, setOfficialDecks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchDecks();
    }
  }, [user]);

  const fetchDecks = async () => {
    try {
      setLoading(true);
      // Fetch user's decks
      const { data: myData, error: myError } = await supabase
        .from('flashcard_decks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (myError) throw myError;
      setMyDecks(myData || []);

      // Fetch official decks
      const { data: offData, error: offError } = await supabase
        .from('flashcard_decks')
        .select('*')
        .eq('is_official', true)
        .eq('is_published', true)
        .order('display_order', { ascending: true });

      if (offError) throw offError;
      setOfficialDecks(offData || []);
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
          <p>Você tem 0 cards pendentes e 0 novos cards para estudar.</p>
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
        <div className={styles.emptyState}>Carregando...</div>
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
                    <Layers size={16} /> 0
                  </div>
                  <div className={styles.stat} title="Para Revisar Hoje">
                    <Clock size={16} /> 0
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className={styles.emptyState}>
              <BrainCircuit className={styles.emptyStateIcon} />
              <h3>Nenhum deck encontrado</h3>
              <p>Você ainda não criou nenhum deck. Crie um novo ou adicione da Biblioteca Oficial.</p>
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
                  <span style={{ fontSize: '0.75rem', background: 'var(--primary-color)', color: 'white', padding: '2px 8px', borderRadius: '12px' }}>
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
            <div className={styles.emptyState}>
              <BookOpen className={styles.emptyStateIcon} />
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
          setMyDecks([newDeck, ...myDecks]);
          setIsCreateModalOpen(false);
        }}
      />
    </div>
  );
}
