import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Header from '../components/Header';
import SubscribeBanner from '../components/SubscribeBanner';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import styles from './Home.module.css';
import { Play, Lock } from 'lucide-react';

export default function Home() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const navigate = useNavigate();
  const { settings } = useSettings();
  const { session, isSubscriber } = useAuth();

  useEffect(() => { fetchContent(); }, []);

  const fetchContent = async () => {
    setLoading(true);
    setFetchError(null);

    const { data: catData, error: catError } = await supabase
      .from('categories')
      .select('*')
      .order('order_index', { ascending: true });

    if (catError) {
      setFetchError(`Erro categorias: ${catError.message}`);
      setLoading(false);
      return;
    }

    const { data: lesData, error: lesError } = await supabase
      .from('lessons')
      .select('*')
      .order('order_index', { ascending: true });

    if (lesError) {
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

  // Determina o tipo de acesso do usuário atual
  const userType = !session ? 'anonymous' : isSubscriber ? 'subscriber' : 'free-user';

  // Determina se uma aula pode ser assistida
  const canWatch = (lesson) => {
    if (userType === 'subscriber') return true;
    if (userType === 'free-user' && lesson.is_free) return true;
    return false;
  };

  // Navegação com controle de acesso
  const handleCardClick = (lesson) => {
    navigate(`/lesson/${lesson.id}`);
  };

  // Helper para tentar descobrir o gênero pelo nome (sem IA)
  const getGender = (name) => {
    if (!name) return 'female';
    const first = name.trim().split(' ')[0].toLowerCase();
    
    const exceptions = {
      'andré': 'male', 'guilherme': 'male', 'filipe': 'male', 'felipe': 'male', 'henrique': 'male',
      'alexandre': 'male', 'jorge': 'male', 'kauã': 'male', 'luca': 'male', 'luigi': 'male',
      'luis': 'male', 'luís': 'male', 'lucas': 'male', 'matheus': 'male', 'mateus': 'male',
      'marcos': 'male', 'thiago': 'male', 'tiago': 'male', 'tomas': 'male', 'tomás': 'male',
      'nicolas': 'male', 'thomas': 'male', 'cauã': 'male', 'jonatas': 'male', 'davi': 'male',
      'gabriel': 'male', 'rafael': 'male', 'daniel': 'male', 'samuel': 'male', 'miguel': 'male',
      'emanuel': 'male', 'ariel': 'male', 'israel': 'male', 'vitor': 'male', 'arthur': 'male',
      'heitor': 'male', 'igor': 'male', 'william': 'male', 'yuri': 'male', 'enzo': 'male',
      'lorenzo': 'male', 'ryan': 'male', 'kauan': 'male', 'jean': 'male', 'luan': 'male',
      'renan': 'male', 'alan': 'male', 'allan': 'male', 'christian': 'male', 'cristian': 'male',
      'kelvin': 'male', 'kevin': 'male', 'nathan': 'male', 'raí': 'male', 'ruan': 'male',
      'yago': 'male', 'iago': 'male', 'caio': 'male', 'diego': 'male',
      // Female exceptions
      'raquel': 'female', 'mabel': 'female', 'hazel': 'female', 'abigail': 'female', 'cleo': 'female',
      'beatriz': 'female', 'inez': 'female', 'inês': 'female', 'elis': 'female', 'lais': 'female',
      'laís': 'female', 'íris': 'female', 'thais': 'female', 'thaís': 'female', 'alice': 'female',
      'clarice': 'female', 'aline': 'female', 'caroline': 'female', 'francine': 'female', 'jaqueline': 'female',
      'michelle': 'female', 'monique': 'female', 'viviane': 'female', 'gisele': 'female', 'ariane': 'female',
      'daiane': 'female', 'rejane': 'female', 'rose': 'female', 'miriam': 'female', 'carmen': 'female',
      'suelen': 'female', 'karen': 'female', 'yasmin': 'female', 'ellen': 'female', 'ester': 'female',
      'ruthe': 'female', 'ruth': 'female'
    };

    if (exceptions[first]) return exceptions[first];
    if (first.endsWith('a')) return 'female';
    return 'male';
  };

  const firstName = userName ? userName.trim().split(' ')[0] : '';
  const gender = getGender(userName);
  
  let dynamicTitle = settings.hero_title || 'Bem-vinda à Comunidade';
  if (gender === 'male') {
    dynamicTitle = dynamicTitle.replace(/Bem-vinda/gi, 'Bem-vindo').replace(/Bem vinda/gi, 'Bem vindo');
  } else {
    dynamicTitle = dynamicTitle.replace(/Bem-vindo/gi, 'Bem-vinda').replace(/Bem vindo/gi, 'Bem vinda');
  }

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
          {firstName && (
            <div style={{ color: 'var(--color-gold)', fontSize: '1.2rem', fontWeight: 600, marginBottom: '0.5rem' }}>
              Olá, {firstName}!
            </div>
          )}
          <h1
            style={{
              '--hero-size-desktop': `${settings.hero_title_size_desktop}rem`,
              '--hero-size-mobile': `${settings.hero_title_size_mobile}rem`,
            }}
            className={styles.heroTitle}
          >
            {dynamicTitle}
          </h1>
          <p>{settings.hero_subtitle}</p>

          {/* CTA para visitantes anônimos */}
          {userType === 'anonymous' && (
            <div className={styles.heroCta}>
              <button className={styles.heroCtaBtn} onClick={() => navigate('/login#criar-conta')}>
                ✦ Criar conta gratuita
              </button>
              <button className={styles.heroCtaSecondary} onClick={() => navigate('/login')}>
                Já tenho conta
              </button>
            </div>
          )}
        </div>
      </section>

      {fetchError && (
        <div className="container" style={{ padding: '1rem', background: 'rgba(239,68,68,0.15)', borderRadius: 8, margin: '1rem auto', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>
          ⚠️ {fetchError}
        </div>
      )}

      {/* Trilhas de Conteúdo */}
      <section className={styles.content} style={{ paddingBottom: session && !isSubscriber ? '5rem' : '2rem' }}>
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
                {category.lessons.map(lesson => {
                  const accessible = canWatch(lesson);
                  const isFree = lesson.is_free;
                  const isLocked = !accessible;

                  return (
                    <div
                      key={lesson.id}
                      className={`${styles.card} ${isLocked ? styles.cardLocked : ''}`}
                      onClick={() => handleCardClick(lesson)}
                    >
                      <div className={styles.cardImageContainer}>
                        {lesson.cover_image_url ? (
                          <img src={lesson.cover_image_url} alt={lesson.title} className={styles.cardImage} />
                        ) : (
                          <div className={styles.cardPlaceholder}>
                            <Play size={40} />
                          </div>
                        )}

                        {/* Badge GRATUITA */}
                        {isFree && (
                          <span className={styles.badgeFree}>GRATUITA</span>
                        )}

                        {/* Overlay de cadeado para conteúdo bloqueado */}
                        {isLocked ? (
                          <div className={styles.cardOverlayLocked}>
                            <div className={styles.lockIcon}>
                              <Lock size={28} />
                            </div>
                          </div>
                        ) : (
                          <div className={styles.cardOverlay}>
                            <div className={styles.playBtn}>
                              <Play size={28} fill="currentColor" />
                            </div>
                          </div>
                        )}
                      </div>

                      <div className={styles.cardInfo}>
                        <h4>{lesson.title}</h4>
                        {lesson.summary && <p>{lesson.summary}</p>}
                        {isLocked && (
                          <span className={styles.lockedLabel}>
                            🔒 {userType === 'anonymous' ? 'Faça login ou assine' : 'Exclusivo para assinantes'}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </section>

      {/* Banner de upgrade para usuários logados sem assinatura */}
      {session && !isSubscriber && <SubscribeBanner />}
    </div>
  );
}
