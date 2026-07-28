import {
  BookMarked,
  BookOpenText,
  ChevronsUpDown,
  LibraryBig,
  LogOut,
  Plus,
  Users,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { LibraryBackdrop } from "./LibraryBackdrop";
import { Logo } from "./Logo";
import { ProfileAvatar } from "./ProfileAvatar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const {
    activeProfile,
    mode,
    isDemo,
    selectProfile,
    signOut,
  } = useApp();
  const navigate = useNavigate();

  async function handleLogout() {
    await signOut();
    navigate("/login");
  }

  const profileLabel = activeProfile?.name;

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
          <NavLink to="/biblioteca">
            <LibraryBig size={19} />
            Biblioteca
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

      <main className="main-content">{children}</main>

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
        <NavLink to="/biblioteca">
          <LibraryBig size={20} />
          <span>Biblioteca</span>
        </NavLink>
        <NavLink to="/profiles">
          <Users size={20} />
          <span>Trocar</span>
        </NavLink>
      </nav>
    </div>
  );
}
