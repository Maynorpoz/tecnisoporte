import { Routes, Route, Link, NavLink } from "react-router-dom";
import ListaIncidentes from "./pages/ListaIncidentes.jsx";
import DetalleIncidente from "./pages/DetalleIncidente.jsx";
import NuevoIncidente from "./pages/NuevoIncidente.jsx";

export default function App() {
  return (
    <div className="app">
      <header className="barra">
        <Link to="/" className="marca">
          TecniSoporte
        </Link>
        <nav>
          <NavLink to="/" end>
            Incidentes
          </NavLink>
          <NavLink to="/incidentes/nuevo" className="boton-nav">
            Reportar incidente
          </NavLink>
        </nav>
      </header>

      <main className="contenido">
        <Routes>
          <Route path="/" element={<ListaIncidentes />} />
          <Route path="/incidentes/nuevo" element={<NuevoIncidente />} />
          <Route path="/incidentes/:id" element={<DetalleIncidente />} />
          <Route path="*" element={<p>Esta página no existe.</p>} />
        </Routes>
      </main>
    </div>
  );
}
