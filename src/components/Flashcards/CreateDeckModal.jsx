import React, { useState } from 'react';
import { X } from 'lucide-react';
import styles from './CreateDeckModal.module.css';
import supabase from '../../lib/supabase';
import { useAuth } from '../../context/AuthContext';

const SUBJECTS = [
  'Matemática', 'Física', 'Química', 'Biologia',
  'História', 'Geografia', 'Filosofia', 'Sociologia',
  'Português', 'Literatura', 'Inglês', 'Espanhol',
  'Redação', 'Multidisciplinar', 'Outra'
];

export default function CreateDeckModal({ isOpen, onClose, onSuccess }) {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [subject, setSubject] = useState(SUBJECTS[0]);
  const [topic, setTopic] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('flashcard_decks')
        .insert([{
          user_id: user.id,
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
      alert('Erro ao criar o deck. Tente novamente.');
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
          <div className={styles.formGroup}>
            <label htmlFor="name">Nome do Deck *</label>
            <input
              id="name"
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
            <label htmlFor="subject">Matéria *</label>
            <select
              id="subject"
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
            <label htmlFor="topic">Tópico (Opcional)</label>
            <input
              id="topic"
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
