import React, { useState, useEffect, useRef } from 'react';
import { X, CheckCircle } from 'lucide-react';
import styles from './CardEditorModal.module.css';
import { supabase } from '../../lib/supabase';

export default function CardEditorModal({ isOpen, onClose, deckId, cardToEdit, onSuccess }) {
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const frontRef = useRef(null);

  useEffect(() => {
    if (isOpen) {
      if (cardToEdit) {
        setFront(cardToEdit.front);
        setBack(cardToEdit.back);
      } else {
        setFront('');
        setBack('');
      }
      setShowSuccess(false);
      // Focus the front field when modal opens
      setTimeout(() => frontRef.current?.focus(), 100);
    }
  }, [isOpen, cardToEdit]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!front.trim() || !back.trim()) return;

    try {
      setLoading(true);

      if (cardToEdit) {
        // Edit mode: update and close
        const { data, error } = await supabase
          .from('flashcards')
          .update({ front: front.trim(), back: back.trim() })
          .eq('id', cardToEdit.id)
          .select();
        if (error) throw error;
        onSuccess(data[0], 'update');
      } else {
        // Create mode: save, show toast, reset for next card
        const { data, error } = await supabase
          .from('flashcards')
          .insert([{ deck_id: deckId, front: front.trim(), back: back.trim() }])
          .select();
        if (error) throw error;

        onSuccess(data[0], 'create');

        // Show success toast and reset fields
        setShowSuccess(true);
        setFront('');
        setBack('');
        setTimeout(() => {
          setShowSuccess(false);
          frontRef.current?.focus();
        }, 1800);
      }
    } catch (error) {
      console.error('Error saving card:', error);
      alert('Erro ao salvar: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    // Ctrl/Cmd + Enter saves
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleSave();
    }
  };

  const isEditing = !!cardToEdit;

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>

        {/* Header */}
        <div className={styles.header}>
          <h2>{isEditing ? 'Editar Card' : 'Adicionar Cards'}</h2>
          <button className={styles.closeButton} onClick={onClose} aria-label="Fechar">
            <X size={20} />
          </button>
        </div>

        {/* Fields */}
        <div className={styles.content}>
          {/* Success toast */}
          {showSuccess && (
            <div className={styles.successToast}>
              <CheckCircle size={16} />
              Card criado! Adicione o próximo.
            </div>
          )}

          <div className={styles.field}>
            <label className={styles.fieldLabel}>Frente</label>
            <textarea
              ref={frontRef}
              className={styles.textarea}
              rows={3}
              value={front}
              onChange={(e) => setFront(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escreva a pergunta ou conceito..."
            />
          </div>

          <div className={styles.field}>
            <label className={styles.fieldLabel}>Verso</label>
            <textarea
              className={styles.textarea}
              rows={3}
              value={back}
              onChange={(e) => setBack(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Escreva a resposta..."
            />
          </div>
        </div>

        {/* Footer */}
        <div className={styles.footer}>
          <button className={styles.cancelButton} onClick={onClose}>
            {isEditing ? 'Cancelar' : 'Fechar'}
          </button>
          <button
            className={styles.saveButton}
            onClick={handleSave}
            disabled={loading || !front.trim() || !back.trim()}
          >
            {loading
              ? 'Salvando...'
              : isEditing
                ? 'Salvar Edição'
                : 'Criar Card'}
          </button>
        </div>

      </div>
    </div>
  );
}
