import { Clock } from 'lucide-react';
import styles from './ComingSoon.module.css';

export default function ComingSoon({ title }) {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.iconWrapper}>
          <Clock size={48} className={styles.icon} />
        </div>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.subtitle}>
          Estamos trabalhando duro para trazer essa funcionalidade para você.
          Em breve, essa área estará disponível!
        </p>
      </div>
    </div>
  );
}
