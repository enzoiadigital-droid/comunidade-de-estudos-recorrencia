import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';
import { LogOut, Headset, CheckCircle, User as UserIcon, Mail } from 'lucide-react';
import styles from './MinhaConta.module.css';

export default function MinhaConta() {
  const navigate = useNavigate();
  const { session, isSubscriber } = useAuth();
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMemberData() {
      if (!session?.user?.id) return;
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('auth_id', session.user.id)
        .maybeSingle();
      
      if (data) {
        // Fallbacks para possíveis nomes de coluna
        const fullName = data.first_name || data.name || data.nome || data.primeiro_nome || '';
        // Pega só o primeiro nome se houver espaços
        const firstName = fullName.split(' ')[0] || 'Aluno';
        setUserName(firstName);
      } else {
        setUserName('Aluno');
      }
      setLoading(false);
    }
    fetchMemberData();
  }, [session]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
  };

  const handleSupport = () => {
    window.open('https://wa.link/5967d6', '_blank');
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div className={styles.avatarCircle}>
          <UserIcon size={32} color="var(--color-gold)" />
        </div>
        <h1 className={styles.title}>Minha Conta</h1>
        <p className={styles.subtitle}>Gerencie suas informações e assinatura</p>
      </div>

      <div className={styles.card}>
        <div className={styles.infoGroup}>
          <div className={styles.infoLabel}>
            <UserIcon size={16} /> Nome
          </div>
          <div className={styles.infoValue}>
            {loading ? <span className={styles.skeletonText}>Carregando...</span> : userName}
          </div>
        </div>

        <div className={styles.infoGroup}>
          <div className={styles.infoLabel}>
            <Mail size={16} /> E-mail de acesso
          </div>
          <div className={styles.infoValue}>
            {session?.user?.email || <span className={styles.skeletonText}>Carregando...</span>}
          </div>
        </div>

        <div className={styles.infoGroup}>
          <div className={styles.infoLabel}>
            <CheckCircle size={16} /> Status da assinatura
          </div>
          <div className={styles.infoValue}>
            {isSubscriber ? (
              <span className={styles.statusActive}>Ativa</span>
            ) : (
              <span className={styles.statusInactive}>Inativa</span>
            )}
          </div>
        </div>
      </div>

      <div className={styles.actions}>
        <button className={styles.supportBtn} onClick={handleSupport}>
          <Headset size={20} />
          Falar com o suporte
        </button>
        
        <button className={styles.logoutBtn} onClick={handleLogout}>
          <LogOut size={20} />
          Sair da conta
        </button>
      </div>
    </div>
  );
}
