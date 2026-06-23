import { Link } from "react-router-dom";

export function NotFoundPage() {
  return (
    <section className="center-screen">
      <div className="status-box">
        <strong>Ruta no encontrada</strong>
        <p>La consola no tiene una pantalla para esta direccion.</p>
        <Link className="btn primary" to="/dashboard">
          Ir al dashboard
        </Link>
      </div>
    </section>
  );
}
