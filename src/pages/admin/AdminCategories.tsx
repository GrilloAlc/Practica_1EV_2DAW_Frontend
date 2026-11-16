import { useState } from 'react';
import type { FormEvent } from 'react';
import { categories as initialCategories } from '../../data/tickets';
import AdminSidebar from '../../components/AdminSidebar';
import './Admin.css';

function AdminCategories() {
  const [categories, setCategories] = useState(initialCategories);
  const [name, setName] = useState('');

  function addCategory(e: FormEvent) {
    e.preventDefault();
    const clean = name.trim();
    if (!clean || categories.includes(clean)) return;
    setCategories([...categories, clean]);
    setName('');
  }

  function removeCategory(c: string) {
    if (window.confirm(`¿Eliminar la categoría «${c}»?`)) {
      setCategories(categories.filter((x) => x !== c));
    }
  }

  return (
    <div className="admin-layout">
      <AdminSidebar />
      <main className="admin-main">
        <div className="page">
          <p className="label">Gestión</p>
          <h1 className="page-title">Categorías</h1>
          <p className="page-subtitle">Tipos de solicitud que pueden elegir los clientes.</p>

          <form className="admin-inline-form" onSubmit={addCategory}>
            <label className="field">
              Nueva categoría
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Incidencia de alquiler" />
            </label>
            <button type="submit" className="btn">Añadir</button>
          </form>

          <div className="table-box">
            <table className="table">
              <thead>
                <tr><th>Categoría</th><th>Acciones</th></tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c}>
                    <td>{c}</td>
                    <td><button className="link-button" onClick={() => removeCategory(c)}>Eliminar</button></td>
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

export default AdminCategories;
