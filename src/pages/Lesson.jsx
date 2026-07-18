import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import Header from '../components/Header';
import styles from './Lesson.module.css';
import { ArrowLeft, Download, CheckCircle2, FileText, LayoutList } from 'lucide-react';

export default function Lesson() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [lesson, setLesson] = useState(null);
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLessonDetails();
  }, [id]);

  const fetchLessonDetails = async () => {
    const { data: lesData, error: lesError } = await supabase
      .from('lessons')
      .select('*')
      .eq('id', id)
      .single();

    if (lesError) {
      console.error(lesError);
      setLoading(false);
      return;
    }
    
    setLesson(lesData);

    const { data: matData, error: matError } = await supabase
      .from('materials')
      .select('*')
      .eq('lesson_id', id);

    if (matError) {
      console.error(matError);
    } else {
      setMaterials(matData);
    }

    setLoading(false);
  };

  if (loading) {
    return <div className={styles.loading}>Carregando aula...</div>;
  }

  if (!lesson) {
    return <div className={styles.loading}>Aula não encontrada.</div>;
  }

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
          {/* Main Content Area - Video Player */}
          <div className={styles.mainContent}>
            <div className={styles.videoWrapper}>
              {lesson.video_url ? (
                <video 
                  controls 
                  className={styles.videoPlayer}
                  poster={lesson.cover_image_url}
                >
                  <source src={lesson.video_url} type="video/mp4" />
                  Seu navegador não suporta o elemento de vídeo.
                </video>
              ) : (
                <div className={styles.noVideo}>Nenhum vídeo disponível no momento.</div>
              )}
            </div>

            {lesson.summary && (
              <div className={`glass-panel ${styles.section}`}>
                <div className={styles.sectionHeader}>
                  <FileText className={styles.sectionIcon} />
                  <h2>Principais Pontos da Aula</h2>
                </div>
                <div className={styles.textContent}>
                  {lesson.summary.split('\n').map((paragraph, index) => (
                    <p key={index}>{paragraph}</p>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar Area - Checklists and Materials */}
          <div className={styles.sidebar}>
            
            {lesson.checklist && (
              <div className={`glass-panel ${styles.section}`}>
                <div className={styles.sectionHeader}>
                  <LayoutList className={styles.sectionIcon} />
                  <h2>O Que Fazer Agora</h2>
                </div>
                <div className={styles.checklistContent}>
                  {lesson.checklist.split('\n').map((item, index) => (
                    item.trim() !== '' && (
                      <div key={index} className={styles.checklistItem}>
                        <CheckCircle2 size={20} className={styles.checkIcon} />
                        <span>{item.replace(/^- /, '')}</span>
                      </div>
                    )
                  ))}
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
                    <a 
                      key={material.id} 
                      href={material.file_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className={styles.materialCard}
                    >
                      <div className={styles.materialIcon}>
                        <FileText size={24} />
                      </div>
                      <div className={styles.materialInfo}>
                        <h4>{material.title}</h4>
                        <span>Download</span>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}
