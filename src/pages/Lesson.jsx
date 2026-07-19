import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Header from '../components/Header';
import SubscribeBanner from '../components/SubscribeBanner';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import styles from './Lesson.module.css';
import { ArrowLeft, Download, CheckCircle2, FileText, LayoutList, Lock, Sparkles, LogIn } from 'lucide-react';

// ── Gate: Acesso negado para anônimos em aula gratuita ──────────────────
function FreeAccessGate({ lesson, navigate }) {
  return (
    <div className={styles.accessGate}>
      {lesson.cover_image_url && (
        <div className={styles.gateCover}>
          <img src={lesson.cover_image_url} alt={lesson.title} />
          <div className={styles.gateCoverOverlay} />
        </div>
      )}
      <div className={styles.gateContent}>
        <div className={styles.gateIcon}><Sparkles size={32} /></div>
        <h2>Esta aula é gratuita! 🎉</h2>
        <p>Crie sua conta gratuitamente para assistir a esta aula e ter acesso ao conteúdo liberado.</p>
        <div className={styles.gateActions}>
          <button className={styles.gateBtnPrimary} onClick={() => navigate('/login#criar-conta')}>
            Criar conta gratuita
          </button>
          <button className={styles.gateBtnSecondary} onClick={() => navigate('/login')}>
            <LogIn size={16} /> Já tenho conta
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Gate: Conteúdo premium bloqueado ────────────────────────────────────
function PremiumAccessGate({ lesson, navigate, settings, isLoggedIn }) {
  const subscribeUrl = settings.subscribe_url;

  const handleSubscribe = () => {
    if (subscribeUrl) window.open(subscribeUrl, '_blank');
    else navigate('/login#criar-conta');
  };

  return (
    <div className={styles.accessGate}>
      {lesson.cover_image_url && (
        <div className={styles.gateCover}>
          <img src={lesson.cover_image_url} alt={lesson.title} />
          <div className={styles.gateCoverOverlay} />
        </div>
      )}
      <div className={styles.gateContent}>
        <div className={`${styles.gateIcon} ${styles.gateIconLock}`}><Lock size={32} /></div>
        <h2>Conteúdo exclusivo para assinantes</h2>
        <p>Esta aula faz parte do conteúdo premium. Assine e tenha acesso ilimitado a todas as aulas e materiais.</p>
        <div className={styles.gateActions}>
          <button className={styles.gateBtnPrimary} onClick={handleSubscribe}>
            ✦ Assinar agora
          </button>
          {!isLoggedIn && (
            <button className={styles.gateBtnSecondary} onClick={() => navigate('/login')}>
              <LogIn size={16} /> Já sou assinante
            </button>
          )}
        </div>
        {isLoggedIn && (
          <p className={styles.gateNote}>
            Você está logado mas sua conta ainda não tem uma assinatura ativa.
          </p>
        )}
      </div>
    </div>
  );
}

// ── Lesson Principal ────────────────────────────────────────────────────
export default function Lesson() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);
  const { session, isSubscriber } = useAuth();
  const { settings } = useSettings();

  useEffect(() => { fetchLessonDetails(); }, [id]);

  const fetchLessonDetails = async () => {
    const { data: lesData, error: lesError } = await supabase
      .from('lessons').select('*').eq('id', id).single();

    if (lesError) { setLoading(false); return; }
    setLesson(lesData);

    const { data: matData } = await supabase
      .from('materials').select('*').eq('lesson_id', id);
    setMaterials(matData || []);
    setLoading(false);
  };

  if (loading) return <div className={styles.loading}>Carregando aula...</div>;
  if (!lesson) return <div className={styles.loading}>Aula não encontrada.</div>;

  // Determina o tipo de acesso
  const isAnonymous = !session;
  const canWatch = isSubscriber || (!isAnonymous && lesson.is_free);

  // Determina qual gate mostrar
  const showFreeGate = isAnonymous && lesson.is_free;
  const showPremiumGate = !canWatch && !showFreeGate;

  // Helper para renderizar o vídeo (URL ou iframe)
  const renderVideo = () => {
    const raw = lesson.video_url?.trim() || '';
    if (!raw) return <div className={styles.noVideo}>Nenhum vídeo disponível no momento.</div>;
    if (raw.startsWith('<iframe')) {
      const srcMatch = raw.match(/src="([^"]+)"/);
      return (
        <iframe
          src={srcMatch ? srcMatch[1] : ''}
          className={styles.videoPlayer}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          referrerPolicy="strict-origin-when-cross-origin"
          allowFullScreen
          title={lesson.title}
        />
      );
    }
    return (
      <video controls className={styles.videoPlayer} poster={lesson.cover_image_url}>
        <source src={raw} type="video/mp4" />
        Seu navegador não suporta o elemento de vídeo.
      </video>
    );
  };

  return (
    <div className={styles.lessonContainer}>
      <Header />

      <main className="container" style={{ paddingTop: '100px' }}>
        <button className={styles.backBtn} onClick={() => navigate('/')}>
          <ArrowLeft size={20} />
          <span>Voltar para o Início</span>
        </button>

        <h1 className={styles.lessonTitle}>{lesson.title}</h1>

        <div className={styles.contentLayout}>
          {/* Área principal — vídeo ou gate */}
          <div className={styles.mainContent}>
            <div className={styles.videoWrapper}>
              {showFreeGate ? (
                <FreeAccessGate lesson={lesson} navigate={navigate} />
              ) : showPremiumGate ? (
                <PremiumAccessGate
                  lesson={lesson}
                  navigate={navigate}
                  settings={settings}
                  isLoggedIn={!isAnonymous}
                />
              ) : (
                renderVideo()
              )}
            </div>

            {canWatch && lesson.summary && (
              <div className={`glass-panel ${styles.section}`}>
                <div className={styles.sectionHeader}>
                  <FileText className={styles.sectionIcon} />
                  <h2>Principais Pontos da Aula</h2>
                </div>
                <div className={styles.textContent}>
                  {lesson.summary.split('\n').map((p, i) => <p key={i}>{p}</p>)}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar — checklist e materiais */}
          <div className={styles.sidebar}>
            {canWatch && lesson.checklist && (
              <div className={`glass-panel ${styles.section}`}>
                <div className={styles.sectionHeader}>
                  <LayoutList className={styles.sectionIcon} />
                  <h2>O Que Fazer Agora</h2>
                </div>
                <div className={styles.checklistContent}>
                  {lesson.checklist.split('\n').map((item, i) =>
                    item.trim() !== '' && (
                      <div key={i} className={styles.checklistItem}>
                        <CheckCircle2 size={20} className={styles.checkIcon} />
                        <span>{item.replace(/^- /, '')}</span>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            {materials.length > 0 && (
              <div className={`glass-panel ${styles.section}`}>
                <div className={styles.sectionHeader}>
                  <Download className={styles.sectionIcon} />
                  <h2>Materiais da Aula</h2>
                </div>
                <div className={styles.materialsList}>
                  {materials.map(material => (
                    canWatch ? (
                      <a
                        key={material.id}
                        href={material.file_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={styles.materialCard}
                      >
                        <div className={styles.materialIcon}><FileText size={24} /></div>
                        <div className={styles.materialInfo}>
                          <h4>{material.title}</h4>
                          <span>Download</span>
                        </div>
                      </a>
                    ) : (
                      <div
                        key={material.id}
                        className={`${styles.materialCard} ${styles.materialCardLocked}`}
                        title="Conteúdo exclusivo para assinantes"
                      >
                        <div className={styles.materialIconLocked}><Lock size={20} /></div>
                        <div className={styles.materialInfo}>
                          <h4>{material.title}</h4>
                          <span>Bloqueado</span>
                        </div>
                      </div>
                    )
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Banner de upgrade para não-assinantes logados */}
      {session && !isSubscriber && <SubscribeBanner />}
    </div>
  );
}
