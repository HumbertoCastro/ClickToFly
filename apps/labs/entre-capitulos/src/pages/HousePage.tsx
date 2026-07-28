import { ArrowRight, BookOpenText, LibraryBig, Sparkles, Users } from "lucide-react";
import { Link, Navigate } from "react-router-dom";
import { BookCard } from "../components/BookCard";
import { EmptyState } from "../components/EmptyState";
import { useApp } from "../context/AppContext";

export function HousePage() {
  const { activeProfileId, profiles, joinedEntries, selectProfile } = useApp();

  if (!activeProfileId) {
    selectProfile("house");
  }
  if (profiles.length === 0) return <Navigate to="/profiles" replace />;

  const rated = joinedEntries.filter((item) => item.averageRating !== null);
  const average =
    rated.length > 0
      ? rated.reduce((sum, item) => sum + (item.averageRating ?? 0), 0) /
        rated.length
      : null;

  return (
    <div className="page house-page">
      <header className="page-heading page-heading--house">
        <div>
          <p className="eyebrow">NOSSA BIBLIOTECA</p>
          <h1>
            Histórias da <em>casa inteira.</em>
          </h1>
          <p>
            Uma visão compartilhada, sem misturar as memórias de cada leitor.
          </p>
        </div>
        <div className="house-avatars" aria-label={`${profiles.length} perfis`}>
          {profiles.map((profile) => (
            <span key={profile.id} style={{ backgroundColor: profile.color }}>
              {profile.initials}
            </span>
          ))}
          <strong>{profiles.length} leitores</strong>
        </div>
      </header>

      <section className="house-summary" aria-label="Resumo da casa">
        <div>
          <Users size={22} />
          <span>
            <strong>{profiles.length}</strong>
            perfis ativos
          </span>
        </div>
        <div>
          <LibraryBig size={22} />
          <span>
            <strong>{joinedEntries.length}</strong>
            registros
          </span>
        </div>
        <div>
          <BookOpenText size={22} />
          <span>
            <strong>
              {
                joinedEntries.filter(
                  (item) => item.entry.status === "reading",
                ).length
              }
            </strong>
            em leitura
          </span>
        </div>
        <div className="house-summary__rating">
          <Sparkles size={22} />
          <span>
            <strong>
              {average?.toLocaleString("pt-BR", {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1,
              }) ?? "—"}
            </strong>
            média da casa
          </span>
        </div>
      </section>

      {joinedEntries.length === 0 ? (
        <EmptyState
          title="A casa ainda não guardou nenhuma leitura"
          description="Escolha um perfil e adicione a primeira história compartilhada."
        />
      ) : (
        <>
          <section className="profile-shelves">
            {profiles.map((profile, index) => {
              const entries = joinedEntries.filter(
                (item) => item.profile.id === profile.id,
              );
              return (
                <article className="profile-shelf" key={profile.id}>
                  <div className="profile-shelf__identity">
                    <span className="profile-shelf__index">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <span
                      className="profile-shelf__avatar"
                      style={{ backgroundColor: profile.color }}
                    >
                      {profile.initials}
                    </span>
                    <div>
                      <small>ESTANTE DE</small>
                      <h2>{profile.name}</h2>
                      <p>
                        {entries.length}{" "}
                        {entries.length === 1 ? "livro" : "livros"}
                      </p>
                    </div>
                    <button
                      className="text-link"
                      type="button"
                      onClick={() => {
                        selectProfile(profile.id);
                        window.location.hash = "#/library";
                      }}
                    >
                      Abrir estante <ArrowRight size={15} />
                    </button>
                  </div>
                  <div className="profile-shelf__books">
                    {entries.length > 0 ? (
                      entries.slice(0, 3).map((item) => (
                        <BookCard item={item} key={item.entry.id} />
                      ))
                    ) : (
                      <p className="profile-shelf__empty">
                        A primeira história ainda está por vir.
                      </p>
                    )}
                  </div>
                </article>
              );
            })}
          </section>
          <div className="house-page__footer-link">
            <Link className="button button--secondary" to="/library">
              Ver biblioteca completa <ArrowRight size={17} />
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
