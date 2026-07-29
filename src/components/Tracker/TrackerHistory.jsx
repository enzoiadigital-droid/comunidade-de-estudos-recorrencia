import { useState } from 'react';
import { MoreVertical, Trash2, Edit2, RotateCcw, Eye, Clock, Calendar, ChevronDown } from 'lucide-react';
import styles from './TrackerHistory.module.css';

const PAGE_SIZE = 10;

function formatDuration(minutes) {
  if (!minutes) return '0m';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
}

function ResultBadge({ session }) {
  if ((session.study_type === 'Questões' || session.study_type === 'Simulado') && session.questions_total) {
    const pct = session.accuracy_rate ? Number(session.accuracy_rate).toFixed(0) : 0;
    return (
      <span className={styles.resultBadge}>
        {session.questions_correct}/{session.questions_total} questões · {pct}% acerto
      </span>
    );
  }
  if (session.goal_status) {
    const cls = session.goal_status === 'Concluído' ? styles.resultDone : session.goal_status === 'Parcialmente concluído' ? styles.resultPartial : styles.resultFail;
    return <span className={`${styles.resultBadge} ${cls}`}>{session.goal_status}</span>;
  }
  return null;
}

function FocusDot({ level }) {
  const map = { 'Alto': '#22c55e', 'Médio': '#f59e0b', 'Baixo': '#ef4444' };
  return <span style={{ display:'inline-block', width:8, height:8, borderRadius:'50%', background: map[level] || '#888', marginRight: 4 }} />;
}

function SessionMenu({ session, onView, onEdit, onDelete, onRepeat }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={styles.menuWrapper}>
      <button className={styles.menuBtn} onClick={() => setOpen(o => !o)}><MoreVertical size={16} /></button>
      {open && (
        <>
          <div className={styles.menuBackdrop} onClick={() => setOpen(false)} />
          <div className={styles.menu}>
            <button onClick={() => { setOpen(false); onView(session); }}><Eye size={14} /> Ver detalhes</button>
            <button onClick={() => { setOpen(false); onEdit(session); }}><Edit2 size={14} /> Editar</button>
            <button onClick={() => { setOpen(false); onRepeat(session); }}><RotateCcw size={14} /> Repetir sessão</button>
            <button onClick={() => { setOpen(false); onDelete(session); }} className={styles.menuDeleteBtn}><Trash2 size={14} /> Excluir</button>
          </div>
        </>
      )}
    </div>
  );
}

function ViewDetailsModal({ session, onClose }) {
  if (!session) return null;
  return (
    <div className={styles.detailsOverlay} onClick={onClose}>
      <div className={styles.detailsModal} onClick={e => e.stopPropagation()}>
        <h3>{session.subject}</h3>
        <div className={styles.detailGrid}>
          <span>Tipo</span><span>{session.study_type}</span>
          {session.topic && <><span>Assunto</span><span>{session.topic}</span></>}
          {session.goal && <><span>Objetivo</span><span>{session.goal}</span></>}
          <span>Data</span><span>{formatDate(session.session_date)}</span>
          <span>Duração</span><span>{formatDuration(session.duration_minutes)}</span>
          {session.goal_status && <><span>Status</span><span>{session.goal_status}</span></>}
          {session.focus_level && <><span>Foco</span><span>{session.focus_level}</span></>}
          {session.questions_total != null && <>
            <span>Questões</span><span>{session.questions_correct}/{session.questions_total} ({Number(session.accuracy_rate).toFixed(0)}% acerto)</span>
          </>}
          {session.notes && <><span>Obs</span><span>{session.notes}</span></>}
        </div>
        <button className={styles.detailsClose} onClick={onClose}>Fechar</button>
      </div>
    </div>
  );
}

