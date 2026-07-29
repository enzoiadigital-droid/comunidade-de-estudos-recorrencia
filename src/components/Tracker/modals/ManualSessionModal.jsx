import { useState, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import Modal from '../../Modal';

const STUDY_TYPES = [
  'Aula', 'Teoria', 'Questões', 'Revisão', 
  'Flashcards', 'Redação', 'Simulado', 'Outro'
];

export default function ManualSessionModal({ isOpen, onClose, onSave, initialData = null }) {
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [studyType, setStudyType] = useState('Aula');
  const [goal, setGoal] = useState('');
  
  const [date, setDate] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('');
  
  const [goalStatus, setGoalStatus] = useState('Concluído');
  const [focusLevel, setFocusLevel] = useState('Alto');
  const [notes, setNotes] = useState('');
  
  const [questionsTotal, setQuestionsTotal] = useState('');
  const [questionsCorrect, setQuestionsCorrect] = useState('');
  const [isRedacaoConcluded, setIsRedacaoConcluded] = useState(true);

  // Preenche dados se for edição
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setSubject(initialData.subject || '');
        setTopic(initialData.topic || '');
        setStudyType(initialData.study_type || 'Aula');
        setGoal(initialData.goal || '');
        setDate(initialData.session_date || new Date().toISOString().split('T')[0]);
        setDurationMinutes(initialData.duration_minutes || '');
        setGoalStatus(initialData.goal_status || 'Concluído');
        setFocusLevel(initialData.focus_level || 'Alto');
        setNotes(initialData.notes || '');
        setQuestionsTotal(initialData.questions_total || '');
        setQuestionsCorrect(initialData.questions_correct || '');
        setIsRedacaoConcluded(initialData.goal_status === 'Concluído');
      } else {
        setSubject('');
        setTopic('');
        setStudyType('Aula');
        setGoal('');
        setDate(new Date().toISOString().split('T')[0]);
        setDurationMinutes('');
        setGoalStatus('Concluído');
        setFocusLevel('Alto');
        setNotes('');
        setQuestionsTotal('');
        setQuestionsCorrect('');
        setIsRedacaoConcluded(true);
      }
    }
  }, [isOpen, initialData]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const payload = {
      subject,
      topic,
      studyType,
      goal,
      date,
      durationMinutes: parseInt(durationMinutes) || 0,
      goalStatus,
      focusLevel,
      notes,
      isManual: true
    };

    if (studyType === 'Questões' || studyType === 'Simulado') {
      const total = parseInt(questionsTotal) || 0;
      const correct = parseInt(questionsCorrect) || 0;
      const actualCorrect = Math.min(total, correct);
      
      payload.questionsTotal = total;
      payload.questionsCorrect = actualCorrect;
      payload.questionsWrong = total - actualCorrect;
      payload.accuracyRate = total > 0 ? ((actualCorrect / total) * 100).toFixed(2) : 0;
    } else if (studyType === 'Redação') {
      payload.goalStatus = isRedacaoConcluded ? 'Concluído' : 'Não concluído';
    } else {
      payload.questionsTotal = null;
      payload.questionsCorrect = null;
      payload.questionsWrong = null;
      payload.accuracyRate = null;
    }

    if (initialData && initialData.id) {
      payload.id = initialData.id;
    }

    onSave(payload);
  };

  const isQuestionsType = studyType === 'Questões' || studyType === 'Simulado';
  const isEssayType = studyType === 'Redação';
  const isEditing = !!initialData;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isEditing ? "Editar Sessão" : "Registro Manual de Estudo"} maxWidth="550px">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        
        {/* Info Básica */}
        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', color: 'var(--color-text)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Data *</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} required style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'rgba(0,0,0,0.2)', color: 'var(--color-text)', colorScheme: 'dark' }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', color: 'var(--color-text)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Duração (min) *</label>
            <input type="number" min="1" value={durationMinutes} onChange={(e) => setDurationMinutes(e.target.value)} required style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'rgba(0,0,0,0.2)', color: 'var(--color-text)' }} />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', color: 'var(--color-text)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Matéria *</label>
            <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} required style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'rgba(0,0,0,0.2)', color: 'var(--color-text)' }} />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', color: 'var(--color-text)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Tipo *</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <select value={studyType} onChange={(e) => setStudyType(e.target.value)} required style={{ width: '100%', padding: '0.75rem', paddingRight: '2.5rem', appearance: 'none', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'rgba(0,0,0,0.2)', color: 'var(--color-text)' }}>
                {STUDY_TYPES.map(type => <option key={type} value={type} style={{background: '#1a2234'}}>{type}</option>)}
              </select>
              <ChevronDown size={16} style={{ position: 'absolute', right: '12px', pointerEvents: 'none', color: 'var(--color-text)' }} />
            </div>
          </div>
        </div>

        <div>
          <label style={{ display: 'block', color: 'var(--color-text)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Assunto (opcional)</label>
          <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'rgba(0,0,0,0.2)', color: 'var(--color-text)' }} />
        </div>

        <div>
          <label style={{ display: 'block', color: 'var(--color-text)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Objetivo (opcional)</label>
          <input type="text" value={goal} onChange={(e) => setGoal(e.target.value)} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'rgba(0,0,0,0.2)', color: 'var(--color-text)' }} />
        </div>

        {/* Avaliação */}
        <hr style={{ border: 'none', borderTop: '1px dashed var(--color-border)', margin: '0.5rem 0' }} />

        {goal && !isEssayType && (
          <div>
            <label style={{ display: 'block', color: 'var(--color-text)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Status do Objetivo</label>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <select value={goalStatus} onChange={(e) => setGoalStatus(e.target.value)} style={{ width: '100%', padding: '0.75rem', paddingRight: '2.5rem', appearance: 'none', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'rgba(0,0,0,0.2)', color: 'var(--color-text)' }}>
                <option value="Concluído" style={{background: '#1a2234'}}>Concluído</option>
                <option value="Parcialmente concluído" style={{background: '#1a2234'}}>Parcialmente concluído</option>
                <option value="Não concluído" style={{background: '#1a2234'}}>Não concluído</option>
              </select>
              <ChevronDown size={16} style={{ position: 'absolute', right: '12px', pointerEvents: 'none', color: 'var(--color-text)' }} />
            </div>
          </div>
        )}

        <div>
          <label style={{ display: 'block', color: 'var(--color-text)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Nível de Foco</label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {['Baixo', 'Médio', 'Alto'].map(level => (
              <label key={level} style={{ flex: 1, padding: '0.6rem', textAlign: 'center', background: focusLevel === level ? 'rgba(212, 175, 55, 0.1)' : 'rgba(0,0,0,0.2)', border: `1px solid ${focusLevel === level ? 'var(--color-gold)' : 'var(--color-border)'}`, borderRadius: '8px', cursor: 'pointer', color: focusLevel === level ? 'var(--color-gold)' : 'var(--color-text)' }}>
                <input type="radio" name="focusLevel" value={level} checked={focusLevel === level} onChange={(e) => setFocusLevel(e.target.value)} style={{ display: 'none' }} />
                {level}
              </label>
            ))}
          </div>
        </div>

        {isQuestionsType && (
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', color: 'var(--color-text)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Total Questões</label>
              <input type="number" min="0" value={questionsTotal} onChange={(e) => setQuestionsTotal(e.target.value)} required style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'rgba(0,0,0,0.2)', color: 'var(--color-text)' }} />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', color: 'var(--color-text)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Acertos</label>
              <input type="number" min="0" max={questionsTotal || 1000} value={questionsCorrect} onChange={(e) => setQuestionsCorrect(e.target.value)} required style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'rgba(0,0,0,0.2)', color: 'var(--color-text)' }} />
            </div>
          </div>
        )}

        {isEssayType && (
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text)', cursor: 'pointer' }}>
              <input type="checkbox" checked={isRedacaoConcluded} onChange={(e) => setIsRedacaoConcluded(e.target.checked)} style={{ width: '18px', height: '18px', accentColor: 'var(--color-gold)' }} />
              Conseguiu concluir a redação?
            </label>
          </div>
        )}

        <div>
          <label style={{ display: 'block', color: 'var(--color-text)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>Observações</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'rgba(0,0,0,0.2)', color: 'var(--color-text)', resize: 'vertical' }} />
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
          <button type="button" onClick={onClose} style={{ padding: '0.5rem 1rem', background: 'transparent', color: 'var(--color-text)', border: 'none', cursor: 'pointer' }}>Cancelar</button>
          <button type="submit" style={{ padding: '0.6rem 1.5rem', background: 'var(--color-gold)', color: '#000', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}>Salvar Sessão</button>
        </div>
      </form>
    </Modal>
  );
}
