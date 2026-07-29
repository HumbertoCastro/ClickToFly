import { useState, type FormEvent } from "react";
import {
  Bell,
  BookMarked,
  BookOpenText,
  ChevronsUpDown,
  Compass,
  LibraryBig,
  LogOut,
  Plus,
  Search,
  SlidersHorizontal,
  UserRound,
} from "lucide-react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { LibraryBackdrop } from "./LibraryBackdrop";
import { Logo } from "./Logo";
import { ProfileAvatar } from "./ProfileAvatar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const {
    activeProfile,
    joinedEntries,
    mode,
    isDemo,
    selectProfile,
    signOut,
  } = useApp();
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");

  async function handleLogout() {
    await signOut();
    navigate("/login");
  }

  const profileLabel = activeProfile?.name;
  const readingListCount = activeProfile
    ? joinedEntries.filter(
        (item) =>
          item.profile.id === activeProfile.id &&
          item.entry.status === "want_to_read",
      ).length
    : 0;

  function handleSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = searchQuery.trim();
    navigate(
      query ? `/livraria?q=${encodeURIComponent(query)}` : "/livraria",
    );
  }

  return (
    <div className="app-layout">
      <LibraryBackdrop variant="app" />
      <aside className="sidebar">
        <Logo />
        <div className="sidebar__chapter">
          <span>CAP. 01</span>
          <p>Sua biblioteca</p>
        </div>
        <nav className="sidebar__nav" aria-label="Navegação principal">
          <NavLink end to="/">
            <BookOpenText size={19} />
            Início
          </NavLink>
          <NavLink to="/library">
            <BookMarked size={19} />
            Minha estante
          </NavLink>
          <NavLink to="/livraria">
            <Compass size={19} />
            Livraria
          </NavLink>
          <NavLink to="/biblioteca">
            <LibraryBig size={19} />
            Biblioteca
          </NavLink>
          <NavLink to="/curadoria">
            <SlidersHorizontal size={19} />
            Curadoria
          </NavLink>
        </nav>

        <NavLink className="button button--primary sidebar__add" to="/books/new">
          <Plus size={18} />
          Adicionar livro
        </NavLink>

        <div className="sidebar__spacer" />
        <div className="sidebar__profile">
          <button
            className="profile-switch"
            type="button"
            onClick={() => {
              selectProfile(null);
              navigate("/profiles");
            }}
          >
            {activeProfile ? (
              <ProfileAvatar
                profile={activeProfile}
                className="profile-switch__avatar"
                decorative
              />
            ) : (
              <span className="profile-switch__avatar">EC</span>
            )}
            <span>
              <small>Perfil atual</small>
              <strong>{profileLabel ?? "Escolher perfil"}</strong>
            </span>
            <ChevronsUpDown size={16} aria-hidden="true" />
          </button>
          <div className="sidebar__footnote">
            <span
              className={`connection-dot connection-dot--${mode}`}
              aria-hidden="true"
            />
            {isDemo
              ? "Demonstração local"
              : mode === "supabase"
                ? "Nuvem ativa"
                : "Dados neste navegador"}
          </div>
          <button
            className="sidebar__logout"
            type="button"
            onClick={handleLogout}
          >
            <LogOut size={16} />
            Encerrar sessão
          </button>
        </div>
      </aside>

      <header className="mobile-header">
        <Logo compact />
        <button
          className="mobile-profile"
          type="button"
          onClick={() => navigate("/profiles")}
          aria-label={`Trocar perfil. Perfil atual: ${profileLabel}`}
        >
          {activeProfile ? (
            <ProfileAvatar
              profile={activeProfile}
              className="mobile-profile__avatar"
              decorative
            />
          ) : (
            <span className="mobile-profile__avatar">EC</span>
          )}
          {profileLabel}
        </button>
      </header>

      <div className="content-column">
        <header className="app-toolbar">
          <form className="app-search" role="search" onSubmit={handleSearch}>
            <Search size={20} aria-hidden="true" />
            <label className="sr-only" htmlFor="app-search-input">
              Buscar livros ou autores
            </label>
            <input
              id="app-search-input"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Buscar livros, autores..."
            />
          </form>
          <Link
            className="toolbar-action"
            to="/onde-comprar"
            aria-label={`${readingListCount} ${
              readingListCount === 1 ? "livro" : "livros"
            } para localizar em lojas externas`}
          >
            <Bell size={19} aria-hidden="true" />
            {readingListCount > 0 && (
              <span aria-hidden="true">{readingListCount}</span>
            )}
          </Link>
          <button
            className="toolbar-action"
            type="button"
            onClick={() => {
              selectProfile(null);
              navigate("/profiles");
            }}
            aria-label={`Trocar perfil. Perfil atual: ${
              profileLabel ?? "nenhum"
            }`}
          >
            <UserRound size={19} aria-hidden="true" />
          </button>
          <Link
            className="toolbar-action toolbar-action--curation"
            to="/curadoria"
            aria-label="Abrir o painel de curadoria"
          >
            <SlidersHorizontal size={19} aria-hidden="true" />
          </Link>
        </header>

        <main className="main-content">{children}</main>
      </div>

      <nav className="mobile-nav" aria-label="Navegação móvel">
        <NavLink end to="/">
          <BookOpenText size={20} />
          <span>Início</span>
        </NavLink>
        <NavLink to="/library">
          <BookMarked size={20} />
          <span>Estante</span>
        </NavLink>
        <NavLink className="mobile-nav__add" to="/books/new">
          <Plus size={23} />
          <span>Adicionar</span>
        </NavLink>
        <NavLink to="/livraria">
          <Compass size={20} />
          <span>Livraria</span>
        </NavLink>
        <NavLink to="/biblioteca">
          <LibraryBig size={20} />
          <span>Biblioteca</span>
        </NavLink>
      </nav>
    </div>
  );
}
