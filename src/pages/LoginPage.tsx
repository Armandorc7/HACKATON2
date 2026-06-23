import { useMemo, useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import { ApiError, apiBaseUrl } from "../api/client";
import { useAuth } from "../auth/AuthContext";

export function LoginPage() {
  const { token, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [teamCode, setTeamCode] = useState("");
  const [email, setEmail] = useState("operator@tuckersoft.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const from = useMemo(() => {
    const state = location.state as { from?: string } | null;
    return state?.from ?? "/dashboard";
  }, [location.state]);

  if (token) return <Navigate to="/dashboard" replace />;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(teamCode, email, password);
      navigate(from, { replace: true });
    } catch (caught: unknown) {
      setError(caught instanceof ApiError ? caught.message : "No se pudo iniciar sesion");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="login-screen">
      <section className="login-card" aria-labelledby="login-title">
        <div className="brand login-brand">
          <span className="brand-mark">TC</span>
          <div>
            <strong>TropelCare</strong>
            <small>Control Room</small>
          </div>
        </div>
        <h1 id="login-title">Ingreso de operador</h1>
        <p className="muted">Usa las credenciales del workspace asignado por el equipo docente.</p>
        <form className="form-grid" onSubmit={handleSubmit}>
          <label>
            Team code
            <input
              autoComplete="organization"
              inputMode="text"
              placeholder="TEAM-0XX"
              required
              pattern="TEAM-[0-9]{3}"
              value={teamCode}
              onChange={(event) => setTeamCode(event.target.value.toUpperCase())}
            />
          </label>
          <label>
            Email
            <input
              autoComplete="email"
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label>
            Password
            <input
              autoComplete="current-password"
              required
              type="password"
              placeholder="Pizza-TEAM-0XX"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          {error ? <p className="form-error">{error}</p> : null}
          <button className="btn primary wide" type="submit" disabled={loading}>
            {loading ? "Ingresando..." : "Entrar"}
          </button>
        </form>
        <small className="api-footnote">API: {apiBaseUrl}</small>
      </section>
    </main>
  );
}