export default function TrackerHistory({
  sessions,
  loading,
  onEdit,
  onDelete,
  onRepeat,
}) {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('');
  const [filterPeriod, setFilterPeriod] = useState('');
  const [page, setPage] = useState(1);
  const [viewSession, setViewSession] = useState(null);

  const filtered = sessions.filter(s => {
    if (search && !s.subject.toLowerCase().includes(search.toLowerCase()) && 
        !(s.topic || '').toLowerCase().includes(search.toLowerCase())) return false;
    if (filterType && s.study_type !== filterType) return false;
    if (filterPeriod) {
      const today = new Date();
      const sDate = new Date(s.session_date);
      if (filterPeriod === '7d') {
        const limit = new Date(); limit.setDate(today.getDate() - 7);
        if (sDate < limit) return false;
      } else if (filterPeriod === '30d') {
        const limit = new Date(); limit.setDate(today.getDate() - 30);
        if (sDate < limit) return false;
      }
    }
    return true;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = page < totalPages;

  const studyTypes = [...new Set(sessions.map(s => s.study_type))];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Histórico de Sessões</h2>
      </div>

      {/* Filtros */}
      <div className={styles.filters}>
        <input 
          type="text"
          placeholder="Buscar matéria ou assunto..."
          value={search}
          onChange={e => { setSearch(e.target.value); setPage(1); }}
          className={styles.searchInput}
        />
        <div className={styles.selectWrapper}>
          <select value={filterType} onChange={e => { setFilterType(e.target.value); setPage(1); }} className={styles.filterSelect}>
            <option value="" style={{background: '#1a2234'}}>Todos os tipos</option>
            {studyTypes.map(t => <option key={t} value={t} style={{background: '#1a2234'}}>{t}</option>)}
          </select>
          <ChevronDown size={16} className={styles.selectIcon} />
        </div>
        <div className={styles.selectWrapper}>
          <select value={filterPeriod} onChange={e => { setFilterPeriod(e.target.value); setPage(1); }} className={styles.filterSelect}>
            <option value="" style={{background: '#1a2234'}}>Todo período</option>
            <option value="7d" style={{background: '#1a2234'}}>Últimos 7 dias</option>
            <option value="30d" style={{background: '#1a2234'}}>Últimos 30 dias</option>
          </select>
          <ChevronDown size={16} className={styles.selectIcon} />
        </div>
        {(search || filterType || filterPeriod) && (
          <button className={styles.clearBtn} onClick={() => { setSearch(''); setFilterType(''); setFilterPeriod(''); setPage(1); }}>
            Limpar filtros
          </button>
        )}
      </div>

      {/* Lista */}
      {loading ? (
        <div className={styles.skeletonList}>
          {[1,2,3].map(i => <div key={i} className={styles.skeleton} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className={styles.empty}>
          <Clock size={40} />
          <p>Nenhuma sessão encontrada.</p>
          {sessions.length === 0 && <p className={styles.emptyHint}>Registre seu primeiro estudo usando o cronômetro acima!</p>}
        </div>
      ) : (
        <>
          <ul className={styles.list}>
            {paginated.map(session => (
              <li key={session.id} className={styles.item}>
                <div className={styles.itemLeft}>
                  <div className={styles.itemTop}>
                    <span className={styles.itemSubject}>{session.subject}</span>
                    <span className={styles.itemType}>{session.study_type}</span>
                  </div>
                  {session.topic && <span className={styles.itemTopic}>{session.topic}</span>}
                  <div className={styles.itemMeta}>
                    <span><Calendar size={13} /> {formatDate(session.session_date)}</span>
                    <span><Clock size={13} /> {formatDuration(session.duration_minutes)}</span>
                    {session.focus_level && <span><FocusDot level={session.focus_level} />{session.focus_level}</span>}
                  </div>
                  <ResultBadge session={session} />
                </div>
                <SessionMenu
                  session={session}
                  onView={s => setViewSession(s)}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  onRepeat={onRepeat}
                />
              </li>
            ))}
          </ul>
          {hasMore && (
            <button className={styles.loadMoreBtn} onClick={() => setPage(p => p + 1)}>
              Carregar mais ({filtered.length - paginated.length} restantes)
            </button>
          )}
        </>
      )}

      <ViewDetailsModal session={viewSession} onClose={() => setViewSession(null)} />
    </div>
  );
}
