import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Header from '../components/Header';
import styles from './Home.module.css';
import { Play } from 'lucide-react';

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    setLoading(true);
    setFetchError(null);

    const { data: catData, error: catError } = await supabase
      .from('categories')
      .select('*')
      .order('order_index', { ascending: true });

    if (catError) {
      console.error('Erro ao buscar categorias:', catError);
      setFetchError(`Erro categorias: ${catError.message}`);
      setLoading(false);
      return;
    }

    const { data: lesData, error: lesError } = await supabase
      .from('lessons')
      .select('*')
      .order('order_index', { ascending: true });

    if (lesError) {
      console.error('Erro ao buscar aulas:', lesError);
      setFetchError(`Erro aulas: ${lesError.message}`);
      setLoading(false);
      return;
    }

    const categoriesWithLessons = (catData || []).map(cat => ({
      ...cat,
      lessons: (lesData || []).filter(les => les.category_id === cat.id)
    }));

    setCategories(categoriesWithLessons);
    setLoading(false);
  };

  if (loading) {
    return (
      <div className={styles.loading}>
        <div className={styles.spinner}></div>
        <span>Carregando conteúdo...</span>
      </div>
    );
  }

  return (
    <div className={styles.homeContainer}>
      <Header />

      {/* Hero Section */}
      <section className={styles.hero}>
        <div className={`container ${styles.heroContent}`}>
          <h1>Bem-vinda à Comunidade</h1>
          <p>O seu caminho para a aprovação começa aqui.</p>
        </div>
      </section>

      {/* Debug error */}
      {fetchError && (
        <div className="container" style={{ padding: '1rem', background: 'rgba(239,68,68,0.15)', borderRadius: 8, margin: '1rem auto', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>
          ⚠️ {fetchError}
        </div>
      )}

      {/* Trilhas de Conteúdo */}
      <section className={styles.content}>
        {categories.length === 0 && !fetchError && (
          <div className="container" style={{ textAlign: 'center', marginTop: '4rem', color: 'var(--color-text-muted)' }}>
            <p>Nenhum conteúdo disponível no momento.</p>
          </div>
        )}

        {categories.map(category => (
          <div key={category.id} className={styles.categoryRow}>
            <div className="container">
              <h3 className={styles.categoryTitle}>{category.title}</h3>
            </div>

            <div className={styles.carouselWrapper}>
              <div className={styles.carousel}>
                {category.lessons.length === 0 && (
                  <p style={{ color: 'var(--color-text-muted)', padding: '1rem 2rem' }}>Nenhuma aula nesta trilha ainda.</p>
                )}
                {category.lessons.map(lesson => (
                  <div
                    key={lesson.id}
                    className={styles.card}
                    onClick={() => navigate(`/lesson/${lesson.id}`)}
                  >
                    <div className={styles.cardImageContainer}>
                      {lesson.cover_image_url ? (
                        <img src={lesson.cover_image_url} alt={lesson.title} className={styles.cardImage} />
                      ) : (
                        <div className={styles.cardPlaceholder}>
                          <Play size={40} />
                        </div>
                      )}
                      <div className={styles.cardOverlay}>
                        <div className={styles.playBtn}>
                          <Play size={28} fill="currentColor" />
                        </div>
                      </div>
                    </div>
                    <div className={styles.cardInfo}>
                      <h4>{lesson.title}</h4>
                      {lesson.summary && <p>{lesson.summary}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
