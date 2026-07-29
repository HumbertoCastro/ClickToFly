import { useState } from "react";
import { ArrowRight, BookOpen, LockKeyhole } from "lucide-react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { Logo } from "../components/Logo";
import { useApp } from "../context/AppContext";

export function LoginPage() {
  const { authenticated, loading, mode, isDemo, signIn } = useApp();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const requestedReturnTo = searchParams.get("returnTo");
  const returnTo =
    requestedReturnTo?.startsWith("/") && !requestedReturnTo.startsWith("//")
      ? requestedReturnTo
      : null;
  const profileRoute = returnTo
    ? `/profiles?returnTo=${encodeURIComponent(returnTo)}`
    : "/profiles";

  if (authenticated) return <Navigate to={profileRoute} replace />;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");
    try {
      await signIn(password);
      navigate(profileRoute);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Não foi possível entrar.",
      );
    }
  }

  return (
    <main className="login-page">
      <section className="login-visual" aria-label="Entre Capítulos">
        <div className="login-visual__header">
          <Logo />
          <span className="edition-label">EDIÇÃO DA CASA · 2026</span>
        </div>
        <div className="login-visual__copy">
          <p className="eyebrow">UMA BIBLIOTECA PARA CHAMAR DE NOSSA</p>
          <h1>
            Histórias passam.
            <br />
            O que elas deixam,
            <br />
            <em>fica aqui.</em>
          </h1>
          <p>
            Guarde leituras, impressões e pequenas memórias — uma página de
            cada vez.
          </p>
        </div>
        <div className="book-still-life" aria-hidden="true">
          <div className="book-spine book-spine--one">
            <span>MEMÓRIAS</span>
          </div>
          <div className="book-spine book-spine--two">
            <span>FICÇÃO</span>
          </div>
          <div className="book-spine book-spine--three">
            <span>IDEIAS</span>
          </div>
          <div className="bookmark-ribbon">EC</div>
        </div>
        <p className="login-visual__note">Para livros que continuam com você.</p>
      </section>

      <section className="login-panel">
        <div className="login-panel__inner">
          <span className="login-panel__chapter">CAPÍTULO 01</span>
          <span className="login-panel__icon">
            <BookOpen size={24} />
          </span>
          <h2>Entre na sua biblioteca</h2>
          <p>
            Use a senha da casa. Depois, é só escolher quem está lendo.
          </p>
          <form onSubmit={handleSubmit}>
            <label className="field">
              <span>Senha da casa</span>
              <div className="input-with-icon">
                <LockKeyhole size={18} />
                <input
                  autoComplete="current-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Digite sua senha"
                  minLength={6}
                  required
                />
              </div>
            </label>
            {error && <p className="form-error">{error}</p>}
            <button
              className="button button--primary button--wide"
              type="submit"
              disabled={loading}
            >
              {loading ? "Abrindo a estante…" : "Entrar na biblioteca"}
              <ArrowRight size={18} />
            </button>
          </form>
          {mode === "local" && !isDemo && (
            <div className="local-notice">
              <strong>Modo local</strong>
              <p>
                No primeiro acesso, a senha digitada será criada neste
                navegador. Para compartilhar entre dispositivos, conecte o
                Supabase.
              </p>
            </div>
          )}
          <p className="login-panel__privacy">
            Ambiente privado · sem cadastro público
          </p>
        </div>
      </section>
    </main>
  );
}
