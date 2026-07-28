import { Link } from "react-router-dom";

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link className={`logo ${compact ? "logo--compact" : ""}`} to="/">
      <span className="logo__mark" aria-hidden="true">
        <span>EC</span>
      </span>
      {!compact && (
        <span className="logo__type">
          <strong>Entre</strong>
          <em>Capítulos</em>
        </span>
      )}
      <span className="sr-only">Entre Capítulos — início</span>
    </Link>
  );
}
