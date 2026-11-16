import { useState } from 'react';
import type { FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { categories, priorities } from '../data/tickets';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

function NewTicket() {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    if (String(data.get('descripcion')).trim().length < 10) {
      setError('La descripción debe tener al menos 10 caracteres.');
      return;
    }
    navigate('/mis-tickets');
  }

  return (
    <>
      <Navbar />
      <main className="page">
        <p className="breadcrumb"><Link to="/mis-tickets">Mis tickets</Link> / Nuevo ticket</p>
        <h1 className="page-title">Nuevo ticket</h1>
        <p className="page-subtitle">Cuéntanos qué necesitas y te responderemos lo antes posible.</p>

        <form className="form-box" onSubmit={handleSubmit}>
          <label className="field">
            Asunto
            <input name="asunto" required maxLength={80} placeholder="Ej: Consulta sobre piso en el centro" />
          </label>
          <div className="form-row">
            <label className="field">
              Categoría
              <select name="categoria">
                {categories.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </label>
            <label className="field">
              Prioridad
              <select name="prioridad" defaultValue="Media">
                {priorities.map((p) => (
                  <option key={p}>{p}</option>
                ))}
              </select>
            </label>
          </div>
          <label className="field">
            Descripción
            <textarea name="descripcion" required placeholder="Escribe aquí los detalles..." />
          </label>
          {error && <p className="field-error" role="alert">{error}</p>}
          <button type="submit" className="btn">Enviar ticket</button>
        </form>
      </main>
      <Footer />
    </>
  );
}

export default NewTicket;
