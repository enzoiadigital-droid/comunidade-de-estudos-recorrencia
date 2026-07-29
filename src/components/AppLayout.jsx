import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import { Home, BookOpen, Clock, Layers, TrendingUp, User, LogOut } from 'lucide-react';
import styles from './AppLayout.module.css';

export default function AppLayout() {
  const { session, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  if (loading) return null;
  
  // Se não estiver logado, apenas renderiza o conteúdo (para a Home pública funcionar)
  if (!session) {
    return <Outlet />;
  }

  const navItems = [
    { label: 'Início', path: '/', icon: Home },
    { label: 'Tracker', path: '/tracker', icon: Clock },
    { label: 'Flashcards', path: '/flashcards', icon: Layers },
    { label: 'Progresso', path: '/progresso', icon: TrendingUp },
    { label: 'Conta', path: '/conta', icon: User },
  ];

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  const isActive = (path) => {
    return location.pathname === path;
    return location.pathname.startsWith(path);
  };

  const handleNav = (path) => {
    if (path.startsWith('/#')) {
      navigate('/');
      setTimeout(() => {
        const el = document.getElementById(path.replace('/#', ''));
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      navigate(path);
    }
  };

  return (
    <div className={styles.layoutContainer}>
      {/* Sidebar Desktop */}
      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <img src="https://i.postimg.cc/P5yhQdsY/Rumo-a-Aprovacao-dourado-transparente-final-(1).png" alt="Rumo à Aprovação" className={styles.brandLogo} />
        </div>
        
        <nav className={styles.navMenu}>
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                className={`${styles.navItem} ${isActive(item.path) ? styles.active : ''}`}
                onClick={() => handleNav(item.path)}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className={styles.sidebarFooter}>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            <LogOut size={20} />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      {/* Mobile Top Bar */}
      <div className={styles.mobileTopBar}>
        <img src="https://i.postimg.cc/P5yhQdsY/Rumo-a-Aprovacao-dourado-transparente-final-(1).png" alt="Rumo à Aprovação" className={styles.mobileBrandLogo} />
      </div>

      {/* Main Content Area */}
      <main className={styles.mainContent}>
        <Outlet />
      </main>

      {/* Bottom Nav Mobile */}
      <nav className={styles.bottomNav}>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.label}
              className={`${styles.bottomNavItem} ${isActive(item.path) ? styles.active : ''}`}
              onClick={() => handleNav(item.path)}
            >
              <Icon size={20} className={styles.bottomNavIcon} />
              <span className={styles.bottomNavLabel}>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
}
