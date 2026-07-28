import { ArrowRight } from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";
import { LibraryBackdrop } from "../components/LibraryBackdrop";
import { Logo } from "../components/Logo";
import { ProfileAvatar } from "../components/ProfileAvatar";
import { useApp } from "../context/AppContext";

export function ProfilePickerPage() {
  const { authenticated, profiles, selectProfile, mode, isDemo } = useApp();
  const navigate = useNavigate();

  if (!authenticated) return <Navigate to="/login" replace />;

  function chooseProfile(id: string) {
    selectProfile(id);
    navigate("/");
  }

  return (
    <main className="profile-picker-page">
      <LibraryBackdrop />
      <header className="profile-picker__header">
        <Logo />
        <span className="edition-label">
          {isDemo
            ? "DEMONSTRAÇÃO LOCAL"
            : mode === "supabase"
              ? "NUVEM ATIVA"
              : "MODO LOCAL"}
        </span>
      </header>
      <section className="profile-picker__content">
        <p className="eyebrow">UMA BIBLIOTECA, DUAS ESTANTES</p>
        <h1>Quem vai ler agora?</h1>
        <p className="profile-picker__intro">
          Humberto e Ana guardam suas leituras separadamente. Na Biblioteca, as
          duas histórias aparecem lado a lado.
        </p>

        {profiles.length === 0 ? (
          <div className="profile-picker__empty" role="status">
            <strong>Os perfis fixos não foram carregados.</strong>
            <span>Atualize a página para tentar novamente.</span>
          </div>
        ) : (
          <div className="profile-grid">
            {profiles.map((profile, index) => (
              <button
                key={profile.id}
                className="profile-card"
                type="button"
                onClick={() => chooseProfile(profile.id)}
              >
                <span className="profile-card__number">
                  PERFIL {String(index + 1).padStart(2, "0")}
                </span>
                <ProfileAvatar
                  profile={profile}
                  className="profile-card__avatar"
                />
                <strong>{profile.name}</strong>
                <span className="profile-card__caption">
                  Estante de {profile.name}
                </span>
                <span className="profile-card__action">
                  Entrar na estante <ArrowRight size={15} />
                </span>
              </button>
            ))}
          </div>
        )}
      </section>
      <footer className="profile-picker__footer">
        ENTRE CAPÍTULOS <span>·</span> SUA BIBLIOTECA COMPARTILHADA
      </footer>
    </main>
  );
}
