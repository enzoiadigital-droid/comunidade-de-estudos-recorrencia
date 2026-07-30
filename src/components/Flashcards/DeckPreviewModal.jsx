import React, { useState, useEffect } from 'react';
import { X, Loader } from 'lucide-react';
import styles from './DeckPreviewModal.module.css';
import { supabase } from '../../lib/supabase';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

export default function DeckPreviewModal({ isOpen, onClose, deck, onAddDeck }) {
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  useEffect(() => {
    if (isOpen && deck) {
      fetchCards();
    } else {
      setCards([]);
    }
  }, [isOpen, deck]);

  const fetchCards = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('flashcards')
        .select('*')
        .eq('deck_id', deck.id)
        .limit(10); // fetch up to 10 cards for preview

      if (error) throw error;
      setCards(data || []);
    } catch (err) {
      console.error('Error fetching cards for preview:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    setIsAdding(true);
    await onAddDeck(deck);
    setIsAdding(false);
    onClose();
  };

  if (!isOpen || !deck) return null;

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.headerInfo}>
            <h2>{deck.name}</h2>
            <p>{deck.cardCount} cards • Oficial</p>
          </div>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.content}>
          <h3 className={styles.sectionTitle}>Sample Cards</h3>
          
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--color-text-muted)' }}>
              Carregando preview...
            </div>
          ) : (
            <>
              <div className={styles.carousel}>
                {cards.map((card) => (
                  <div key={card.id} className={styles.cardPreview}>
                    <div className={styles.cardFront}>
                      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                        {card.front}
                      </ReactMarkdown>
                    </div>
                    <div className={styles.cardDivider}></div>
                    <div className={styles.cardBack}>
                      <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                        {card.back}
                      </ReactMarkdown>
                    </div>
                  </div>
                ))}
                {cards.length === 0 && (
                  <div className={styles.cardPreview} style={{ justifyContent: 'center' }}>
                    <p style={{ color: 'var(--color-text-muted)' }}>Nenhum card disponível.</p>
                  </div>
                )}
              </div>
              <p className={styles.hintText}>
                Aqui você vê uma amostra dos cards deste deck
              </p>
            </>
          )}
        </div>

        <div className={styles.footer}>
          <button 
            className={styles.addButton} 
            onClick={handleAdd}
            disabled={isAdding}
          >
            {isAdding ? 'Adicionando...' : 'Adicionar aos Meus Decks'}
          </button>
        </div>
      </div>
    </div>
  );
}
