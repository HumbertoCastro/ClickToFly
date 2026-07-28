import {
  BookMarked,
  BookOpenText,
  House,
  LibraryBig,
  LogOut,
  Plus,
  Settings2,
  Users,
} from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useApp } from "../context/AppContext";
import { Logo } from "./Logo";

export function AppShell({ children }: { children: React.ReactNode }) {
  const {
    activeProfile,
    activeProfileId,
    profiles,
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

  const profileLabel =
    activeProfileId === "house" ? "Visão da casa" : activeProfile?.name;

  return (
    <div className="app-layout">
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
            <LibraryBig size={19} />
            Minha estante
          </NavLink>
          <NavLink to="/house">
            <House size={19} />
            Casa
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
            {activeProfileId === "house" ? (
              <span className="profile-switch__avatar profile-switch__avatar--house">
                <Users size={18} />
              </span>
            ) : (
              <span
                className="profile-switch__avatar"
                style={{ backgroundColor: activeProfile?.color ?? "#4A5D4E" }}
              >
                {activeProfile?.initials ?? "EC"}
              </span>
            )}
            <span>
              <small>Perfil atual</small>
              <strong>{profileLabel ?? "Escolher perfil"}</strong>
            </span>
            <Settings2 size={16} aria-hidden="true" />
          </button>
          <div className="sidebar__footnote">
            <span
              className={`connection-dot connection-dot--${mode}`}
              aria-hidden="true"
            />
            {isDemo ? "Demonstração local" : mode === "supabase" ? "Nuvem ativa" : "Dados neste navegador"}
          </div>
          <button
            className="sidebar__logout"
            type="button"
            onClick={handleLogout}
          >
            <LogOut size={16} />
            Sair da casa
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
          <span
            style={{
              backgroundColor:
                activeProfileId === "house"
                  ? "#DDE6DF"
                  : activeProfile?.color ?? "#4A5D4E",
            }}
          >
            {activeProfileId === "house" ? (
              <Users size={16} />
            ) : (
              activeProfile?.initials ?? "EC"
            )}
          </span>
          {profileLabel}
        </button>
      </header>

      <main className="main-content">{children}</main>

      <nav className="mobile-nav" aria-label="Navegação móvel">
        <NavLink end to="/">
          <BookMarked size={20} />
          <span>Início</span>
        </NavLink>
        <NavLink to="/library">
          <LibraryBig size={20} />
          <span>Estante</span>
        </NavLink>
        <NavLink className="mobile-nav__add" to="/books/new">
          <Plus size={23} />
          <span>Adicionar</span>
        </NavLink>
        <NavLink to="/house">
          <House size={20} />
          <span>Casa</span>
        </NavLink>
        <NavLink to="/manage-profiles">
          <Users size={20} />
          <span>Perfis</span>
        </NavLink>
      </nav>

      {profiles.length === 0 && <span hidden>Nenhum perfil ativo</span>}
    </div>
  );
}
