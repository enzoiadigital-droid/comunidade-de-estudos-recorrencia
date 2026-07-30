import React, { useState } from 'react';
import { X } from 'lucide-react';
import styles from './CreateDeckModal.module.css';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

const SUBJECTS = [
  'Matemática', 'Física', 'Química', 'Biologia',
  'História', 'Geografia', 'Filosofia', 'Sociologia',
  'Português', 'Literatura', 'Inglês', 'Espanhol',
  'Redação', 'Multidisciplinar', 'Outra'
];

export default function CreateDeckModal({ isOpen, onClose, onSuccess }) {
  const { session } = useAuth();
  const [name, setName] = useState('');
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    const userId = session?.user?.id;
    if (!userId) {
      setErrorMsg('Você precisa estar logado para criar um deck.');
      return;
    }

    try {
      setLoading(true);
      setErrorMsg('');
      const { data, error } = await supabase
        .from('flashcard_decks')
        .insert([{
          user_id: userId,
          name: name.trim(),
          subject,
          topic: topic.trim() || null,
          is_official: false,
          is_published: false
        }])
        .select();

      if (error) throw error;

      onSuccess(data[0]);
      setName('');
      setTopic('');
      setSubject(SUBJECTS[0]);
    } catch (error) {
      console.error('Error creating deck:', error);
      setErrorMsg(`Erro: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>Criar Novo Deck</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {errorMsg && (
            <div style={{ background: 'rgba(239,68,68,0.15)', border: '1px solid #ef4444', color: '#ef4444', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1rem', fontSize: '0.9rem' }}>
              {errorMsg}
            </div>
          )}

          <div className={styles.formGroup}>
            <label htmlFor="deck-name">Nome do Deck *</label>
            <input
              id="deck-name"
              type="text"
              className={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Fórmulas de Geometria Plana"
              required
              autoFocus
            />
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="deck-subject">Matéria *</label>
            <select
              id="deck-subject"
              className={styles.select}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            >
              {SUBJECTS.map(sub => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>

          <div className={styles.formGroup}>
            <label htmlFor="deck-topic">Tópico (Opcional)</label>
            <input
              id="deck-topic"
              type="text"
              className={styles.input}
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="Ex: Áreas e Perímetros"
            />
          </div>

          <div className={styles.actions}>
            <button type="button" className={styles.cancelButton} onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className={styles.submitButton} disabled={loading || !name.trim()}>
              {loading ? 'Criando...' : 'Criar Deck'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
