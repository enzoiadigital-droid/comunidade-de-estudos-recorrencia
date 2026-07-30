import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import Papa from 'papaparse';
import { PlusCircle, Trash2, Upload, BookOpen, Download } from 'lucide-react';
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

  const handleMassImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setLoading(true);
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const rows = results.data;
          let newDecksCount = 0;
          let newCardsCount = 0;
          
          // Organize by deck name and subject
          const decksMap = {};
          
          for (const row of rows) {
            const subject = row['Matéria']?.trim();
            const deckName = row['Tópico ou assunto']?.trim();
            const front = row['Frente']?.trim();
            const back = row['Verso']?.trim();
            
            if (!subject || !deckName || !front || !back) continue;
            
            const key = `${subject}|||${deckName}`;
            if (!decksMap[key]) {
              decksMap[key] = { subject, deckName, cards: [] };
            }
            decksMap[key].cards.push({ front, back });
          }
          
          const groups = Object.values(decksMap);
          if (groups.length === 0) {
            showMsg('Nenhum dado válido encontrado. Verifique se as colunas estão exatas: "Tópico ou assunto", "Matéria", "Frente" e "Verso".', 'error');
            setLoading(false);
            return;
          }
          
          for (const group of groups) {
            // Check if deck exists
            let { data: existingDecks, error: findError } = await supabase
              .from('flashcard_decks')
              .select('id')
              .eq('name', group.deckName)
              .eq('subject', group.subject)
              .eq('is_official', true);
              
            let deckId;
            
            if (existingDecks && existingDecks.length > 0) {
              deckId = existingDecks[0].id;
            } else {
              // Create deck
              const { data: newDeckData, error: createError } = await supabase
                .from('flashcard_decks')
                .insert([{
                  name: group.deckName,
                  subject: group.subject,
                  is_official: true,
                  is_published: true,
                  user_id: null
                }])
                .select();
                
              if (createError) throw createError;
              deckId = newDeckData[0].id;
              newDecksCount++;
            }
            
            // Insert cards
            const cardsToInsert = group.cards.map(c => ({
              deck_id: deckId,
              front: c.front,
              back: c.back
            }));
            
            const { error: insertError } = await supabase
              .from('flashcards')
              .insert(cardsToInsert);
              
            if (insertError) throw insertError;
            newCardsCount += cardsToInsert.length;
          }
          
          showMsg(`Importação em massa concluída! ${newDecksCount} decks novos e ${newCardsCount} cards inseridos.`);
          fetchDecks();
        } catch (err) {
          showMsg(`Erro na importação: ${err.message}`, 'error');
        } finally {
          setLoading(false);
          e.target.value = '';
        }
      },
      error: (err) => {
        showMsg(`Erro ao ler arquivo: ${err.message}`, 'error');
        setLoading(false);
      }
    });
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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
          <h3 className={styles.listTitle} style={{ margin: 0 }}>Decks Oficiais</h3>
          
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <a href="/template_flashcards_massa.csv" download className={styles.btnCancel} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.4rem 0.8rem' }} title="Baixe a planilha modelo">
              <Download size={15} /> Baixar Template
            </a>
            <label style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', background: 'var(--color-gold)', color: '#000', fontWeight: 'bold', padding: '0.45rem 1rem', borderRadius: '8px', transition: 'all 0.2s' }}>
              <Upload size={16} /> Importação em Massa
              <input type="file" accept=".csv" style={{ display: 'none' }} onChange={handleMassImport} disabled={loading} />
            </label>
          </div>
        </div>
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
