import { useState } from "react";

function cuando(valor) {
  return new Date(valor).toLocaleString("es-GT");
}

// El historial del incidente y el formulario para agregarle entradas.
// Recibe la lista ya cargada para que el detalle sea el único que habla
// con la API y no haya dos componentes pidiendo lo mismo.
export default function Bitacora({
  comentarios,
  personas,
  bloqueada,
  onAgregar
}) {
  const [autor, setAutor] = useState("");
  const [cuerpo, setCuerpo] = useState("");
  const [enviando, setEnviando] = useState(false);
  const [error, setError] = useState(null);

  async function enviar(evento) {
    evento.preventDefault();
    setEnviando(true);
    setError(null);

    try {
      await onAgregar({ autor, cuerpo });
      setCuerpo("");
    } catch (e) {
      setError(e.detalles?.[0]?.mensaje || e.message);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <section className="bitacora">
      <h2>Bitácora</h2>

      {comentarios.length === 0 ? (
        <p className="vacio">Todavía no hay entradas en la bitácora.</p>
      ) : (
        <ol className="entradas">
          {comentarios.map((c) => (
            <li key={c.id}>
              <div className="entrada-cabecera">
                <strong>{c.autor}</strong>
                <span className="entrada-fecha">{cuando(c.creado_en)}</span>
              </div>
              <p>{c.cuerpo}</p>
            </li>
          ))}
        </ol>
      )}

      {bloqueada ? (
        <p className="vacio">
          El incidente está cerrado. La bitácora queda como registro y ya no
          admite entradas nuevas.
        </p>
      ) : (
        <form className="form-bitacora" onSubmit={enviar}>
          {error && <p className="aviso error">{error}</p>}

          <select value={autor} onChange={(e) => setAutor(e.target.value)}>
            <option value="">¿Quién escribe?</option>
            <optgroup label="Usuarios">
              {personas.usuarios.map((u) => (
                <option key={`u${u.id}`} value={u.nombre}>
                  {u.nombre}
                </option>
              ))}
            </optgroup>
            <optgroup label="Técnicos">
              {personas.tecnicos.map((t) => (
                <option key={`t${t.id}`} value={t.nombre}>
                  {t.nombre}
                </option>
              ))}
            </optgroup>
          </select>

          <textarea
            rows={3}
            value={cuerpo}
            onChange={(e) => setCuerpo(e.target.value)}
            placeholder="Qué pasó, qué se intentó, qué falta"
          />

          <div className="acciones">
            <button type="submit" disabled={enviando || !autor || !cuerpo.trim()}>
              {enviando ? "Guardando…" : "Agregar a la bitácora"}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
