import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import Papa from 'papaparse';
import { PlusCircle, Trash2, Upload, BookOpen } from 'lucide-react';
import styles from '../../pages/Admin.module.css';

export default function FlashcardsAdmin({ showMsg }) {
  const [decks, setDecks] = useState([]);
  const [newDeck, setNewDeck] = useState({ name: '', subject: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchDecks();
  }, []);

  const fetchDecks = async () => {
    const { data } = await supabase
      .from('flashcard_decks')
      .select('*')
      .eq('is_official', true)
      .order('display_order');
    if (data) setDecks(data);
  };

  const handleCreateDeck = async (e) => {
    e.preventDefault();
    if (!newDeck.name || !newDeck.subject) return;
    setLoading(true);
    const { error } = await supabase.from('flashcard_decks').insert([{
      name: newDeck.name,
      subject: newDeck.subject,
      is_official: true,
      is_published: true,
      user_id: null
    }]);
    setLoading(false);
    if (error) { showMsg(error.message, 'error'); return; }
    showMsg('Deck oficial criado!');
    setNewDeck({ name: '', subject: '' });
    fetchDecks();
  };

  const handleDeleteDeck = async (id) => {
    if (!window.confirm('Excluir este deck oficial?')) return;
    const { error } = await supabase.from('flashcard_decks').delete().eq('id', id);
    if (error) { showMsg(error.message, 'error'); return; }
    showMsg('Deck excluído!');
    fetchDecks();
  };

  const handleFileUpload = (e, deckId) => {
    const file = e.target.files[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const cards = results.data.filter(row => row.front && row.back).map(row => ({
          deck_id: deckId,
          front: row.front,
          back: row.back
        }));
        if (cards.length === 0) { showMsg('Nenhum card válido encontrado no CSV.', 'error'); return; }
        const { error } = await supabase.from('flashcards').insert(cards);
        if (error) { showMsg(error.message, 'error'); } else { showMsg(`${cards.length} cards importados!`); }
      },
      error: (err) => showMsg(`Erro ao ler arquivo: ${err.message}`, 'error')
    });
    e.target.value = '';
  };

  return (
    <div>
      <div className={`glass-panel ${styles.formCard}`}>
        <h2 className={styles.formTitle}><BookOpen size={18} /> Novo Deck Oficial</h2>
        <form onSubmit={handleCreateDeck} className={styles.inlineForm}>
          <div className="input-group" style={{ flex: 1 }}>
            <label>Nome do Deck</label>
            <input value={newDeck.name} onChange={e => setNewDeck(p => ({ ...p, name: e.target.value }))} required placeholder="Ex: Citologia Essencial" />
          </div>
          <div className="input-group" style={{ flex: 1 }}>
            <label>Matéria</label>
            <input value={newDeck.subject} onChange={e => setNewDeck(p => ({ ...p, subject: e.target.value }))} required placeholder="Ex: Biologia" />
          </div>
          <button type="submit" className={`btn-primary ${styles.submitBtn}`} disabled={loading}>
            <PlusCircle size={16} /> Criar
          </button>
        </form>
      </div>

      <div className={styles.listSection}>
        <h3 className={styles.listTitle}>Decks Oficiais</h3>
        {decks.map(deck => (
          <div key={deck.id} className={styles.listItem} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <span className={styles.itemTitle}>{deck.subject} — {deck.name}</span>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--color-text-muted)', border: '1px solid var(--color-border)', padding: '0.3rem 0.6rem', borderRadius: '6px' }}>
                <Upload size={14} /> Importar CSV
                <input type="file" accept=".csv" style={{ display: 'none' }} onChange={(e) => handleFileUpload(e, deck.id)} />
              </label>
              <button className={styles.btnDelete} onClick={() => handleDeleteDeck(deck.id)} title="Excluir"><Trash2 size={15} /></button>
            </div>
          </div>
        ))}
        {decks.length === 0 && <p style={{ color: 'var(--color-text-muted)' }}>Nenhum deck oficial cadastrado.</p>}
      </div>
    </div>
  );
}
