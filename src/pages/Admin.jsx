import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Header from '../components/Header';
import styles from './Admin.module.css';
import { PlusCircle, Save } from 'lucide-react';

export default function Admin() {
  const [categories, setCategories] = useState([]);
  const [activeTab, setActiveTab] = useState('categories');
  
  // States for new category
  const [catTitle, setCatTitle] = useState('');
  const [catOrder, setCatOrder] = useState('0');
  
  // States for new lesson
  const [lesTitle, setLesTitle] = useState('');
  const [lesCatId, setLesCatId] = useState('');
  const [lesVideoUrl, setLesVideoUrl] = useState('');
  const [lesCoverUrl, setLesCoverUrl] = useState('');
  const [lesSummary, setLesSummary] = useState('');
  const [lesChecklist, setLesChecklist] = useState('');
  const [lesOrder, setLesOrder] = useState('0');

  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    const { data } = await supabase.from('categories').select('*').order('order_index');
    if (data) setCategories(data);
  };

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

  const handleAddCategory = async (e) => {
    e.preventDefault();
    const { error } = await supabase
      .from('categories')
      .insert([{ title: catTitle, order_index: parseInt(catOrder) }]);
      
    if (error) {
      showMessage(error.message, 'error');
    } else {
      showMessage('Categoria adicionada com sucesso!');
      setCatTitle('');
      setCatOrder('0');
      fetchCategories();
    }
  };

  const handleAddLesson = async (e) => {
    e.preventDefault();
    if (!lesCatId) {
      showMessage('Selecione uma categoria.', 'error');
      return;
    }

    const { error } = await supabase
      .from('lessons')
      .insert([{
        category_id: lesCatId,
        title: lesTitle,
        video_url: lesVideoUrl,
        cover_image_url: lesCoverUrl,
        summary: lesSummary,
        checklist: lesChecklist,
        order_index: parseInt(lesOrder)
      }]);

    if (error) {
      showMessage(error.message, 'error');
    } else {
      showMessage('Aula adicionada com sucesso!');
      setLesTitle('');
      setLesVideoUrl('');
      setLesCoverUrl('');
      setLesSummary('');
      setLesChecklist('');
      setLesOrder('0');
    }
  };

  return (
    <div className={styles.adminContainer}>
      <Header />
      
      <main className="container" style={{ paddingTop: '120px' }}>
        <div className={styles.adminHeader}>
          <h1>Painel de Administração</h1>
          <p>Gerencie o conteúdo da sua plataforma.</p>
        </div>

        {message.text && (
          <div className={message.type === 'error' ? styles.errorMsg : styles.successMsg}>
            {message.text}
          </div>
        )}

        <div className={styles.tabs}>
          <button 
            className={`${styles.tabBtn} ${activeTab === 'categories' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('categories')}
          >
            Categorias
          </button>
          <button 
            className={`${styles.tabBtn} ${activeTab === 'lessons' ? styles.activeTab : ''}`}
            onClick={() => setActiveTab('lessons')}
          >
            Aulas / Vídeos
          </button>
        </div>

        <div className={`glass-panel ${styles.panelContent}`}>
          {activeTab === 'categories' && (
            <div className={styles.formSection}>
              <h2><PlusCircle size={20} /> Nova Categoria (Trilha)</h2>
              <form onSubmit={handleAddCategory} className={styles.form}>
                <div className="input-group">
                  <label>Título da Categoria</label>
                  <input 
                    type="text" 
                    value={catTitle} 
                    onChange={e => setCatTitle(e.target.value)} 
                    required 
                    placeholder="Ex: Comece por aqui"
                  />
                </div>
                <div className="input-group">
                  <label>Ordem de Exibição (0, 1, 2...)</label>
                  <input 
                    type="number" 
                    value={catOrder} 
                    onChange={e => setCatOrder(e.target.value)} 
                    required 
                  />
                </div>
                <button type="submit" className="btn-primary">
                  <Save size={18} /> Salvar Categoria
                </button>
              </form>

              <div className={styles.listPreview}>
                <h3>Categorias Atuais:</h3>
                <ul>
                  {categories.map(c => (
                    <li key={c.id}>{c.order_index} - {c.title}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'lessons' && (
            <div className={styles.formSection}>
              <h2><PlusCircle size={20} /> Nova Aula</h2>
              <form onSubmit={handleAddLesson} className={styles.form}>
                <div className="input-group">
                  <label>Categoria</label>
                  <select 
                    value={lesCatId} 
                    onChange={e => setLesCatId(e.target.value)}
                    required
                  >
                    <option value="">Selecione...</option>
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.title}</option>
                    ))}
                  </select>
                </div>
                
                <div className="input-group">
                  <label>Título da Aula</label>
                  <input 
                    type="text" 
                    value={lesTitle} 
                    onChange={e => setLesTitle(e.target.value)} 
                    required 
                    placeholder="Ex: Live 01 - Como começar a estudar"
                  />
                </div>

                <div className="input-group">
                  <label>URL do Vídeo (MP4, YouTube embed, etc)</label>
                  <input 
                    type="url" 
                    value={lesVideoUrl} 
                    onChange={e => setLesVideoUrl(e.target.value)} 
                    placeholder="http://..."
                  />
                </div>

                <div className="input-group">
                  <label>URL da Imagem de Capa (Opcional)</label>
                  <input 
                    type="url" 
                    value={lesCoverUrl} 
                    onChange={e => setLesCoverUrl(e.target.value)} 
                    placeholder="http://..."
                  />
                </div>

                <div className="input-group">
                  <label>Principais Pontos (Resumo escrito, quebras de linha viram parágrafos)</label>
                  <textarea 
                    rows="4" 
                    value={lesSummary} 
                    onChange={e => setLesSummary(e.target.value)}
                  ></textarea>
                </div>

                <div className="input-group">
                  <label>Checklist / O que fazer agora (Comece com traço ex: "- Tarefa 1")</label>
                  <textarea 
                    rows="4" 
                    value={lesChecklist} 
                    onChange={e => setLesChecklist(e.target.value)}
                  ></textarea>
                </div>

                <div className="input-group">
                  <label>Ordem de Exibição</label>
                  <input 
                    type="number" 
                    value={lesOrder} 
                    onChange={e => setLesOrder(e.target.value)} 
                    required 
                  />
                </div>

                <button type="submit" className="btn-primary">
                  <Save size={18} /> Salvar Aula
                </button>
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
