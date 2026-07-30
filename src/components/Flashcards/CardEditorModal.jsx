import React, { useState, useEffect } from 'react';
import { X, Bold, Italic, List, Image, Type } from 'lucide-react';
import styles from './CardEditorModal.module.css';
import supabase from '../../lib/supabase';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css'; // Requires katex CSS to render formulas properly

export default function CardEditorModal({ isOpen, onClose, deckId, cardToEdit, onSuccess }) {
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (cardToEdit) {
      setFront(cardToEdit.front);
      setBack(cardToEdit.back);
    } else {
      setFront('');
      setBack('');
    }
  }, [cardToEdit, isOpen]);

  if (!isOpen) return null;

  const insertText = (setter, textToInsert) => {
    setter(prev => prev + textToInsert);
  };

  const handleSave = async () => {
    if (!front.trim() || !back.trim()) return;

    try {
      setLoading(true);
      if (cardToEdit) {
        // Update
        const { data, error } = await supabase
          .from('flashcards')
          .update({ front, back })
          .eq('id', cardToEdit.id)
          .select();

        if (error) throw error;
        onSuccess(data[0], 'update');
      } else {
        // Insert
        const { data, error } = await supabase
          .from('flashcards')
          .insert([{ deck_id: deckId, front, back }])
          .select();

        if (error) throw error;
        onSuccess(data[0], 'create');
      }
      setFront('');
      setBack('');
    } catch (error) {
      console.error('Error saving card:', error);
      alert('Erro ao salvar card.');
    } finally {
      setLoading(false);
    }
  };

  const renderToolbar = (setter) => (
    <div className={styles.toolbar}>
      <button type="button" className={styles.toolbarButton} onClick={() => insertText(setter, '**Negrito** ')} title="Negrito"><Bold size={16} /></button>
      <button type="button" className={styles.toolbarButton} onClick={() => insertText(setter, '*Itálico* ')} title="Itálico"><Italic size={16} /></button>
      <button type="button" className={styles.toolbarButton} onClick={() => insertText(setter, '\n- ')} title="Lista"><List size={16} /></button>
      <button type="button" className={styles.toolbarButton} onClick={() => insertText(setter, '![alt](url)')} title="Imagem"><Image size={16} /></button>
      <button type="button" className={styles.toolbarButton} onClick={() => insertText(setter, '$$fórmula$$ ')} title="Fórmula Matemática (KaTeX)"><Type size={16} /></button>
    </div>
  );

  return (
    <div className={styles.overlay} onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>{cardToEdit ? 'Editar Card' : 'Novo Card'}</h2>
          <button className={styles.closeButton} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className={styles.content}>
          <div className={styles.editorSection}>
            <label>Frente do Card (Pergunta)</label>
            <div>
              {renderToolbar(setFront)}
              <textarea 
                className={styles.textarea}
                value={front}
                onChange={(e) => setFront(e.target.value)}
                placeholder="Escreva a pergunta aqui (suporta Markdown e $$matemática$$)..."
              />
            </div>
            <div className={styles.preview}>
              <span className={styles.previewLabel}>Pré-visualização (Frente)</span>
              <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                {front || ' *Pré-visualização...*'}
              </ReactMarkdown>
            </div>
          </div>

          <div className={styles.editorSection}>
            <label>Verso do Card (Resposta)</label>
            <div>
              {renderToolbar(setBack)}
              <textarea 
                className={styles.textarea}
                value={back}
                onChange={(e) => setBack(e.target.value)}
                placeholder="Escreva a resposta aqui..."
              />
            </div>
            <div className={styles.preview}>
              <span className={styles.previewLabel}>Pré-visualização (Verso)</span>
              <ReactMarkdown remarkPlugins={[remarkMath]} rehypePlugins={[rehypeKatex]}>
                {back || ' *Pré-visualização...*'}
              </ReactMarkdown>
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <button className={styles.cancelButton} onClick={onClose}>Cancelar</button>
          <div className={styles.actions}>
            {!cardToEdit && (
              <button 
                className={styles.saveButton} 
                style={{ background: 'var(--text-color-secondary)' }}
                onClick={async () => {
                  await handleSave();
                  // Continues open
                }}
                disabled={loading || !front.trim() || !back.trim()}
              >
                Salvar e Adicionar Outro
              </button>
            )}
            <button 
              className={styles.saveButton} 
              onClick={() => { handleSave(); onClose(); }}
              disabled={loading || !front.trim() || !back.trim()}
            >
              {loading ? 'Salvando...' : 'Salvar Card'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
