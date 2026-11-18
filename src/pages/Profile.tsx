import { useState } from 'react';
import type { SyntheticEvent } from 'react';
import { useAuth } from '../context/useAuth';
import { updateMe } from '../api/users';
import { getErrorMessage } from '../api/client';

function Profile() {
  const { user, updateUser } = useAuth();
  const [name, setName] = useState(user!.name);
  const [phone, setPhone] = useState(user!.phone || '');
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: SyntheticEvent) {
    e.preventDefault();
    try {
      const updated = await updateMe({ name, phone });
      updateUser(updated);
      setSaved(true);
      setError('');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  return (
    <main className="page">
      <p className="label">Área personal</p>
      <h1 className="page-title">Mi perfil</h1>
      <p className="page-subtitle">Actualiza tus datos básicos.</p>

      <form className="form-box" onSubmit={handleSubmit} onChange={() => setSaved(false)}>
        <label className="field">
          Nombre
          <input name="name" required value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="field">
          Correo electrónico
          <input name="email" type="email" value={user!.email} disabled />
        </label>
        <label className="field">
          Teléfono
          <input name="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
        </label>
        {error && <p className="field-error" role="alert">{error}</p>}
        <button type="submit" className="btn">Guardar cambios</button>
        {saved && <p role="status">Cambios guardados.</p>}
      </form>
    </main>
  );
}

export default Profile;
