import { useState } from "react";
import { Archive, ArrowLeft, Pencil, Plus, RotateCcw } from "lucide-react";
import { Link } from "react-router-dom";
import { ProfileForm } from "../components/ProfileForm";
import { useApp } from "../context/AppContext";
import type { Profile } from "../types";

export function ProfilesPage() {
  const {
    profiles,
    archivedProfiles,
    joinedEntries,
    saveProfile,
    archiveProfile,
  } = useApp();
  const [editing, setEditing] = useState<Profile | "new" | null>(null);

  return (
    <div className="page profiles-page">
      <header className="page-heading">
        <div>
          <p className="eyebrow">LEITORES DA CASA</p>
          <h1>Gerenciar perfis</h1>
          <p>As estantes permanecem guardadas quando um perfil é arquivado.</p>
        </div>
        <Link className="back-link" to="/profiles">
          <ArrowLeft size={17} /> Voltar ao seletor
        </Link>
      </header>

      <div className="profiles-layout">
        <section>
          <div className="section-heading">
            <div>
              <p className="eyebrow">PERFIS ATIVOS</p>
              <h2>Quem está lendo</h2>
            </div>
            <button
              className="button button--primary"
              type="button"
              onClick={() => setEditing("new")}
            >
              <Plus size={17} /> Novo perfil
            </button>
          </div>
          <div className="profiles-list">
            {profiles.map((profile) => {
              const total = joinedEntries.filter(
                (item) => item.profile.id === profile.id,
              ).length;
              return (
                <article className="profile-list-card" key={profile.id}>
                  <span
                    className="profile-list-card__avatar"
                    style={{ backgroundColor: profile.color }}
                  >
                    {profile.initials}
                  </span>
                  <div>
                    <h3>{profile.name}</h3>
                    <p>
                      {total} {total === 1 ? "livro" : "livros"} na estante
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setEditing(profile)}
                    aria-label={`Editar perfil de ${profile.name}`}
                  >
                    <Pencil size={16} /> Editar
                  </button>
                  <button
                    className="archive-button"
                    type="button"
                    onClick={() => archiveProfile(profile.id, true)}
                    aria-label={`Arquivar perfil de ${profile.name}`}
                  >
                    <Archive size={16} /> Arquivar
                  </button>
                </article>
              );
            })}
          </div>
        </section>

        {archivedProfiles.length > 0 && (
          <section className="archived-section">
            <p className="eyebrow">ARQUIVO</p>
            <h2>Perfis arquivados</h2>
            <div className="profiles-list">
              {archivedProfiles.map((profile) => (
                <article className="profile-list-card is-archived" key={profile.id}>
                  <span
                    className="profile-list-card__avatar"
                    style={{ backgroundColor: profile.color }}
                  >
                    {profile.initials}
                  </span>
                  <div>
                    <h3>{profile.name}</h3>
                    <p>Estante preservada</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => archiveProfile(profile.id, false)}
                  >
                    <RotateCcw size={16} /> Reativar
                  </button>
                </article>
              ))}
            </div>
          </section>
        )}
      </div>

      {editing && (
        <div className="modal-backdrop" role="presentation">
          <div
            className="modal-card"
            role="dialog"
            aria-modal="true"
            aria-labelledby="profile-modal-title"
          >
            <p className="eyebrow">MARCADOR PESSOAL</p>
            <h2 id="profile-modal-title">
              {editing === "new" ? "Novo perfil" : `Editar ${editing.name}`}
            </h2>
            <ProfileForm
              profile={editing === "new" ? undefined : editing}
              onCancel={() => setEditing(null)}
              onSubmit={async (input) => {
                await saveProfile(
                  input,
                  editing === "new" ? undefined : editing.id,
                );
                setEditing(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
