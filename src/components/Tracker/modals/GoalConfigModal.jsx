import { useState } from 'react';
import Modal from '../../Modal';
import { supabase } from '../../../lib/supabase';

export default function GoalConfigModal({ isOpen, onClose, currentGoal, onGoalUpdated, session }) {
  const [goalHours, setGoalHours] = useState(currentGoal || 10);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase
        .from('study_goals')
        .upsert({ user_id: session.user.id, weekly_goal_hours: goalHours }, { onConflict: 'user_id' })
        .select()
        .single();
      
      if (!error && data) {
        onGoalUpdated(data.weekly_goal_hours);
        onClose();
      }
    } catch (err) {
      console.error('Erro ao salvar meta:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Configurar Tracker" maxWidth="400px">
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ display: 'block', color: 'var(--color-text)', marginBottom: '0.5rem', fontWeight: 500 }}>
            Meta Semanal (Horas)
          </label>
          <input 
            type="number" 
            min="1" 
            max="168"
            value={goalHours}
            onChange={(e) => setGoalHours(Number(e.target.value))}
            style={{
              width: '100%',
              padding: '0.75rem',
              borderRadius: '8px',
              border: '1px solid var(--color-border)',
              background: 'rgba(0,0,0,0.2)',
              color: 'var(--color-text)',
              fontSize: '1rem'
            }}
            required
          />
          <p style={{ color: 'var(--color-text-muted)', fontSize: '0.85rem', marginTop: '0.5rem' }}>
            Defina quantas horas por semana você deseja se dedicar aos estudos.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
          <button 
            type="button" 
            onClick={onClose}
            style={{ padding: '0.5rem 1rem', background: 'transparent', color: 'var(--color-text)', border: 'none', cursor: 'pointer' }}
            disabled={loading}
          >
            Cancelar
          </button>
          <button 
            type="submit"
            style={{ padding: '0.5rem 1.5rem', background: 'var(--color-gold)', color: '#000', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
            disabled={loading}
          >
            {loading ? 'Salvando...' : 'Salvar Meta'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
