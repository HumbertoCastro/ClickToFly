import { ArrowRight, BookOpenText, LibraryBig, Sparkles, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { BookCard } from "../components/BookCard";
import { EmptyState } from "../components/EmptyState";
import { ProfileAvatar } from "../components/ProfileAvatar";
import { useApp } from "../context/AppContext";

export function SharedLibraryPage() {
  const { profiles, joinedEntries, selectProfile } = useApp();
  const navigate = useNavigate();

  const rated = joinedEntries.filter((item) => item.averageRating !== null);
  const average =
    rated.length > 0
      ? rated.reduce((sum, item) => sum + (item.averageRating ?? 0), 0) /
        rated.length
      : null;

  return (
    <div className="page shared-library-page">
      <header className="page-heading page-heading--library">
        <div>
          <p className="eyebrow">NOSSA BIBLIOTECA</p>
          <h1>
            Duas estantes, <em>uma biblioteca.</em>
          </h1>
          <p>
            O resumo das leituras de Humberto e Ana, reunido sem misturar as
            memórias de cada leitor.
          </p>
        </div>
        <div
          className="library-avatars"
          aria-label={`${profiles.length} leitores`}
        >
          {profiles.map((profile) => (
            <ProfileAvatar
              key={profile.id}
              profile={profile}
              className="library-avatars__item"
              decorative
            />
          ))}
          <strong>{profiles.length} leitores</strong>
        </div>
      </header>

      <section className="stats-strip" aria-label="Resumo da biblioteca">
        <article>
          <span className="stats-strip__icon">
            <Users size={22} aria-hidden="true" />
          </span>
          <span>
            <strong>{profiles.length}</strong>
            {profiles.length === 1 ? " leitor" : " leitores"}
            <small>Estantes reunidas</small>
          </span>
        </article>
        <article>
          <span className="stats-strip__icon">
            <LibraryBig size={22} aria-hidden="true" />
          </span>
          <span>
            <strong>{joinedEntries.length}</strong>
            {joinedEntries.length === 1
              ? " livro registrado"
              : " livros registrados"}
            <small>Memórias compartilhadas</small>
          </span>
        </article>
        <article>
          <span className="stats-strip__icon">
            <BookOpenText size={22} aria-hidden="true" />
          </span>
          <span>
            <strong>
              {
                joinedEntries.filter(
                  (item) => item.entry.status === "reading",
                ).length
              }
            </strong>
            lendo agora
            <small>Leituras em andamento</small>
          </span>
        </article>
        <article className="stats-strip__rating">
          <span className="stats-strip__icon">
            <Sparkles size={22} aria-hidden="true" />
          </span>
          <span>
            <strong>
              {average?.toLocaleString("pt-BR", {
                minimumFractionDigits: 1,
                maximumFractionDigits: 1,
              }) ?? "—"}
            </strong>
            média da biblioteca
            <small>
              {rated.length > 0
                ? `${rated.length} ${
                    rated.length === 1 ? "avaliação reunida" : "avaliações reunidas"
                  }`
                : "Avalie suas leituras"}
            </small>
          </span>
        </article>
      </section>

      {joinedEntries.length === 0 ? (
        <EmptyState
          title="A biblioteca ainda não guardou nenhuma leitura"
          description="Escolha Humberto ou Ana e adicione a primeira história."
        />
      ) : (
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
                  <ProfileAvatar
                    profile={profile}
                    className="profile-shelf__avatar"
                  />
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
                      navigate("/library");
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
      )}
    </div>
  );
}
