import { useNavigate } from 'react-router-dom';
import { LogOut, Settings } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { useSettings } from '../context/SettingsContext';
import styles from './Header.module.css';

export default function Header() {
  const navigate = useNavigate();
  const { isAdmin } = useAuth();
  const { settings } = useSettings();

  const desktopSize = `${settings.header_brand_size_desktop}rem`;
  const mobileSize = `${settings.header_brand_size_mobile}rem`;

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <header className={styles.header}>
      <div className={`container ${styles.headerContent}`}>
        <div className={styles.logo} onClick={() => navigate('/')} style={{ cursor: 'pointer' }}>
          <h2
            className={styles.brandName}
            style={{
              '--brand-size-desktop': desktopSize,
              '--brand-size-mobile': mobileSize,
            }}
          >
            {settings.header_brand_text}
          </h2>
        </div>
        <nav className={styles.nav}>
          {isAdmin && (
            <button onClick={() => navigate('/admin')} className={styles.adminBtn}>
              <Settings size={18} />
              <span>Painel Admin</span>
            </button>
          )}
          <button onClick={handleLogout} className={styles.logoutBtn}>
            <LogOut size={18} />
            <span>Sair</span>
          </button>
        </nav>
      </div>
    </header>
  );
}
