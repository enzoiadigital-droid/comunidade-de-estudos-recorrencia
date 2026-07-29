import { useState, useEffect } from 'react';
import Modal from '../../Modal';

export default function FinishSessionModal({ isOpen, onClose, onFinish, sessionData }) {
  const [goalStatus, setGoalStatus] = useState('Concluído');
  const [focusLevel, setFocusLevel] = useState('Alto');
  const [notes, setNotes] = useState('');
  
  // Condicionais
  const [questionsTotal, setQuestionsTotal] = useState('');
  const [questionsCorrect, setQuestionsCorrect] = useState('');
  const [isRedacaoConcluded, setIsRedacaoConcluded] = useState(true);

  // Reseta estado quando abre
  useEffect(() => {
    if (isOpen) {
      setGoalStatus('Concluído');
      setFocusLevel('Alto');
      setNotes('');
      setQuestionsTotal('');
      setQuestionsCorrect('');
      setIsRedacaoConcluded(true);
    }
  }, [isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const payload = {
      goalStatus,
      focusLevel,
      notes
    };

    if (sessionData?.studyType === 'Questões' || sessionData?.studyType === 'Simulado') {
      const total = parseInt(questionsTotal) || 0;
      const correct = parseInt(questionsCorrect) || 0;
      const actualCorrect = Math.min(total, correct);
      const wrong = total - actualCorrect;
      const accuracy = total > 0 ? ((actualCorrect / total) * 100).toFixed(2) : 0;
      
      payload.questionsTotal = total;
      payload.questionsCorrect = actualCorrect;
      payload.questionsWrong = wrong;
      payload.accuracyRate = accuracy;
    } else if (sessionData?.studyType === 'Redação') {
      // Usaremos o notes ou um status especial para indicar que a redação foi concluída
      payload.goalStatus = isRedacaoConcluded ? 'Concluído' : 'Não concluído';
    }

    onFinish(payload);
  };

  const isQuestionsType = sessionData?.studyType === 'Questões' || sessionData?.studyType === 'Simulado';
  const isEssayType = sessionData?.studyType === 'Redação';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Finalizar Sessão" maxWidth="500px">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        
        {sessionData?.goal && !isEssayType && (
          <div>
            <label style={{ display: 'block', color: 'var(--color-text)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
              Status do Objetivo ("{sessionData.goal}")
            </label>
            <select 
              value={goalStatus}
              onChange={(e) => setGoalStatus(e.target.value)}
              style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'rgba(0,0,0,0.2)', color: 'var(--color-text)' }}
            >
              <option value="Concluído" style={{background: '#1a2234'}}>Concluído</option>
              <option value="Parcialmente concluído" style={{background: '#1a2234'}}>Parcialmente concluído</option>
              <option value="Não concluído" style={{background: '#1a2234'}}>Não concluído</option>
            </select>
          </div>
        )}

        <div>
          <label style={{ display: 'block', color: 'var(--color-text)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
            Nível de Foco
          </label>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {['Baixo', 'Médio', 'Alto'].map(level => (
              <label key={level} style={{ 
                flex: 1, 
                padding: '0.75rem', 
                textAlign: 'center', 
                background: focusLevel === level ? 'rgba(212, 175, 55, 0.1)' : 'rgba(0,0,0,0.2)',
                border: `1px solid ${focusLevel === level ? 'var(--color-gold)' : 'var(--color-border)'}`,
                borderRadius: '8px',
                cursor: 'pointer',
                color: focusLevel === level ? 'var(--color-gold)' : 'var(--color-text)'
              }}>
                <input 
                  type="radio" 
                  name="focusLevel" 
                  value={level} 
                  checked={focusLevel === level}
                  onChange={(e) => setFocusLevel(e.target.value)}
                  style={{ display: 'none' }}
                />
                {level}
              </label>
            ))}
          </div>
        </div>

        {isQuestionsType && (
          <div style={{ display: 'flex', gap: '1rem' }}>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', color: 'var(--color-text)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                Total de Questões
              </label>
              <input 
                type="number" 
                min="0"
                value={questionsTotal}
                onChange={(e) => setQuestionsTotal(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'rgba(0,0,0,0.2)', color: 'var(--color-text)' }}
                required
              />
            </div>
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', color: 'var(--color-text)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                Acertos
              </label>
              <input 
                type="number" 
                min="0"
                max={questionsTotal || 1000}
                value={questionsCorrect}
                onChange={(e) => setQuestionsCorrect(e.target.value)}
                style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'rgba(0,0,0,0.2)', color: 'var(--color-text)' }}
                required
              />
            </div>
          </div>
        )}

        {isEssayType && (
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text)', cursor: 'pointer' }}>
              <input 
                type="checkbox" 
                checked={isRedacaoConcluded}
                onChange={(e) => setIsRedacaoConcluded(e.target.checked)}
                style={{ width: '18px', height: '18px', accentColor: 'var(--color-gold)' }}
              />
              Conseguiu concluir a redação?
            </label>
          </div>
        )}

        <div>
          <label style={{ display: 'block', color: 'var(--color-text)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
            Observações (opcional)
          </label>
          <textarea 
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Anotações sobre a sessão..."
            rows={3}
            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'rgba(0,0,0,0.2)', color: 'var(--color-text)', resize: 'vertical' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
          <button 
            type="submit"
            style={{ padding: '0.6rem 1.5rem', background: 'var(--color-gold)', color: '#000', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer', width: '100%' }}
          >
            Salvar e Finalizar
          </button>
        </div>
      </form>
    </Modal>
  );
}
