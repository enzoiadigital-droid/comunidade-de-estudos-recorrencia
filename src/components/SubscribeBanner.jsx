import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, X } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import styles from './SubscribeBanner.module.css';

export default function SubscribeBanner() {
  const [dismissed, setDismissed] = useState(false);
  const { settings } = useSettings();
  const navigate = useNavigate();

  if (dismissed) return null;

  const subscribeUrl = settings.subscribe_url;

  const handleSubscribe = () => {
    if (subscribeUrl) {
      window.open(subscribeUrl, '_blank');
    } else {
      navigate('/login');
    }
  };

  return (
    <div className={styles.banner}>
      <div className={styles.content}>
        <Zap size={18} className={styles.icon} />
        <span>
          Você está no <strong>plano gratuito</strong>. Desbloqueie todas as aulas e conteúdos premium!
        </span>
      </div>
      <div className={styles.actions}>
        <button className={styles.btnSubscribe} onClick={handleSubscribe}>
          Assinar agora ✦
        </button>
        <button className={styles.btnDismiss} onClick={() => setDismissed(true)} aria-label="Fechar">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}
