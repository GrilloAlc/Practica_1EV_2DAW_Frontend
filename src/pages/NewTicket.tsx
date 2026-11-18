import { useState } from 'react';
import type { SyntheticEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { createTicket } from '../api/tickets';
import { getErrorMessage } from '../api/client';
import { TICKET_CATEGORIES, categoryLabels } from '../utils/labels';

function NewTicket() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // El asunto puede venir ya escrito desde una propiedad (?asunto=...)
  const [subject, setSubject] = useState(searchParams.get('asunto') || '');
  const [category, setCategory] = useState('CONSULTA_PROPIEDAD');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  async function handleSubmit(e: SyntheticEvent) {
    e.preventDefault();
    if (description.trim().length < 10) {
      setError('La descripción debe tener al menos 10 caracteres.');
      return;
    }

    try {
      const ticket = await createTicket({ subject, description, category });
      navigate('/mis-tickets/' + ticket._id);
    } catch (err) {
      setError(getErrorMessage(err));
    }
  }

  return (
    <main className="page">
      <p className="breadcrumb"><Link to="/mis-tickets">Mis tickets</Link> / Nuevo ticket</p>
      <h1 className="page-title">Nuevo ticket</h1>
      <p className="page-subtitle">Cuéntanos qué necesitas y te responderemos lo antes posible.</p>

      <form className="form-box" onSubmit={handleSubmit}>
        <label className="field">
          Asunto
          <input name="subject" required maxLength={200} placeholder="Ej: Consulta sobre piso en el centro" value={subject} onChange={(e) => setSubject(e.target.value)} />
        </label>
        <label className="field">
          Categoría
          <select name="category" value={category} onChange={(e) => setCategory(e.target.value)}>
            {TICKET_CATEGORIES.map((c) => (
              <option key={c} value={c}>{categoryLabels[c]}</option>
            ))}
          </select>
        </label>
        <label className="field">
          Descripción
          <textarea name="description" required maxLength={2000} placeholder="Escribe aquí los detalles..." value={description} onChange={(e) => setDescription(e.target.value)} />
        </label>
        {error && <p className="field-error" role="alert">{error}</p>}
        <button type="submit" className="btn">Enviar ticket</button>
      </form>
    </main>
  );
}

export default NewTicket;
