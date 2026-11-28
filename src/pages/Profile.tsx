import { useState } from 'react';
import type { SyntheticEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import { updateMe } from '../api/users';
import { getErrorMessage } from '../api/client';
import { roleLabels } from '../utils/labels';
import { homeForRole } from '../utils/redirect';
import { PasswordDialog } from './admin/AdminUsers';
import './Profile.css';

function Profile() {
  const { user, updateUser, logout } = useAuth();
  const navigate = useNavigate();

  // Igual que "Salir" del menú: primero se va al inicio y después se cierra la sesión
  function handleLogout() {
    navigate('/', { replace: true, flushSync: true });
    logout();
  }
  const [name, setName] = useState(user!.name);
  const [phone, setPhone] = useState(user!.phone || '');
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordChanged, setPasswordChanged] = useState(false);

  const changed = name.trim() !== user!.name || phone.trim() !== (user!.phone || '');

  async function handleSubmit(e: SyntheticEvent) {
    e.preventDefault();
    if (saving) return;
    if (!name.trim()) {
      setError('El nombre no puede quedar vacío.');
      return;
    }
    if (phone.trim() && !/^[+\d][\d\s-]{5,19}$/.test(phone.trim())) {
      setError('Revisa el teléfono: solo números, espacios y, si quieres, el prefijo con +.');
      return;
    }
    setSaving(true);
    try {
      const updated = await updateMe({ name: name.trim(), phone: phone.trim() });
      updateUser(updated);
      setName(updated.name);
      setPhone(updated.phone || '');
      setSaved(true);
      setError('');
    } catch (err) {
      setError(getErrorMessage(err));
    }
    setSaving(false);
  }

  return (
    <main className="page">
      <title>Mi perfil · CataHome</title>
      <div className="profile-head">
        <span className="profile-avatar" aria-hidden="true">{user!.name.charAt(0).toUpperCase()}</span>
        <div>
          <h1 className="page-title">{user!.name}</h1>
          <p className="profile-role">{roleLabels[user!.role]} · {user!.email}</p>
        </div>
      </div>

      <form className="form-box" onSubmit={handleSubmit} onChange={() => setSaved(false)}>
        <h2 className="form-box-title">Tus datos</h2>
        <label className="field">
          Nombre
          <input name="name" required autoComplete="name" maxLength={80} value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="field">
          Correo electrónico
          <input name="email" type="email" value={user!.email} disabled aria-describedby="email-help" />
          <span id="email-help" className="field-help">
            El correo no se puede cambiar.
            {user!.role === 'CLIENTE' && <> Si lo necesitas, <Link to="/mis-tickets/nuevo?categoria=CUENTA&asunto=Cambiar%20mi%20correo">escríbenos una consulta</Link>.</>}
          </span>
        </label>
        <label className="field">
          Teléfono
          <input name="phone" type="tel" autoComplete="tel" placeholder="600 000 000" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </label>
        {error && <p className="field-error" role="alert">{error}</p>}
        <div className="form-actions">
          <button type="submit" className="btn" disabled={saving || !changed}>{saving ? 'Guardando…' : 'Guardar cambios'}</button>
          {saved && <p className="form-ok" role="status">Cambios guardados</p>}
        </div>
      </form>

      {/* Contraseña: el backend solo deja cambiarla al administrador (PUT /users/:id/password).
          Clientes y agentes la piden por una consulta o al administrador */}
      <section className="profile-session" aria-labelledby="profile-password-title">
        <h2 id="profile-password-title" className="form-box-title">Contraseña</h2>
        {user!.role === 'ADMIN' ? (
          <>
            <p>Puedes cambiar tu contraseña cuando quieras. La sesión actual sigue abierta.</p>
            {passwordChanged && <p className="form-ok" role="status">Contraseña cambiada</p>}
            <button type="button" className="btn btn-outline" onClick={() => setChangingPassword(true)}>Cambiar la contraseña</button>
            {changingPassword && (
              <PasswordDialog
                user={user!}
                own
                onClose={() => setChangingPassword(false)}
                onDone={() => {
                  setChangingPassword(false);
                  setPasswordChanged(true);
                }}
              />
            )}
          </>
        ) : user!.role === 'CLIENTE' ? (
          <p>
            Por seguridad, la contraseña la cambia nuestro equipo.{' '}
            <Link to="/mis-tickets/nuevo?categoria=CUENTA&asunto=Cambiar%20mi%20contrase%C3%B1a">Pídelo con una consulta</Link> y te responderemos por escrito.
          </p>
        ) : (
          <p>Si necesitas cambiar tu contraseña, pídeselo a un administrador.</p>
        )}
      </section>

      {/* En el teléfono "Salir" no cabe en el menú: está aquí (y también en el ordenador) */}
      <section className="profile-session" aria-labelledby="profile-session-title">
        <h2 id="profile-session-title" className="form-box-title">Sesión</h2>
        <p>
          Has entrado como {user!.email}. <Link to={homeForRole(user!.role)}>{user!.role === 'CLIENTE' ? 'Ver mis consultas' : user!.role === 'ADMIN' ? 'Ir al panel' : 'Ver mis tickets'}</Link>
        </p>
        <button type="button" className="btn btn-outline" onClick={handleLogout}>Cerrar sesión</button>
      </section>
    </main>
  );
}

export default Profile;
