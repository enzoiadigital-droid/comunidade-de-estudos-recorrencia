import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Play, Edit3, Trash2, BookOpen } from 'lucide-react';
import styles from './DeckDetails.module.css';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import CardEditorModal from '../components/Flashcards/CardEditorModal';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export default function DeckDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [deck, setDeck] = useState(null);
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingCard, setEditingCard] = useState(null);

  useEffect(() => {
    fetchDeckData();
  }, [id]);

  const fetchDeckData = async () => {
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
        .eq('deck_id', id)
        .order('created_at', { ascending: true });

      if (cardsError) throw cardsError;
      setCards(cardsData || []);

    } catch (error) {
      console.error('Error fetching deck details:', error);
      alert('Erro ao carregar deck.');
      navigate('/flashcards');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCard = async (cardId) => {
    if (!window.confirm('Tem certeza que deseja excluir este card?')) return;
    
    try {
      const { error } = await supabase
        .from('flashcards')
        .delete()
        .eq('id', cardId);
        
      if (error) throw error;
      setCards(cards.filter(c => c.id !== cardId));
    } catch (error) {
      console.error('Error deleting card:', error);
      alert('Erro ao excluir card.');
    }
  };

  if (loading) return <div className={styles.container}>Carregando...</div>;
  if (!deck) return <div className={styles.container}>Deck não encontrado.</div>;

  return (
    <div className={styles.container}>
      <button className={styles.backButton} onClick={() => navigate('/flashcards')}>
        <ArrowLeft size={20} /> Voltar para Meus Decks
      </button>

      <header className={styles.header}>
        <div className={styles.titleSection}>
          <span className={styles.subjectBadge}>{deck.subject}</span>
          <h1>{deck.name}</h1>
          <p style={{ color: 'var(--text-color-secondary)' }}>{cards.length} cards totais</p>
        </div>
        
        <div className={styles.actions}>
          <button className={styles.addButton} onClick={() => { setEditingCard(null); setIsEditorOpen(true); }}>
            <Plus size={20} /> Adicionar Card
          </button>
          <button className={styles.studyButton} onClick={() => navigate(`/flashcards/study/${deck.id}`)} disabled={cards.length === 0}>
            <Play size={20} /> Estudar Agora
          </button>
        </div>
      </header>

      <div className={styles.cardsList}>
        {cards.length > 0 ? (
          <div className={styles.cardsGrid}>
            {cards.map(card => (
              <div key={card.id} className={styles.cardRow}>
                <div className={styles.cardContent}>
                  <div>
                    <span className={styles.cardLabel}>Frente</span>
                    <div className={styles.cardSide}>
                      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                        {card.front}
                      </ReactMarkdown>
                    </div>
                  </div>
                  <div>
                    <span className={styles.cardLabel}>Verso</span>
                    <div className={styles.cardSide}>
                      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                        {card.back}
                      </ReactMarkdown>
                    </div>
                  </div>
                </div>
                
                <div className={styles.cardActions}>
                  <button className={styles.actionButton} onClick={() => { setEditingCard(card); setIsEditorOpen(true); }} title="Editar">
                    <Edit3 size={18} />
                  </button>
                  <button className={`${styles.actionButton} ${styles.delete}`} onClick={() => handleDeleteCard(card.id)} title="Excluir">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <BookOpen size={48} style={{ marginBottom: '1rem', color: 'var(--border-color)' }} />
            <h3>Este deck está vazio</h3>
            <p>Adicione seu primeiro card para começar a estudar.</p>
          </div>
        )}
      </div>

      <CardEditorModal 
        isOpen={isEditorOpen} 
        onClose={() => setIsEditorOpen(false)}
        deckId={deck.id}
        cardToEdit={editingCard}
        onSuccess={(savedCard, type) => {
          if (type === 'create') {
            setCards([...cards, savedCard]);
          } else {
            setCards(cards.map(c => c.id === savedCard.id ? savedCard : c));
          }
        }}
      />
    </div>
  );
}
