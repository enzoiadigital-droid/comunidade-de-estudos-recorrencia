import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import './index.css';

import Login from './pages/Login';
import Home from './pages/Home';
import Lesson from './pages/Lesson';
import Admin from './pages/Admin';

// Layouts and Pages will go here

function App() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return <div style={{display: 'flex', height: '100vh', justifyContent: 'center', alignItems: 'center'}}>Carregando...</div>;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={!session ? <Login /> : <Navigate to="/" />} />
        
        {/* Protected Routes */}
        <Route 
          path="/" 
          element={session ? <Home /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/lesson/:id" 
          element={session ? <Lesson /> : <Navigate to="/login" />} 
        />
        <Route 
          path="/admin" 
          element={session ? <Admin /> : <Navigate to="/login" />} 
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
