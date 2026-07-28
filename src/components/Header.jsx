import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { LogOut, Settings, LogIn, UserPlus } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import styles from './Header.module.css';

export default function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, isAdmin } = useAuth();
  const { settings } = useSettings();
  const [scrolled, setScrolled] = useState(false);

  const isHome = location.pathname === '/';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const desktopSize = `${settings.header_brand_size_desktop}rem`;
  const mobileSize = `${settings.header_brand_size_mobile}rem`;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const headerClass = `${styles.header} ${(scrolled || !isHome) ? styles.headerScrolled : ''}`;

  return (
    <header className={headerClass}>
      <div className={`container ${styles.headerContent}`}>
        <div className={styles.logo} onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <img
            src="https://i.postimg.cc/P5yhQdsY/Rumo-a-Aprovacao-dourado-transparente-final-(1).png"
            alt={settings.header_brand_text || 'Rumo à Aprovação'}
            className={styles.brandLogo}
            fetchPriority="high"
            decoding="sync"
            loading="eager"
          />
        </div>

        <nav className={styles.nav}>
          {session ? (
            /* ── Usuário logado ── */
            <>
              {isAdmin && (
                <button onClick={() => navigate('/admin')} className={styles.adminBtn}>
                  <Settings size={18} />
                  <span>Admin</span>
                </button>
              )}
              <button onClick={handleLogout} className={styles.logoutBtn}>
                <LogOut size={18} />
                <span>Sair</span>
              </button>
            </>
          ) : (
            /* ── Visitante não autenticado ── */
            <>
              <button onClick={() => navigate('/login')} className={styles.loginBtn}>
                <LogIn size={18} />
                <span>Entrar</span>
              </button>
              <button onClick={() => navigate('/login#criar-conta')} className={styles.signupBtn}>
                <UserPlus size={16} />
                <span>Criar conta</span>
              </button>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
