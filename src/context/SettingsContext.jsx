import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

const SettingsContext = createContext({});

const DEFAULTS = {
  hero_title: 'Bem-vinda à Comunidade',
  hero_subtitle: 'O seu caminho para a aprovação começa aqui.',
  hero_title_size_desktop: '3',
  hero_title_size_mobile: '1.75',
  header_brand_text: 'Rumo à Aprovação',
  header_brand_size_desktop: '1.25',
  header_brand_size_mobile: '1',
  subscribe_url: '',
};

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(DEFAULTS);

  const fetchSettings = async () => {
    const { data, error } = await supabase.from('site_settings').select('key, value');
    if (error || !data) return;
    const map = {};
    data.forEach(row => { map[row.key] = row.value; });
    setSettings(prev => ({ ...prev, ...map }));
  };

  useEffect(() => { fetchSettings(); }, []);

  return (
    <SettingsContext.Provider value={{ settings, refetchSettings: fetchSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  return useContext(SettingsContext);
}
