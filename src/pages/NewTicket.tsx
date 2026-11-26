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
  const [category, setCategory] = useState(
    TICKET_CATEGORIES.includes(searchParams.get('categoria') || '') ? searchParams.get('categoria')! : 'CONSULTA_PROPIEDAD',
  );
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
      <p className="breadcrumb"><Link to="/mis-tickets">Mis consultas</Link> / Nueva consulta</p>
      <h1 className="page-title">Nueva consulta</h1>
      <p className="page-subtitle">Cuéntanos qué necesitas. Un agente te responde, normalmente en menos de 24 horas.</p>

      <div className="new-ticket">
      <form className="form-box" onSubmit={handleSubmit}>
        <label className="field">
          Asunto
          <input name="subject" required maxLength={200} placeholder="Por ejemplo: visita al piso de la calle Mayor" value={subject} onChange={(e) => setSubject(e.target.value)} />
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
          <textarea name="description" required maxLength={2000} placeholder="Qué quieres saber, cuándo te viene bien una visita, cómo prefieres que te contactemos…" value={description} onChange={(e) => setDescription(e.target.value)} />
          <span className="field-help">{description.length} / 2000 caracteres. Mínimo 10.</span>
        </label>
        {error && <p className="field-error" role="alert">{error}</p>}
        <button type="submit" className="btn btn-acento">Enviar consulta</button>
      </form>

      <aside className="new-ticket-help">
        <h2>Qué pasa después</h2>
        <ol>
          <li>Tu consulta queda abierta y registrada.</li>
          <li>Se asigna a un agente, que te responde por escrito.</li>
          <li>Ves cada respuesta en «Mis consultas» y puedes contestar.</li>
        </ol>
      </aside>
      </div>
    </main>
  );
}

export default NewTicket;
