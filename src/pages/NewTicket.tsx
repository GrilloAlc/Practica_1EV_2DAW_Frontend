import { useEffect, useState } from 'react';
import type { SyntheticEvent } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { createTicket, useTicketOptions } from '../api/tickets';
import { getProperty } from '../api/properties';
import { getErrorMessage } from '../api/client';
import { TICKET_CATEGORIES, categoryLabels, formatPrice } from '../utils/labels';
import { coverPhoto, typeImage } from '../utils/photos';
import Photo from '../components/Photo';
import type { Property } from '../types';

const MIN_DESCRIPTION = 10;
const MAX_DESCRIPTION = 2000;

function NewTicket() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const propertyId = searchParams.get('casa');
  // Si se viene de crear la cuenta (se pidió una consulta sin sesión), se da la bienvenida
  const welcome = (useLocation().state as { welcome?: string } | null)?.welcome;

  // El asunto puede venir ya escrito desde una casa (?asunto=...)
  const [subject, setSubject] = useState((searchParams.get('asunto') || '').slice(0, 200));
  const [category, setCategory] = useState(
    TICKET_CATEGORIES.includes(searchParams.get('categoria') || '') ? searchParams.get('categoria')! : 'CONSULTA_PROPIEDAD',
  );
  const [description, setDescription] = useState('');
  // Categorías válidas según el backend (GET /tickets/options)
  const { categories } = useTicketOptions();
  const [property, setProperty] = useState<Property | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  // Si se pregunta por una casa, se enseña cuál es (y su enlace va en la consulta para el agente)
  useEffect(() => {
    if (!propertyId) return;
    let current = true;
    getProperty(propertyId).then(
      (p) => {
        if (current) setProperty(p);
      },
      () => {
        // Si la casa ya no está publicada, la consulta se puede escribir igual
      },
    );
    return () => {
      current = false;
    };
  }, [propertyId]);

  const link = property ? `${window.location.origin}/propiedades/${property._id}` : '';
  // La consulta no guarda a qué casa se refiere: el enlace se añade al final del texto
  const finalDescription = description.trim() + (property ? `\n\nCasa: ${property.title}\n${link}` : '');

  async function handleSubmit(e: SyntheticEvent) {
    e.preventDefault();
    if (sending) return;
    if (!subject.trim()) {
      setError('Escribe un asunto para tu consulta.');
      return;
    }
    if (description.trim().length < MIN_DESCRIPTION) {
      setError(`La descripción debe tener al menos ${MIN_DESCRIPTION} caracteres.`);
      return;
    }
    if (finalDescription.length > MAX_DESCRIPTION) {
      setError(`La descripción es demasiado larga: como mucho ${MAX_DESCRIPTION} caracteres.`);
      return;
    }

    setSending(true);
    try {
      const ticket = await createTicket({ subject: subject.trim(), description: finalDescription, category });
      // La consulta se abre con un aviso de que ha llegado bien
      navigate('/mis-tickets/' + ticket._id, { replace: true, state: { created: true } });
    } catch (err) {
      setError(getErrorMessage(err));
      setSending(false);
    }
  }

  // Lo que se puede escribir: el máximo menos lo que ocupa el enlace de la casa
  const maxLength = MAX_DESCRIPTION - (finalDescription.length - description.trim().length);

  return (
    <main className="page">
      <title>Nueva consulta · CataHome</title>
      <p className="breadcrumb"><Link to="/mis-tickets">Mis consultas</Link> / Nueva consulta</p>
      <h1 className="page-title">Nueva consulta</h1>
      <p className="page-subtitle">Cuéntanos qué necesitas. Un agente te responde, normalmente en menos de 24 horas.</p>
      {welcome && <p className="notice" role="status">Te damos la bienvenida, {welcome}. Ya puedes enviar tu consulta.</p>}

      <div className="new-ticket">
        <form className="form-box" onSubmit={handleSubmit}>
          {property && (
            <Link to={`/propiedades/${property._id}`} className="new-ticket-property">
              <Photo src={coverPhoto(property)} fallback={typeImage(property.type)} pixels={240} alt="" width={96} height={72} sizes="96px" />
              <span>
                <span className="new-ticket-property-label">Preguntas por</span>
                <strong>{property.title}</strong>
                <span>{property.address.city} · {formatPrice(property)}</span>
              </span>
            </Link>
          )}
          <label className="field">
            Asunto
            <input name="subject" required maxLength={200} placeholder="Por ejemplo: visita al piso de la calle Mayor" value={subject} onChange={(e) => setSubject(e.target.value)} />
          </label>
          <label className="field">
            Categoría
            <select name="category" value={category} onChange={(e) => setCategory(e.target.value)}>
              {categories.map((c) => (
                <option key={c} value={c}>{categoryLabels[c] || c}</option>
              ))}
            </select>
          </label>
          <label className="field">
            Descripción
            <textarea
              name="description"
              required
              maxLength={Math.max(maxLength, MIN_DESCRIPTION)}
              placeholder="Qué quieres saber, cuándo te viene bien una visita, cómo prefieres que te contactemos…"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
            <span className="field-help">
              {description.length} / {maxLength} caracteres. Mínimo {MIN_DESCRIPTION}.{property ? ' El enlace de la casa se añade solo.' : ''}
            </span>
          </label>
          {error && <p className="field-error" role="alert">{error}</p>}
          <button type="submit" className="btn btn-acento" disabled={sending}>{sending ? 'Enviando…' : 'Enviar consulta'}</button>
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
