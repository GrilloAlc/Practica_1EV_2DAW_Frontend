import { useState } from 'react';
import type { SyntheticEvent } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import './Auth.css';
import { useAuth } from '../context/useAuth';
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
        <Link to="/" className="auth-logo">INMOBILIARIA</Link>
        <h1>Tu espacio para encontrar y gestionar tu próximo hogar.</h1>
        <p>Atención personalizada · Consultas centralizadas · Seguimiento sencillo</p>
      </div>

      <div className="auth-main">
        <div className="auth-box">
          <div className="tabs auth-tabs">
            <button className={mode === 'login' ? 'tab tab-active' : 'tab'} onClick={() => changeMode('login')}>Iniciar sesión</button>
            <button className={mode === 'register' ? 'tab tab-active' : 'tab'} onClick={() => changeMode('register')}>Crear cuenta</button>
          </div>

          <h2>{mode === 'login' ? 'Bienvenido de nuevo' : 'Crea tu cuenta'}</h2>
          <p>{mode === 'login' ? 'Introduce tus datos para acceder.' : 'Solo te llevará un minuto.'}</p>

          <form onSubmit={handleSubmit}>
            {mode === 'register' && (
              <label className="field">
                Nombre
                <input name="name" required placeholder="Tu nombre" value={name} onChange={(e) => setName(e.target.value)} />
              </label>
            )}
            <label className="field">
              Correo electrónico
              <input name="email" type="email" required placeholder="nombre@correo.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            {mode === 'register' && (
              <label className="field">
                Teléfono (opcional)
                <input name="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
              </label>
            )}
            <label className="field">
              Contraseña
              <input name="password" type="password" required minLength={8} placeholder="Mínimo 8 caracteres" value={password} onChange={(e) => setPassword(e.target.value)} />
            </label>
            {mode === 'register' && (
              <label className="field">
                Repite la contraseña
                <input name="password2" type="password" required minLength={8} value={password2} onChange={(e) => setPassword2(e.target.value)} />
              </label>
            )}
            {error && <p className="field-error" role="alert">{error}</p>}
            <button type="submit" className="btn auth-submit">
              {mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'}
            </button>
          </form>

          <p className="auth-legal">Al continuar, aceptas los Términos y la Política de privacidad.</p>
        </div>
      </div>
    </div>
  );
}

export default Auth;
