import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Header from '../components/Header';
import styles from './Home.module.css';
import { Play } from 'lucide-react';

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchContent();
  }, []);

  const fetchContent = async () => {
    // Busca categorias
    const { data: catData, error: catError } = await supabase
      .from('categories')
      .select('*')
      .order('order_index', { ascending: true });

    if (catError) {
      console.error(catError);
      setLoading(false);
      return;
    }

    // Busca aulas
    const { data: lesData, error: lesError } = await supabase
      .from('lessons')
      .select('*')
      .order('order_index', { ascending: true });

    if (lesError) {
      console.error(lesError);
      setLoading(false);
      return;
    }

    // Agrupa aulas por categoria
    const categoriesWithLessons = catData.map(cat => ({
      ...cat,
      lessons: lesData.filter(les => les.category_id === cat.id)
    }));

    setCategories(categoriesWithLessons);
    setLoading(false);
  };

  if (loading) {
    return <div className={styles.loading}>Carregando conteúdo...</div>;
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

      {/* Trilhas de Conteúdo */}
      <section className={styles.content}>
        {categories.map(category => (
          category.lessons.length > 0 && (
            <div key={category.id} className={styles.categoryRow}>
              <h3 className={styles.categoryTitle}>{category.title}</h3>
              
              <div className={styles.carouselContainer}>
                <div className={styles.carousel}>
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
                            <Play size={40} className={styles.playIcon} />
                          </div>
                        )}
                        <div className={styles.cardOverlay}>
                          <Play size={48} className={styles.playIconHover} />
                        </div>
                      </div>
                      <div className={styles.cardInfo}>
                        <h4>{lesson.title}</h4>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )
        ))}
        {categories.length === 0 && (
          <div className="container" style={{textAlign: 'center', marginTop: '4rem', color: 'var(--color-text-muted)'}}>
            <p>Nenhum conteúdo disponível no momento.</p>
          </div>
        )}
      </section>
    </div>
  );
}
