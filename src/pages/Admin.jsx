import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Header from '../components/Header';
import { useSettings } from '../context/SettingsContext';
import styles from './Admin.module.css';
import {
  PlusCircle, Save, Pencil, Trash2, ChevronDown, ChevronUp,
  X, Paperclip, ExternalLink, FolderOpen, SlidersHorizontal
} from 'lucide-react';

// ────────────────────────────────────────────────
// Modal de Confirmação de Exclusão
// ────────────────────────────────────────────────
function ConfirmModal({ message, onConfirm, onCancel }) {
  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <h3>Confirmar exclusão</h3>
        <p>{message}</p>
        <div className={styles.modalActions}>
          <button className={styles.btnDanger} onClick={onConfirm}>Excluir</button>
          <button className={styles.btnCancel} onClick={onCancel}>Cancelar</button>
        </div>
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────
// Seção de Categorias
// ────────────────────────────────────────────────
function CategoriesSection({ showMsg }) {
  const [categories, setCategories] = useState([]);
  const [newTitle, setNewTitle] = useState('');
  const [newOrder, setNewOrder] = useState('0');
  const [editingId, setEditingId] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editOrder, setEditOrder] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => { fetchCategories(); }, []);

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('*').order('order_index');
    if (data) setCategories(data);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('categories').insert([{ title: newTitle, order_index: parseInt(newOrder) }]);
    if (error) { showMsg(error.message, 'error'); return; }
    showMsg('Categoria criada!');
    setNewTitle(''); setNewOrder('0');
    fetchCategories();
  };

  const startEdit = (cat) => {
    setEditingId(cat.id);
    setEditTitle(cat.title);
    setEditOrder(String(cat.order_index));
  };

  const handleSaveEdit = async (id) => {
    const { error } = await supabase.from('categories')
      .update({ title: editTitle, order_index: parseInt(editOrder) })
      .eq('id', id);
    if (error) { showMsg(error.message, 'error'); return; }
    showMsg('Categoria atualizada!');
    setEditingId(null);
    fetchCategories();
  };

  const handleDelete = async (id) => {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) { showMsg(error.message, 'error'); return; }
    showMsg('Categoria excluída!');
    setConfirmDelete(null);
    fetchCategories();
  };

  return (
    <div>
      {confirmDelete && (
        <ConfirmModal
          message={`Excluir a categoria "${confirmDelete.title}"? Isso removerá todas as aulas vinculadas.`}
          onConfirm={() => handleDelete(confirmDelete.id)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {/* Formulário de Nova Categoria */}
      <div className={`glass-panel ${styles.formCard}`}>
        <h2 className={styles.formTitle}><PlusCircle size={18} /> Nova Categoria (Trilha)</h2>
        <form onSubmit={handleAdd} className={styles.inlineForm}>
          <div className="input-group" style={{ flex: 1 }}>
            <label>Título</label>
            <input value={newTitle} onChange={e => setNewTitle(e.target.value)} required placeholder="Ex: Comece por aqui" />
          </div>
          <div className="input-group" style={{ width: '100px' }}>
            <label>Ordem</label>
            <input type="number" value={newOrder} onChange={e => setNewOrder(e.target.value)} required />
          </div>
          <button type="submit" className={`btn-primary ${styles.submitBtn}`}><Save size={16} /> Salvar</button>
        </form>
      </div>

      {/* Lista de Categorias */}
      <div className={styles.listSection}>
        <h3 className={styles.listTitle}><FolderOpen size={16} /> Categorias existentes</h3>
        {categories.map(cat => (
          <div key={cat.id} className={styles.listItem}>
            {editingId === cat.id ? (
              <div className={styles.editRow}>
                <input className={styles.editInput} value={editTitle} onChange={e => setEditTitle(e.target.value)} />
                <input className={styles.editInputSmall} type="number" value={editOrder} onChange={e => setEditOrder(e.target.value)} />
                <button className={styles.btnSave} onClick={() => handleSaveEdit(cat.id)}><Save size={15} /></button>
                <button className={styles.btnCancel} onClick={() => setEditingId(null)}><X size={15} /></button>
              </div>
            ) : (
              <div className={styles.itemRow}>
                <span className={styles.itemOrder}>{cat.order_index}</span>
                <span className={styles.itemTitle}>{cat.title}</span>
                <div className={styles.itemActions}>
                  <button className={styles.btnEdit} onClick={() => startEdit(cat)} title="Editar"><Pencil size={15} /></button>
                  <button className={styles.btnDelete} onClick={() => setConfirmDelete(cat)} title="Excluir"><Trash2 size={15} /></button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────
// Seção de Aulas
// ────────────────────────────────────────────────
function LessonsSection({ showMsg }) {
  const [categories, setCategories] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [expandedLesson, setExpandedLesson] = useState(null);
  const [editingLesson, setEditingLesson] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);

  // Nova aula
  const [newLesson, setNewLesson] = useState({
    category_id: '', title: '', video_url: '', cover_image_url: '', summary: '', checklist: '', order_index: '0', is_free: false
  });

  useEffect(() => {
    fetchCategories();
    fetchLessons();
  }, []);

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('*').order('order_index');
    if (data) setCategories(data);
  };

  const fetchLessons = async () => {
    const { data } = await supabase.from('lessons').select('*, categories(title)').order('order_index');
    if (data) setLessons(data);
  };

  const handleAddLesson = async (e) => {
    e.preventDefault();
    if (!newLesson.category_id) { showMsg('Selecione uma categoria.', 'error'); return; }
    const { error } = await supabase.from('lessons').insert([{
      ...newLesson, order_index: parseInt(newLesson.order_index)
    }]);
    if (error) { showMsg(error.message, 'error'); return; }
    showMsg('Aula criada!');
    setNewLesson({ category_id: '', title: '', video_url: '', cover_image_url: '', summary: '', checklist: '', order_index: '0', is_free: false });
    fetchLessons();
  };

  const startEditLesson = (lesson) => {
    setEditingLesson({
      ...lesson,
      order_index: String(lesson.order_index)
    });
  };

  const handleSaveLesson = async () => {
    const { id, categories: _cat, ...fields } = editingLesson;
    const { error } = await supabase.from('lessons').update({
      ...fields, order_index: parseInt(fields.order_index)
    }).eq('id', id);
    if (error) { showMsg(error.message, 'error'); return; }
    showMsg('Aula atualizada!');
    setEditingLesson(null);
    fetchLessons();
  };

  const handleDeleteLesson = async (id) => {
    const { error } = await supabase.from('lessons').delete().eq('id', id);
    if (error) { showMsg(error.message, 'error'); return; }
    showMsg('Aula excluída!');
    setConfirmDelete(null);
    fetchLessons();
  };

  const toggleExpand = (id) => setExpandedLesson(prev => prev === id ? null : id);

  return (
    <div>
      {confirmDelete && (
        <ConfirmModal
          message={`Excluir a aula "${confirmDelete.title}"?`}
          onConfirm={() => handleDeleteLesson(confirmDelete.id)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {/* Formulário de Nova Aula */}
      <div className={`glass-panel ${styles.formCard}`}>
        <h2 className={styles.formTitle}><PlusCircle size={18} /> Nova Aula</h2>
        <form onSubmit={handleAddLesson} className={styles.gridForm}>
          <div className="input-group">
            <label>Categoria</label>
            <select value={newLesson.category_id} onChange={e => setNewLesson(p => ({ ...p, category_id: e.target.value }))} required>
              <option value="">Selecione...</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
            </select>
          </div>
          <div className="input-group">
            <label>Ordem</label>
            <input type="number" value={newLesson.order_index} onChange={e => setNewLesson(p => ({ ...p, order_index: e.target.value }))} />
          </div>
          <div className="input-group" style={{ gridColumn: '1 / -1' }}>
            <label>Título da Aula</label>
            <input value={newLesson.title} onChange={e => setNewLesson(p => ({ ...p, title: e.target.value }))} required placeholder="Ex: Live 01 — Como começar a estudar" />
          </div>
          <div className="input-group" style={{ gridColumn: '1 / -1' }}>
            <label>Vídeo</label>
            <div className={styles.videoTypeToggle}>
              <button
                type="button"
                className={`${styles.typeBtn} ${!newLesson.video_url.startsWith('<iframe') ? styles.typeBtnActive : ''}`}
                onClick={() => setNewLesson(p => ({ ...p, video_url: '' }))}
              >
                🔗 URL Direta (MP4)
              </button>
              <button
                type="button"
                className={`${styles.typeBtn} ${newLesson.video_url.startsWith('<iframe') ? styles.typeBtnActive : ''}`}
                onClick={() => setNewLesson(p => ({ ...p, video_url: '<iframe ' }))}
              >
                ▶ Embed (YouTube / Vimeo)
              </button>
            </div>
            {newLesson.video_url.startsWith('<iframe') ? (
              <textarea
                rows="3"
                value={newLesson.video_url === '<iframe ' ? '' : newLesson.video_url}
                onChange={e => setNewLesson(p => ({ ...p, video_url: e.target.value }))}
                placeholder='Cole aqui o código <iframe ...> do YouTube ou Vimeo'
                style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}
              />
            ) : (
              <input
                type="url"
                value={newLesson.video_url}
                onChange={e => setNewLesson(p => ({ ...p, video_url: e.target.value }))}
                placeholder="https://exemplo.com/video.mp4"
              />
            )}
          </div>
          <div className="input-group" style={{ gridColumn: '1 / -1' }}>
            <label>URL da Imagem de Capa (Opcional)</label>
            <input type="url" value={newLesson.cover_image_url} onChange={e => setNewLesson(p => ({ ...p, cover_image_url: e.target.value }))} placeholder="https://..." />
          </div>
          <div className="input-group" style={{ gridColumn: '1 / -1' }}>
            <label>Principais Pontos (Resumo)</label>
            <textarea rows="3" value={newLesson.summary} onChange={e => setNewLesson(p => ({ ...p, summary: e.target.value }))}></textarea>
          </div>
          <div className="input-group" style={{ gridColumn: '1 / -1' }}>
            <label>Checklist — O que fazer agora (uma tarefa por linha, ex: "- Baixar o PDF")</label>
            <textarea rows="3" value={newLesson.checklist} onChange={e => setNewLesson(p => ({ ...p, checklist: e.target.value }))}></textarea>
          </div>
          <div className="input-group" style={{ gridColumn: '1 / -1' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}>
              <input
                type="checkbox"
                checked={newLesson.is_free}
                onChange={e => setNewLesson(p => ({ ...p, is_free: e.target.checked }))}
                style={{ width: 16, height: 16, accentColor: 'var(--color-gold)' }}
              />
              <span>Aula gratuita <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(visível sem assinatura para quem tem conta)</span></span>
            </label>
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <button type="submit" className="btn-primary"><Save size={16} /> Salvar Aula</button>
          </div>
        </form>
      </div>

      {/* Lista de Aulas */}
      <div className={styles.listSection}>
        <h3 className={styles.listTitle}>Aulas existentes</h3>
        {lessons.map(lesson => (
          <div key={lesson.id} className={styles.lessonCard}>
            {/* Cabeçalho do card */}
            <div className={styles.lessonHeader}>
              <div className={styles.lessonMeta}>
                <span className={styles.lessonCategory}>{lesson.categories?.title}</span>
                <span className={styles.lessonTitle}>{lesson.title}</span>
              </div>
              <div className={styles.itemActions}>
                <button className={styles.btnEdit} onClick={() => startEditLesson(lesson)} title="Editar"><Pencil size={15} /></button>
                <button className={styles.btnDelete} onClick={() => setConfirmDelete(lesson)} title="Excluir"><Trash2 size={15} /></button>
                <button className={styles.btnExpand} onClick={() => toggleExpand(lesson.id)} title="Gerenciar Anexos">
                  <Paperclip size={15} />
                  {expandedLesson === lesson.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </div>
            </div>

            {/* Formulário de Edição da Aula */}
            {editingLesson?.id === lesson.id && (
              <div className={styles.editPanel}>
                <div className={styles.gridForm}>
                  <div className="input-group">
                    <label>Categoria</label>
                    <select value={editingLesson.category_id} onChange={e => setEditingLesson(p => ({ ...p, category_id: e.target.value }))}>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                    </select>
                  </div>
                  <div className="input-group">
                    <label>Ordem</label>
                    <input type="number" value={editingLesson.order_index} onChange={e => setEditingLesson(p => ({ ...p, order_index: e.target.value }))} />
                  </div>
                  <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                    <label>Título</label>
                    <input value={editingLesson.title} onChange={e => setEditingLesson(p => ({ ...p, title: e.target.value }))} />
                  </div>
                  <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                    <label>Vídeo</label>
                    <div className={styles.videoTypeToggle}>
                      <button
                        type="button"
                        className={`${styles.typeBtn} ${!(editingLesson.video_url || '').startsWith('<iframe') ? styles.typeBtnActive : ''}`}
                        onClick={() => setEditingLesson(p => ({ ...p, video_url: '' }))}
                      >
                        🔗 URL Direta (MP4)
                      </button>
                      <button
                        type="button"
                        className={`${styles.typeBtn} ${(editingLesson.video_url || '').startsWith('<iframe') ? styles.typeBtnActive : ''}`}
                        onClick={() => {
                          const v = editingLesson.video_url || '';
                          if (!v.startsWith('<iframe')) setEditingLesson(p => ({ ...p, video_url: '' }));
                        }}
                      >
                        ▶ Embed (YouTube / Vimeo)
                      </button>
                    </div>
                    {(editingLesson.video_url || '').startsWith('<iframe') ? (
                      <textarea
                        rows="3"
                        value={editingLesson.video_url || ''}
                        onChange={e => setEditingLesson(p => ({ ...p, video_url: e.target.value }))}
                        placeholder='Cole aqui o código <iframe ...> do YouTube ou Vimeo'
                        style={{ fontFamily: 'monospace', fontSize: '0.8rem' }}
                      />
                    ) : (
                      <input
                        value={editingLesson.video_url || ''}
                        onChange={e => setEditingLesson(p => ({ ...p, video_url: e.target.value }))}
                        placeholder="https://exemplo.com/video.mp4"
                      />
                    )}
                  </div>
                  <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                    <label>URL da Imagem de Capa</label>
                    <input value={editingLesson.cover_image_url || ''} onChange={e => setEditingLesson(p => ({ ...p, cover_image_url: e.target.value }))} />
                  </div>
                  <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                    <label>Principais Pontos</label>
                    <textarea rows="3" value={editingLesson.summary || ''} onChange={e => setEditingLesson(p => ({ ...p, summary: e.target.value }))}></textarea>
                  </div>
                  <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                    <label>Checklist</label>
                    <textarea rows="3" value={editingLesson.checklist || ''} onChange={e => setEditingLesson(p => ({ ...p, checklist: e.target.value }))}></textarea>
                  </div>
                  <div className="input-group" style={{ gridColumn: '1 / -1' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={editingLesson.is_free || false}
                        onChange={e => setEditingLesson(p => ({ ...p, is_free: e.target.checked }))}
                        style={{ width: 16, height: 16, accentColor: 'var(--color-gold)' }}
                      />
                      <span>Aula gratuita <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(visível sem assinatura para quem tem conta)</span></span>
                    </label>
                  </div>
                </div>
                <div className={styles.editActions}>
                  <button className="btn-primary" onClick={handleSaveLesson}><Save size={15} /> Salvar Alterações</button>
                  <button className={styles.btnCancelText} onClick={() => setEditingLesson(null)}><X size={15} /> Cancelar</button>
                </div>
              </div>
            )}

            {/* Painel de Anexos */}
            {expandedLesson === lesson.id && (
              <MaterialsPanel lessonId={lesson.id} showMsg={showMsg} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ────────────────────────────────────────────────
// Painel de Anexos de uma Aula
// ────────────────────────────────────────────────
function MaterialsPanel({ lessonId, showMsg }) {
  const [materials, setMaterials] = useState([]);
  const [matTitle, setMatTitle] = useState('');
  const [matUrl, setMatUrl] = useState('');
  const [matType, setMatType] = useState('PDF');
  const [confirmDelete, setConfirmDelete] = useState(null);

  useEffect(() => { fetchMaterials(); }, [lessonId]);

  const fetchMaterials = async () => {
    const { data } = await supabase.from('materials').select('*').eq('lesson_id', lessonId);
    if (data) setMaterials(data);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('materials').insert([{
      lesson_id: lessonId, title: matTitle, file_url: matUrl, type: matType
    }]);
    if (error) { showMsg(error.message, 'error'); return; }
    showMsg('Anexo adicionado!');
    setMatTitle(''); setMatUrl('');
    fetchMaterials();
  };

  const handleDelete = async (id) => {
    const { error } = await supabase.from('materials').delete().eq('id', id);
    if (error) { showMsg(error.message, 'error'); return; }
    showMsg('Anexo removido!');
    setConfirmDelete(null);
    fetchMaterials();
  };

  return (
    <div className={styles.materialsPanel}>
      {confirmDelete && (
        <ConfirmModal
          message={`Remover o anexo "${confirmDelete.title}"?`}
          onConfirm={() => handleDelete(confirmDelete.id)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      <h4 className={styles.materialsPanelTitle}><Paperclip size={15} /> Anexos desta aula</h4>

      {/* Formulário de Novo Anexo */}
      <form onSubmit={handleAdd} className={styles.materialsForm}>
        <div className="input-group" style={{ flex: 2 }}>
          <label>Nome do Anexo</label>
          <input value={matTitle} onChange={e => setMatTitle(e.target.value)} required placeholder="Ex: PDF da Aula 01" />
        </div>
        <div className="input-group" style={{ width: '110px' }}>
          <label>Tipo</label>
          <select value={matType} onChange={e => setMatType(e.target.value)}>
            <option>PDF</option>
            <option>Planilha</option>
            <option>Mapa Mental</option>
            <option>Slides</option>
            <option>Outro</option>
          </select>
        </div>
        <div className="input-group" style={{ flex: 3 }}>
          <label>Link Público do Arquivo</label>
          <input type="url" value={matUrl} onChange={e => setMatUrl(e.target.value)} required placeholder="https://..." />
        </div>
        <button type="submit" className={`btn-primary ${styles.matSubmitBtn}`}><PlusCircle size={16} /> Adicionar</button>
      </form>

      {/* Lista de Anexos */}
      {materials.length === 0 ? (
        <p className={styles.noMaterials}>Nenhum anexo adicionado ainda.</p>
      ) : (
        <div className={styles.materialsList}>
          {materials.map(mat => (
            <div key={mat.id} className={styles.materialItem}>
              <span className={styles.matBadge}>{mat.type}</span>
              <span className={styles.matTitle}>{mat.title}</span>
              <a href={mat.file_url} target="_blank" rel="noopener noreferrer" className={styles.matLink}>
                <ExternalLink size={14} />
              </a>
              <button className={styles.btnDelete} onClick={() => setConfirmDelete(mat)}><Trash2 size={14} /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ────────────────────────────────────────────────
// Seção de Configurações do Site
// ────────────────────────────────────────────────
function SettingsSection({ showMsg }) {
  const { settings, refetchSettings } = useSettings();
  const [form, setForm] = useState({
    hero_title: '',
    hero_subtitle: '',
    hero_title_size_desktop: '',
    hero_title_size_mobile: '',
    header_brand_text: '',
    header_brand_size_desktop: '',
    header_brand_size_mobile: '',
    subscribe_url: '',
  });

  // Sincroniza form quando settings carregam
  useEffect(() => {
    setForm({
      hero_title: settings.hero_title ?? '',
      hero_subtitle: settings.hero_subtitle ?? '',
      hero_title_size_desktop: settings.hero_title_size_desktop ?? '3',
      hero_title_size_mobile: settings.hero_title_size_mobile ?? '1.75',
      header_brand_text: settings.header_brand_text ?? '',
      header_brand_size_desktop: settings.header_brand_size_desktop ?? '1.25',
      header_brand_size_mobile: settings.header_brand_size_mobile ?? '1',
      subscribe_url: settings.subscribe_url ?? '',
    });
  }, [settings]);

  const handleSave = async (e) => {
    e.preventDefault();
    const upserts = Object.entries(form).map(([key, value]) => ({ key, value: String(value) }));
    const { error } = await supabase
      .from('site_settings')
      .upsert(upserts, { onConflict: 'key' });
    if (error) { showMsg(error.message, 'error'); return; }
    await refetchSettings();
    showMsg('Configurações salvas com sucesso!');
  };

  const set = (key) => (e) => setForm(p => ({ ...p, [key]: e.target.value }));

  return (
    <form onSubmit={handleSave}>
      {/* Hero */}
      <div className={`glass-panel ${styles.formCard}`}>
        <h2 className={styles.formTitle}><SlidersHorizontal size={18} /> Título Principal (Hero)</h2>
        <div className={styles.gridForm}>
          <div className="input-group" style={{ gridColumn: '1 / -1' }}>
            <label>Texto do Título</label>
            <input value={form.hero_title} onChange={set('hero_title')} placeholder="Bem-vindo à Comunidade" />
          </div>
          <div className="input-group" style={{ gridColumn: '1 / -1' }}>
            <label>Subtítulo</label>
            <input value={form.hero_subtitle} onChange={set('hero_subtitle')} placeholder="O seu caminho para a aprovação começa aqui." />
          </div>
          <div className="input-group">
            <label>Tamanho da fonte — Desktop (rem)</label>
            <input type="number" step="0.1" min="1" max="8" value={form.hero_title_size_desktop} onChange={set('hero_title_size_desktop')} />
            <small style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Padrão: 3rem → atual: {form.hero_title_size_desktop}rem</small>
          </div>
          <div className="input-group">
            <label>Tamanho da fonte — Mobile (rem)</label>
            <input type="number" step="0.1" min="0.8" max="4" value={form.hero_title_size_mobile} onChange={set('hero_title_size_mobile')} />
            <small style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Padrão: 1.75rem → atual: {form.hero_title_size_mobile}rem</small>
          </div>
        </div>
      </div>

      {/* Header Brand */}
      <div className={`glass-panel ${styles.formCard}`}>
        <h2 className={styles.formTitle}><SlidersHorizontal size={18} /> Nome no Header ("Rumo à Aprovação")</h2>
        <div className={styles.gridForm}>
          <div className="input-group" style={{ gridColumn: '1 / -1' }}>
            <label>Texto do Header</label>
            <input value={form.header_brand_text} onChange={set('header_brand_text')} placeholder="Rumo à Aprovação" />
          </div>
          <div className="input-group">
            <label>Tamanho da fonte — Desktop (rem)</label>
            <input type="number" step="0.05" min="0.5" max="3" value={form.header_brand_size_desktop} onChange={set('header_brand_size_desktop')} />
            <small style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Padrão: 1.25rem → atual: {form.header_brand_size_desktop}rem</small>
          </div>
          <div className="input-group">
            <label>Tamanho da fonte — Mobile (rem)</label>
            <input type="number" step="0.05" min="0.5" max="3" value={form.header_brand_size_mobile} onChange={set('header_brand_size_mobile')} />
            <small style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>Padrão: 1rem → atual: {form.header_brand_size_mobile}rem</small>
          </div>
        </div>
      </div>

      {/* Assinatura */}
      <div className={`glass-panel ${styles.formCard}`}>
        <h2 className={styles.formTitle}><SlidersHorizontal size={18} /> Link de Assinatura</h2>
        <div className={styles.gridForm}>
          <div className="input-group" style={{ gridColumn: '1 / -1' }}>
            <label>URL do botão "Assinar agora"</label>
            <input
              value={form.subscribe_url}
              onChange={set('subscribe_url')}
              placeholder="https://pay.hotmart.com/..."
            />
            <small style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
              Cole aqui o link da página de checkout ou vendas. Deixe vazio para redirecionar à tela de cadastro.
            </small>
          </div>
        </div>
      </div>

      <button type="submit" className="btn-primary"><Save size={16} /> Salvar Configurações</button>
    </form>
  );
}

// ────────────────────────────────────────────────
// Admin Principal
// ────────────────────────────────────────────────
export default function Admin() {
  const [activeTab, setActiveTab] = useState('lessons');
  const [message, setMessage] = useState({ text: '', type: '' });

  const showMsg = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 4000);
  };

  return (
    <div className={styles.adminContainer}>
      <Header />

      <main className="container" style={{ paddingTop: '120px', paddingBottom: '4rem' }}>
        <div className={styles.adminHeader}>
          <h1>Painel de Administração</h1>
          <p>Gerencie categorias, aulas e materiais da plataforma.</p>
        </div>

        {message.text && (
          <div className={message.type === 'error' ? styles.errorMsg : styles.successMsg}>
            {message.text}
          </div>
        )}

        <div className={styles.tabs}>
          <button className={`${styles.tabBtn} ${activeTab === 'lessons' ? styles.activeTab : ''}`} onClick={() => setActiveTab('lessons')}>
            Aulas & Vídeos
          </button>
          <button className={`${styles.tabBtn} ${activeTab === 'categories' ? styles.activeTab : ''}`} onClick={() => setActiveTab('categories')}>
            Categorias
          </button>
          <button className={`${styles.tabBtn} ${activeTab === 'settings' ? styles.activeTab : ''}`} onClick={() => setActiveTab('settings')}>
            ⚙️ Configurações
          </button>
        </div>

        {activeTab === 'categories' && <CategoriesSection showMsg={showMsg} />}
        {activeTab === 'lessons' && <LessonsSection showMsg={showMsg} />}
        {activeTab === 'settings' && <SettingsSection showMsg={showMsg} />}
      </main>
    </div>
  );
}
