import { useEffect, useState } from 'react';
import { changeRole, getUsers, setUserActive } from '../../api/users';
import { getErrorMessage } from '../../api/client';
import { ROLES, roleLabels } from '../../utils/labels';
import type { User } from '../../types';

function AdminUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadUsers() {
      try {
        setUsers(await getUsers({ limit: 50 }));
      } catch (err) {
        setError(getErrorMessage(err));
      }
    }
    loadUsers();
  }, []);

  // PUT /users/:id/role
  async function updateRole(id: string, role: string) {
    try {
      await changeRole(id, role);
      setUsers(users.map((u) => (u._id === id ? { ...u, role } : u)));
      setError('');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  // PUT /users/:id/activate o /deactivate. Desactivar pide confirmación
  async function toggleActive(user: User) {
    if (user.isActive && !window.confirm(`¿Seguro que quieres desactivar a ${user.name}? No podrá usar su cuenta.`)) {
      return;
    }
    try {
      await setUserActive(user._id, !user.isActive);
      setUsers(users.map((u) => (u._id === user._id ? { ...u, isActive: !u.isActive } : u)));
      setError('');
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  return (
    <main className="page">
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
                <td>
                  <span className="admin-user">
                    <span className="avatar" aria-hidden="true">{u.name[0]}</span>
                    <strong>{u.name}</strong>
                  </span>
                </td>
                <td className="cell-muted">{u.email}</td>
                <td>
                  <select aria-label={`Rol de ${u.name}`} value={u.role} onChange={(e) => updateRole(u._id, e.target.value)}>
                    {ROLES.map((r) => (
                      <option key={r} value={r}>{roleLabels[r]}</option>
                    ))}
                  </select>
                </td>
                <td><span className={u.isActive ? 'status-badge status-on' : 'status-badge status-off'}>{u.isActive ? 'Activo' : 'Inactivo'}</span></td>
                <td>
                  <button className="link-button" onClick={() => toggleActive(u)}>
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
