import { useState } from 'react';
import { supabase } from '../lib/supabase';
import styles from './Login.module.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);
  const [isResetting, setIsResetting] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setError('E-mail ou senha incorretos.');
    }
    setLoading(false);
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!email) {
      setError('Por favor, insira seu e-mail acima.');
      return;
    }
    
    setLoading(true);
    setError(null);
    setMessage(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage('Instruções para redefinir a senha foram enviadas para seu e-mail.');
      setIsResetting(false);
    }
    setLoading(false);
  };

  return (
    <div className={styles.loginContainer}>
      <div className={`glass-panel ${styles.loginCard}`}>
        <div className={styles.logo}>
          <h1>Comunidade de Estudos</h1>
          <p>Acesso exclusivo para membros</p>
        </div>

        {error && <div className={styles.error}>{error}</div>}
        {message && <div className={styles.success}>{message}</div>}

        {!isResetting ? (
          <form className={styles.form} onSubmit={handleLogin}>
            <div className="input-group">
              <label htmlFor="email">E-mail</label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
              />
            </div>
            <div className="input-group">
              <label htmlFor="password">Senha</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Sua senha"
                required
              />
            </div>
            <button 
              type="submit" 
              className={`btn-primary ${styles.submitBtn}`}
              disabled={loading}
            >
              {loading ? 'Entrando...' : 'Entrar na Plataforma'}
            </button>

            <div className={styles.forgotPassword}>
              <button type="button" onClick={() => setIsResetting(true)}>
                Esqueci minha senha
              </button>
            </div>
          </form>
        ) : (
          <form className={styles.form} onSubmit={handleResetPassword}>
            <div className="input-group">
              <label htmlFor="reset-email">E-mail de Cadastro</label>
              <input
                id="reset-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                required
              />
            </div>
            <button 
              type="submit" 
              className={`btn-primary ${styles.submitBtn}`}
              disabled={loading}
            >
              {loading ? 'Enviando...' : 'Recuperar Senha'}
            </button>

            <div className={styles.forgotPassword}>
              <button type="button" onClick={() => setIsResetting(false)}>
                Voltar para o Login
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
