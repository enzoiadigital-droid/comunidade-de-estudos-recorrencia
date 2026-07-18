import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import './index.css';

import Login from './pages/Login';
import Home from './pages/Home';
import Lesson from './pages/Lesson';
import Admin from './pages/Admin';

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
        <Route path="/" element={session ? <Home /> : <Navigate to="/login" />} />
        <Route path="/lesson/:id" element={session ? <Lesson /> : <Navigate to="/login" />} />
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
      </Routes>
    </BrowserRouter>
  );
}

export default App;
