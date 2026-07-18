import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogOut, Settings } from 'lucide-react';
import { supabase } from '../lib/supabase';
import styles from './Header.module.css';

export default function Header() {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    checkAdmin();
  }, []);

  const checkAdmin = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      const { data } = await supabase
        .from('members')
        .select('is_admin')
        .eq('id', session.user.id)
        .single();
      
      if (data?.is_admin) {
        setIsAdmin(true);
      }
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  return (
    <header className={styles.header}>
      <div className={`container ${styles.headerContent}`}>
        <div className={styles.logo} onClick={() => navigate('/')} style={{cursor: 'pointer'}}>
          <h2>Comunidade de Estudos</h2>
        </div>
        <nav className={styles.nav}>
          {isAdmin && (
            <button onClick={() => navigate('/admin')} className={styles.adminBtn}>
              <Settings size={20} />
              <span>Painel Admin</span>
            </button>
          )}
          <button onClick={handleLogout} className={styles.logoutBtn}>
            <LogOut size={20} />
            <span>Sair</span>
          </button>
        </nav>
      </div>
    </header>
  );
}
