import styles from './SkeletonCard.module.css';

export default function SkeletonCard({ height = '120px', width = '100%' }) {
  return (
    <div className={styles.skeleton} style={{ height, width }} />
  );
}
