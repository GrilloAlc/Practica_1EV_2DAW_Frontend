import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './Auth.css';

function Auth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [error, setError] = useState('');

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    if (mode === 'register' && data.get('password') !== data.get('password2')) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    navigate('/mis-tickets');
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
                <input name="nombre" required placeholder="Tu nombre" />
              </label>
            )}
            <label className="field">
              Correo electrónico
              <input name="email" type="email" required placeholder="nombre@correo.com" />
            </label>
            <label className="field">
              Contraseña
              <input name="password" type="password" required minLength={8} placeholder="Mínimo 8 caracteres" />
            </label>
            {mode === 'register' && (
              <label className="field">
                Repite la contraseña
                <input name="password2" type="password" required minLength={8} />
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
