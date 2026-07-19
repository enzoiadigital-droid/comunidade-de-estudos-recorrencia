import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isSubscriber, setIsSubscriber] = useState(false);
  const [userName, setUserName] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchUserStatus(session.user);
      } else {
        setLoading(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session?.user) {
        fetchUserStatus(session.user);
      } else {
        setIsAdmin(false);
        setIsSubscriber(false);
        setUserName('');
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserStatus = async (user) => {
    // 1. Verifica se é admin via SECURITY DEFINER (evita recursão RLS)
    const { data: adminData } = await supabase.rpc('is_admin');
    setIsAdmin(adminData === true);

    // 2. Verifica se é assinante e busca o nome na tabela members
    const { data: memberData } = await supabase
      .from('members')
      .select('email, name')
      .eq('auth_id', user.id)
      .maybeSingle();

    setIsSubscriber(!!memberData);
    setUserName(memberData?.name || '');
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ session, isAdmin, isSubscriber, userName, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
