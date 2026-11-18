import { useEffect, useState } from 'react';
import { getUsers, updateUser } from '../../api/users';
import { getErrorMessage } from '../../api/client';
import { ROLES, roleLabels } from '../../utils/labels';
import type { User } from '../../types';

function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadUsers() {
      try {
        const result = await getUsers({ limit: 50 });
        setUsers(result.data);
      } catch (err) {
        setError(getErrorMessage(err));
      }
    }
    loadUsers();
  }, []);

  async function changeUser(id: string, changes: Partial<User>) {
    try {
      await updateUser(id, changes);
      setUsers(users.map((u) => (u._id === id ? { ...u, ...changes } : u)));
      setError('');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  return (
    <main className="page">
      <p className="label">Gestión</p>
      <h1 className="page-title">Usuarios y roles</h1>
      <p className="page-subtitle">Cambia el rol de cada usuario o desactiva su cuenta.</p>

      {error && <p className="field-error" role="alert">{error}</p>}

      <div className="table-box">
        <table className="table">
          <thead>
            <tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Estado</th><th>Acciones</th></tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id} className={u.isActive ? '' : 'admin-inactive'}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td>
                  <select aria-label={`Rol de ${u.name}`} value={u.role} onChange={(e) => changeUser(u._id, { role: e.target.value })}>
                    {ROLES.map((r) => (
                      <option key={r} value={r}>{roleLabels[r]}</option>
                    ))}
                  </select>
                </td>
                <td><span className="status-badge">{u.isActive ? 'Activo' : 'Inactivo'}</span></td>
                <td>
                  <button className="link-button" onClick={() => changeUser(u._id, { isActive: !u.isActive })}>
                    {u.isActive ? 'Desactivar' : 'Activar'}
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </main>
  );
}

export default AdminUsers;
