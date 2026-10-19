import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, CATEGORIAS, PRIORIDADES } from "../api/client.js";

const VACIO = {
  titulo: "",
  descripcion: "",
  categoria: "",
  prioridad: "MEDIA",
  usuario_id: ""
};

export default function NuevoIncidente() {
  const navegar = useNavigate();
  const [form, setForm] = useState(VACIO);
  const [usuarios, setUsuarios] = useState([]);
  const [errores, setErrores] = useState({});
  const [errorGeneral, setErrorGeneral] = useState(null);
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    api
      .listarUsuarios()
      .then(setUsuarios)
      .catch(() => setErrorGeneral("No se pudo cargar la lista de usuarios."));
  }, []);

  function cambiar(campo, valor) {
    setForm((f) => ({ ...f, [campo]: valor }));
    // Al corregir un campo se le quita el error, para que el mensaje no
    // se quede pegado mientras el usuario escribe.
    setErrores((e) => ({ ...e, [campo]: undefined }));
  }

  async function enviar(evento) {
    evento.preventDefault();
    setEnviando(true);
    setErrores({});
    setErrorGeneral(null);

    try {
      const creado = await api.crearIncidente({
        titulo: form.titulo,
        descripcion: form.descripcion,
        categoria: form.categoria,
        prioridad: form.prioridad,
        // El select devuelve texto y la API exige un entero.
        usuario_id: form.usuario_id === "" ? null : Number(form.usuario_id)
      });
      navegar(`/incidentes/${creado.id}`);
    } catch (e) {
      if (e.detalles?.length) {
        const porCampo = {};
        e.detalles.forEach((d) => {
          porCampo[d.campo] = d.mensaje;
        });
        setErrores(porCampo);
      } else {
        setErrorGeneral(e.message);
      }
      setEnviando(false);
    }
  }

  return (
    <section>
      <div className="encabezado-seccion">
        <h1>Reportar incidente</h1>
      </div>

      {errorGeneral && <p className="aviso error">{errorGeneral}</p>}

      <form className="formulario" onSubmit={enviar} noValidate>
        <label>
          Título
          <input
            type="text"
            value={form.titulo}
            onChange={(e) => cambiar("titulo", e.target.value)}
            placeholder="Describe el problema en pocas palabras"
          />
          {errores.titulo && <span className="error-campo">{errores.titulo}</span>}
        </label>

        <label>
          Descripción
          <textarea
            rows={5}
            value={form.descripcion}
            onChange={(e) => cambiar("descripcion", e.target.value)}
            placeholder="Qué pasó, desde cuándo y a quién afecta"
          />
          {errores.descripcion && (
            <span className="error-campo">{errores.descripcion}</span>
          )}
        </label>

        <div className="fila">
          <label>
            Categoría
            <select
              value={form.categoria}
              onChange={(e) => cambiar("categoria", e.target.value)}
            >
              <option value="">Selecciona una</option>
              {CATEGORIAS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            {errores.categoria && (
              <span className="error-campo">{errores.categoria}</span>
            )}
          </label>

          <label>
            Prioridad
            <select
              value={form.prioridad}
              onChange={(e) => cambiar("prioridad", e.target.value)}
            >
              {PRIORIDADES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
            {errores.prioridad && (
              <span className="error-campo">{errores.prioridad}</span>
            )}
          </label>
        </div>

        <label>
          Reportado por
          <select
            value={form.usuario_id}
            onChange={(e) => cambiar("usuario_id", e.target.value)}
          >
            <option value="">Selecciona un usuario</option>
            {usuarios.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nombre}
              </option>
            ))}
          </select>
          {errores.usuario_id && (
            <span className="error-campo">{errores.usuario_id}</span>
          )}
        </label>

        <div className="acciones">
          <button type="submit" disabled={enviando}>
            {enviando ? "Guardando…" : "Reportar incidente"}
          </button>
        </div>
      </form>
    </section>
  );
}
