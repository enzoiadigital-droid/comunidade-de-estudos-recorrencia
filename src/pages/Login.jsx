import { useState } from 'react';
import { supabase } from '../lib/supabase';
import styles from './Login.module.css';

// mode: 'login' | 'signup' | 'reset'
export default function Login() {
  const [mode, setMode] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState(null);

  const reset = () => {
    setError(null);
    setMessage(null);
  };

  const switchMode = (m) => {
    reset();
    setPassword('');
    setConfirmPassword('');
    setMode(m);
  };

  // ── Login ──────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    reset();

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setError('E-mail ou senha incorretos.');
    setLoading(false);
  };

  // ── Cadastro ───────────────────────────────────
  const handleSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    reset();

    if (password !== confirmPassword) {
      setError('As senhas não coincidem.');
      setLoading(false);
      return;
    }
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      setLoading(false);
      return;
    }

    // 1. Verifica se o e-mail tem assinatura ativa na tabela members
    const { data: hasSubscription, error: checkError } = await supabase
      .rpc('check_member_email', { member_email: email });

    if (checkError) {
      setError('Erro ao validar e-mail. Tente novamente.');
      setLoading(false);
      return;
    }

    if (!hasSubscription) {
      setError('Este e-mail não tem uma assinatura ativa. Verifique se usou o mesmo e-mail da compra ou entre em contato com o suporte.');
      setLoading(false);
      return;
    }

    // 2. Cria a conta no Supabase Auth
    const { error: signupError } = await supabase.auth.signUp({ email, password });

    if (signupError) {
      if (signupError.message.includes('already registered')) {
        setError('Este e-mail já possui uma conta. Faça login normalmente.');
      } else {
        setError(signupError.message);
      }
      setLoading(false);
      return;
    }

    // 3. O trigger no banco já vai linkar auth_id automaticamente.
    //    Faz login direto.
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password });
    if (loginError) {
      setMessage('Conta criada! Agora faça seu login.');
      switchMode('login');
    }
    setLoading(false);
  };

  // ── Recuperar Senha ────────────────────────────
  const handleReset = async (e) => {
    e.preventDefault();
    if (!email) { setError('Digite seu e-mail acima.'); return; }
    setLoading(true);
    reset();

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setError(error.message);
    } else {
      setMessage('Instruções para redefinir a senha foram enviadas para o seu e-mail.');
      switchMode('login');
    }
    setLoading(false);
  };

  // ── Render ─────────────────────────────────────
  return (
    <div className={styles.loginContainer}>
      <div className={`glass-panel ${styles.loginCard}`}>

        <div className={styles.logo}>
          <h1>Rumo à Aprovação</h1>
          <p>Acesso exclusivo para membros</p>
        </div>

        {/* Tabs Login / Criar Conta */}
        {mode !== 'reset' && (
          <div className={styles.tabs}>
            <button
              type="button"
              className={`${styles.tab} ${mode === 'login' ? styles.tabActive : ''}`}
              onClick={() => switchMode('login')}
            >
              Entrar
            </button>
            <button
              type="button"
              className={`${styles.tab} ${mode === 'signup' ? styles.tabActive : ''}`}
              onClick={() => switchMode('signup')}
            >
              Criar Conta
            </button>
          </div>
        )}

        {error && <div className={styles.error}>{error}</div>}
        {message && <div className={styles.success}>{message}</div>}

        {/* ── FORM LOGIN ── */}
        {mode === 'login' && (
          <form className={styles.form} onSubmit={handleLogin}>
            <div className="input-group">
              <label htmlFor="login-email">E-mail</label>
              <input id="login-email" type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com" required />
            </div>
            <div className="input-group">
              <label htmlFor="login-password">Senha</label>
              <input id="login-password" type="password" value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Sua senha" required />
            </div>
            <button type="submit" className={`btn-primary ${styles.submitBtn}`} disabled={loading}>
              {loading ? 'Entrando...' : 'Entrar na Plataforma'}
            </button>
            <div className={styles.forgotPassword}>
              <button type="button" onClick={() => switchMode('reset')}>
                Esqueci minha senha
              </button>
            </div>
          </form>
        )}

        {/* ── FORM CADASTRO ── */}
        {mode === 'signup' && (
          <form className={styles.form} onSubmit={handleSignup}>
            <div className={styles.signupInfo}>
              <span>🔒</span>
              <p>Apenas assinantes podem criar uma conta. Use o e-mail cadastrado na sua compra.</p>
            </div>
            <div className="input-group">
              <label htmlFor="signup-email">E-mail da Compra</label>
              <input id="signup-email" type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com" required />
            </div>
            <div className="input-group">
              <label htmlFor="signup-password">Criar Senha</label>
              <input id="signup-password" type="password" value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Mínimo 6 caracteres" required />
            </div>
            <div className="input-group">
              <label htmlFor="signup-confirm">Confirmar Senha</label>
              <input id="signup-confirm" type="password" value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Repita a senha" required />
            </div>
            <button type="submit" className={`btn-primary ${styles.submitBtn}`} disabled={loading}>
              {loading ? 'Validando...' : 'Criar Minha Conta'}
            </button>
          </form>
        )}

        {/* ── FORM RECUPERAR SENHA ── */}
        {mode === 'reset' && (
          <form className={styles.form} onSubmit={handleReset}>
            <p style={{ color: 'var(--color-text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
              Informe seu e-mail e enviaremos as instruções para redefinir sua senha.
            </p>
            <div className="input-group">
              <label htmlFor="reset-email">E-mail</label>
              <input id="reset-email" type="email" value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="seu@email.com" required />
            </div>
            <button type="submit" className={`btn-primary ${styles.submitBtn}`} disabled={loading}>
              {loading ? 'Enviando...' : 'Enviar Instruções'}
            </button>
            <div className={styles.forgotPassword}>
              <button type="button" onClick={() => switchMode('login')}>
                ← Voltar para o Login
              </button>
            </div>
          </form>
        )}

      </div>
    </div>
  );
}
