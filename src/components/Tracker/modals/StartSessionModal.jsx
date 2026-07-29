import { useState } from 'react';
import Modal from '../../Modal';

const STUDY_TYPES = [
  'Aula', 'Teoria', 'Questões', 'Revisão', 
  'Flashcards', 'Redação', 'Simulado', 'Outro'
];

export default function StartSessionModal({ isOpen, onClose, onStart }) {
  const [subject, setSubject] = useState('');
  const [topic, setTopic] = useState('');
  const [studyType, setStudyType] = useState('Aula');
  const [goal, setGoal] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onStart({ subject, topic, studyType, goal });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Iniciar Sessão de Estudo" maxWidth="500px">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        
        <div>
          <label style={{ display: 'block', color: 'var(--color-text)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
            Matéria *
          </label>
          <input 
            type="text" 
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Ex: Matemática"
            required
            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'rgba(0,0,0,0.2)', color: 'var(--color-text)' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', color: 'var(--color-text)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
            Assunto (opcional)
          </label>
          <input 
            type="text" 
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="Ex: Funções de 1º Grau"
            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'rgba(0,0,0,0.2)', color: 'var(--color-text)' }}
          />
        </div>

        <div>
          <label style={{ display: 'block', color: 'var(--color-text)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
            Tipo de Estudo *
          </label>
          <select 
            value={studyType}
            onChange={(e) => setStudyType(e.target.value)}
            required
            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'rgba(0,0,0,0.2)', color: 'var(--color-text)' }}
          >
            {STUDY_TYPES.map(type => (
              <option key={type} value={type} style={{ background: '#1a2234' }}>{type}</option>
            ))}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', color: 'var(--color-text)', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
            Objetivo (opcional)
          </label>
          <input 
            type="text" 
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder="Ex: Resolver 30 questões"
            style={{ width: '100%', padding: '0.75rem', borderRadius: '8px', border: '1px solid var(--color-border)', background: 'rgba(0,0,0,0.2)', color: 'var(--color-text)' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
          <button 
            type="button" 
            onClick={onClose}
            style={{ padding: '0.5rem 1rem', background: 'transparent', color: 'var(--color-text)', border: 'none', cursor: 'pointer' }}
          >
            Cancelar
          </button>
          <button 
            type="submit"
            style={{ padding: '0.6rem 1.5rem', background: 'var(--color-gold)', color: '#000', border: 'none', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
          >
            Iniciar Cronômetro
          </button>
        </div>
      </form>
    </Modal>
  );
}
