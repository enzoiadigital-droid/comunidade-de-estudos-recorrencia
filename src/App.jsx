import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import './index.css';

import Login from './pages/Login';
import Home from './pages/Home';
import Lesson from './pages/Lesson';
import Admin from './pages/Admin';
import Flashcards from './pages/Flashcards';

import AppLayout from './components/AppLayout';
import TrackerEstudos from './pages/TrackerEstudos';
import ComingSoon from './pages/ComingSoon';
import MinhaConta from './pages/MinhaConta';

function App() {
  const { session, isAdmin, loading } = useAuth();

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        height: '100vh',
        justifyContent: 'center',
        alignItems: 'center',
        background: '#0B0E14',
        color: '#D4AF37',
        fontFamily: 'Poppins, sans-serif',
        fontSize: '1.1rem',
        gap: '0.75rem'
      }}>
        <span>Carregando...</span>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={!session ? <Login /> : <Navigate to="/" />} />
        <Route path="/lesson/:id" element={<Lesson />} />
        
        {/* Admin protegido - sem AppLayout */}
        <Route
          path="/admin"
          element={
            !session
              ? <Navigate to="/login" />
              : isAdmin
                ? <Admin />
                : <Navigate to="/" />
          }
        />

        {/* Rotas com Sidebar (AppLayout) */}
        <Route element={<AppLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/tracker" element={<TrackerEstudos />} />
          <Route path="/flashcards" element={<Flashcards />} />
          <Route path="/progresso" element={<ComingSoon title="Meu Progresso" />} />
          <Route path="/conta" element={<MinhaConta />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
