import { useState } from 'react';
import type { SyntheticEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './Auth.css';
import { useAuth } from '../context/useAuth';
import { Logo } from '../components/Layout';
import { getErrorMessage } from '../api/client';

function Auth() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, register } = useAuth();

  const [mode, setMode] = useState('login');
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');

  async function handleSubmit(e: SyntheticEvent) {
    e.preventDefault();
    if (mode === 'register' && password !== password2) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    try {
      let user;
      if (mode === 'login') {
        user = await login(email, password);
      } else {
        user = await register({ name, email, password, phone });
      }

      // Vuelve a la página que pedía antes del login o va a su zona según el rol
      let destination = '/mis-tickets';
      if (user.role === 'ADMIN') destination = '/admin';
      if (user.role === 'AGENTE') destination = '/agente/tickets';
      navigate(location.state?.from || destination);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  function changeMode(newMode: string) {
    setMode(newMode);
    setError('');
  }

  return (
    <div className="auth">
      <div className="auth-side">
        <Link to="/" className="auth-logo" aria-label="CataHome, ir al inicio">
          <Logo light />
        </Link>
        <div className="auth-side-text">
          <h1>Guarda tus consultas y sigue cada respuesta en un solo sitio.</h1>
          <p>Con tu cuenta puedes preguntar por cualquier casa, pedir visitas y ver en qué punto está cada solicitud.</p>
        </div>
      </div>

      <div className="auth-main">
        <div className="auth-box">
          <Link to="/" className="auth-back">Volver a la web</Link>

          <div className="auth-tabs" role="tablist" aria-label="Acceso">
            <button type="button" role="tab" aria-selected={mode === 'login'} className={mode === 'login' ? 'auth-tab is-active' : 'auth-tab'} onClick={() => changeMode('login')}>Iniciar sesión</button>
            <button type="button" role="tab" aria-selected={mode === 'register'} className={mode === 'register' ? 'auth-tab is-active' : 'auth-tab'} onClick={() => changeMode('register')}>Crear cuenta</button>
          </div>

          <h2>{mode === 'login' ? 'Entra en tu cuenta' : 'Crea tu cuenta'}</h2>
          <p>{mode === 'login' ? 'Usa el correo y la contraseña con los que te registraste.' : 'Solo te pedimos lo necesario para poder responderte.'}</p>

          <form onSubmit={handleSubmit}>
            {mode === 'register' && (
              <label className="field">
                Nombre
                <input name="name" required autoComplete="name" placeholder="Tu nombre" value={name} onChange={(e) => setName(e.target.value)} />
              </label>
            )}
            <label className="field">
              Correo electrónico
              <input name="email" type="email" required autoComplete="email" spellCheck={false} placeholder="nombre@correo.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            {mode === 'register' && (
              <label className="field">
                Teléfono (opcional)
                <input name="phone" type="tel" autoComplete="tel" placeholder="600 000 000" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </label>
            )}
            <label className="field">
              Contraseña
              <input name="password" type="password" required minLength={8} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} placeholder="Mínimo 8 caracteres" value={password} onChange={(e) => setPassword(e.target.value)} />
            </label>
            {mode === 'register' && (
              <label className="field">
                Repite la contraseña
                <input name="password2" type="password" required minLength={8} autoComplete="new-password" value={password2} onChange={(e) => setPassword2(e.target.value)} />
              </label>
            )}
            {error && <p className="field-error" role="alert">{error}</p>}
            <button type="submit" className="btn btn-acento auth-submit">
              {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
            </button>
          </form>

          <p className="auth-legal">Al continuar aceptas los términos de uso y la política de privacidad.</p>
        </div>
      </div>
    </div>
  );
}

export default Auth;
