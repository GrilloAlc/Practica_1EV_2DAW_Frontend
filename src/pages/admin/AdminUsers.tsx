import { useState } from 'react';
import { usuarios as initialUsers } from '../../data/usuarios';
import AdminSidebar from '../../components/AdminSidebar';
import './Admin.css';

function AdminUsers() {
  const [users, setUsers] = useState(initialUsers);

  function changeRole(id: string, role: string) {
    setUsers(users.map((u) => (u.id === id ? { ...u, role } : u)));
  }

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-main">
        <div className="page">
          <p className="label">Gestión</p>
          <h1 className="page-title">Usuarios y roles</h1>
          <p className="page-subtitle">Cambia el rol de cada usuario.</p>

          <div className="table-box">
            <table className="table">
              <thead>
                <tr><th>Nombre</th><th>Correo</th><th>Rol</th></tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.name}</td>
                    <td>{u.email}</td>
                    <td>
                      <select aria-label={`Rol de ${u.name}`} value={u.role} onChange={(e) => changeRole(u.id, e.target.value)}>
                        <option>Cliente</option>
                        <option>Agente</option>
                        <option>Administrador</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

export default AdminUsers;
