import { useEffect, useState } from 'react';
import type { SyntheticEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './Auth.css';
import { useAuth } from '../context/useAuth';
import { Logo } from '../components/Layout';
import { getErrorMessage, SESSION_EXPIRED_FLAG } from '../api/client';
import { pageAfterLogin } from '../utils/redirect';

function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, login, register } = useAuth();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  // Si se llega aquí porque la sesión caducó o la cuenta se desactivó, se explica (una sola vez)
  const [ended] = useState(() => sessionStorage.getItem(SESSION_EXPIRED_FLAG));
  useEffect(() => {
    sessionStorage.removeItem(SESSION_EXPIRED_FLAG);
  }, []);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');

  async function handleSubmit(e: SyntheticEvent) {
    e.preventDefault();
    if (sending) return;
    const cleanEmail = email.trim().toLowerCase();
    if (mode === 'register') {
      if (!name.trim()) {
        setError('Escribe tu nombre.');
        return;
      }
      if (password.length < 8) {
        setError('La contraseña debe tener al menos 8 caracteres.');
        return;
      }
      if (password !== password2) {
        setError('Las contraseñas no coinciden.');
        return;
      }
      if (phone.trim() && !/^[+\d][\d\s-]{5,19}$/.test(phone.trim())) {
        setError('Revisa el teléfono: solo números, espacios y, si quieres, el prefijo con +.');
        return;
      }
    }

    setSending(true);
    setError('');
    try {
      const loggedUser =
        mode === 'login'
          ? await login(cleanEmail, password)
          : await register({ name: name.trim(), email: cleanEmail, password, phone: phone.trim() || undefined });

      // Vuelve a la página que pedía antes del login si es para su rol; si no, a su página de inicio.
      // replace: así Atrás no vuelve al formulario de acceso. Tras crear la cuenta se da la bienvenida
      navigate(pageAfterLogin(location.state?.from, loggedUser.role), {
        replace: true,
        state: mode === 'register' ? { welcome: loggedUser.name } : undefined,
      });
    } catch (err) {
      setError(getErrorMessage(err));
      setSending(false);
    }
  }

  function changeMode(newMode: 'login' | 'register') {
    setMode(newMode);
    setError('');
  }

  return (
    <div className="auth">
      <title>{mode === 'login' ? 'Entrar · CataHome' : 'Crear cuenta · CataHome'}</title>
      <div className="auth-side">
        <Link to="/" className="auth-logo" aria-label="CataHome, ir al inicio">
          <Logo light />
        </Link>
        <div className="auth-side-text">
          <h1>Guarda tus consultas y sigue cada respuesta en un solo sitio.</h1>
          <p>Con tu cuenta puedes preguntar por cualquier casa, pedir visitas y ver en qué punto está cada solicitud.</p>
        </div>
      </div>

      <main className="auth-main">
        <div className="auth-box">
          <Link to="/" className="auth-back">Volver a la web</Link>

          <div className="auth-tabs" role="tablist" aria-label="Acceso">
            <button type="button" role="tab" aria-selected={mode === 'login'} className={mode === 'login' ? 'auth-tab is-active' : 'auth-tab'} onClick={() => changeMode('login')}>Iniciar sesión</button>
            <button type="button" role="tab" aria-selected={mode === 'register'} className={mode === 'register' ? 'auth-tab is-active' : 'auth-tab'} onClick={() => changeMode('register')}>Crear cuenta</button>
          </div>

          <h2>{mode === 'login' ? 'Entra en tu cuenta' : 'Crea tu cuenta'}</h2>
          <p>{mode === 'login' ? 'Usa el correo y la contraseña con los que te registraste.' : 'Solo te pedimos lo necesario para poder responderte.'}</p>

          {user && (
            <p className="notice" role="status">
              Ya has entrado como {user.name}. <Link to="/perfil">Ir a mi perfil</Link>
            </p>
          )}
          {ended === 'caducada' && mode === 'login' && <p className="notice" role="status">Tu sesión ha caducado. Vuelve a entrar para seguir donde estabas.</p>}
          {ended === 'desactivada' && <p className="field-error" role="status">Tu cuenta está desactivada. Escríbenos para volver a activarla.</p>}

          <form onSubmit={handleSubmit} noValidate={false}>
            {mode === 'register' && (
              <label className="field">
                Nombre
                <input name="name" required autoComplete="name" maxLength={80} placeholder="Tu nombre" value={name} onChange={(e) => setName(e.target.value)} />
              </label>
            )}
            <label className="field">
              Correo electrónico
              <input name="email" type="email" required autoComplete="email" spellCheck={false} autoCapitalize="none" placeholder="nombre@correo.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            {mode === 'register' && (
              <label className="field">
                Teléfono (opcional)
                <input name="phone" type="tel" autoComplete="tel" placeholder="600 000 000" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </label>
            )}
            {/* El botón va fuera de la etiqueta: dentro, la etiqueta se asociaría al botón y no al campo */}
            <div className="auth-password">
              <label className="field">
                Contraseña
                <input
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  minLength={mode === 'register' ? 8 : undefined}
                  autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                  placeholder={mode === 'register' ? 'Mínimo 8 caracteres' : undefined}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>
              <button type="button" className="link-button auth-show" onClick={() => setShowPassword(!showPassword)} aria-pressed={showPassword}>
                {showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              </button>
            </div>
            {mode === 'register' && (
              <label className="field">
                Repite la contraseña
                <input name="password2" type={showPassword ? 'text' : 'password'} required minLength={8} autoComplete="new-password" value={password2} onChange={(e) => setPassword2(e.target.value)} />
              </label>
            )}
            {error && <p className="field-error" role="alert">{error}</p>}
            <button type="submit" className="btn btn-acento auth-submit" disabled={sending}>
              {sending ? (mode === 'login' ? 'Entrando…' : 'Creando la cuenta…') : mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
            </button>
          </form>

          <p className="auth-legal">
            {mode === 'register'
              ? 'Usamos tus datos solo para responder a tus consultas. Tu cuenta será de cliente.'
              : '¿Has olvidado la contraseña? Llámanos y te ayudamos a recuperarla.'}
          </p>
        </div>
      </main>
    </div>
  );
}

export default Auth;
