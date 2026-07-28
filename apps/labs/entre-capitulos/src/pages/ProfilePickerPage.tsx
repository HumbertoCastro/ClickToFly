import { useState } from "react";
import { ArrowRight, Plus, Users } from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";
import { Logo } from "../components/Logo";
import { ProfileForm } from "../components/ProfileForm";
import { useApp } from "../context/AppContext";

export function ProfilePickerPage() {
  const {
    authenticated,
    profiles,
    selectProfile,
    saveProfile,
    mode,
    isDemo,
  } = useApp();
  const navigate = useNavigate();
  const [creating, setCreating] = useState(profiles.length === 0);

  if (!authenticated) return <Navigate to="/login" replace />;

  function chooseProfile(id: string | "house") {
    selectProfile(id);
    navigate(id === "house" ? "/house" : "/");
  }

  return (
    <main className="profile-picker-page">
      <header className="profile-picker__header">
        <Logo />
        <span className="edition-label">
          {isDemo ? "DEMONSTRAÇÃO LOCAL" : mode === "supabase" ? "NUVEM ATIVA" : "MODO LOCAL"}
        </span>
      </header>
      <section className="profile-picker__content">
        <p className="eyebrow">ANTES DE ABRIR O LIVRO</p>
        <h1>{profiles.length === 0 ? "Crie seu primeiro perfil" : "Quem está lendo?"}</h1>
        <p className="profile-picker__intro">
          Cada pessoa tem sua própria estante, mas as histórias também podem ser
          vistas juntas.
        </p>

        {creating ? (
          <div className="profile-create-card">
            <span className="profile-create-card__number">01</span>
            <ProfileForm
              submitLabel={profiles.length === 0 ? "Criar e continuar" : "Criar perfil"}
              onCancel={
                profiles.length > 0 ? () => setCreating(false) : undefined
              }
              onSubmit={async (input) => {
                const profile = await saveProfile(input);
                chooseProfile(profile.id);
              }}
            />
          </div>
        ) : (
          <>
            <div className="profile-grid">
              {profiles.map((profile, index) => (
                <button
                  key={profile.id}
                  className="profile-card"
                  type="button"
                  onClick={() => chooseProfile(profile.id)}
                >
                  <span className="profile-card__number">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span
                    className="profile-card__avatar"
                    style={{ backgroundColor: profile.color }}
                  >
                    {profile.initials}
                  </span>
                  <strong>{profile.name}</strong>
                  <span className="profile-card__action">
                    Abrir estante <ArrowRight size={15} />
                  </span>
                </button>
              ))}
              <button
                className="profile-card profile-card--house"
                type="button"
                onClick={() => chooseProfile("house")}
              >
                <span className="profile-card__number">TODOS</span>
                <span className="profile-card__avatar">
                  <Users size={28} />
                </span>
                <strong>Casa</strong>
                <span className="profile-card__action">
                  Ver tudo <ArrowRight size={15} />
                </span>
              </button>
              <button
                className="profile-card profile-card--new"
                type="button"
                onClick={() => setCreating(true)}
              >
                <span className="profile-card__avatar">
                  <Plus size={28} />
                </span>
                <strong>Novo perfil</strong>
                <span>Adicionar outra pessoa</span>
              </button>
            </div>
            <button
              className="text-button"
              type="button"
              onClick={() => navigate("/manage-profiles")}
            >
              Gerenciar perfis
            </button>
          </>
        )}
      </section>
      <footer className="profile-picker__footer">
        ENTRE CAPÍTULOS <span>·</span> SUA BIBLIOTECA COMPARTILHADA
      </footer>
    </main>
  );
}
