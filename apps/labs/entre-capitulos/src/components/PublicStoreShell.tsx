import {
  BookHeart,
  Compass,
  LibraryBig,
  LogIn,
  ShoppingBag,
} from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import { AmazonDisclosure } from "./AmazonDisclosure";
import { LibraryBackdrop } from "./LibraryBackdrop";
import { Logo } from "./Logo";
import { OpenLibraryDisclosure } from "./OpenLibraryDisclosure";
import { getSupportEmail } from "../lib/publicConfig";

export interface PublicStoreShellProps {
  children: React.ReactNode;
  accountHref?: string;
  accountLabel?: string;
  offerCount?: number;
  provider?: "open_library" | "amazon";
}

export function PublicStoreShell({
  children,
  accountHref = "/login",
  accountLabel = "Entrar",
  offerCount = 0,
  provider = "open_library",
}: PublicStoreShellProps) {
  const supportEmail = getSupportEmail();

  return (
    <div className="public-store-shell">
      <LibraryBackdrop variant="app" />
      <header className="store-header">
        <div className="store-header__inner">
          <div className="store-header__brand">
            <Logo to="/livraria" />
            <span>Pré-produção</span>
          </div>
          <nav className="store-header__nav" aria-label="Navegação da livraria">
            <NavLink to="/livraria">
              {provider === "amazon" ? (
                <ShoppingBag size={17} aria-hidden="true" />
              ) : (
                <Compass size={17} aria-hidden="true" />
              )}
              Livraria
            </NavLink>
            <NavLink to="/onde-comprar">
              <BookHeart size={17} aria-hidden="true" />
              Minha lista
              {offerCount > 0 && (
                <span className="store-header__count" aria-label={`${offerCount} itens`}>
                  {offerCount}
                </span>
              )}
            </NavLink>
            <NavLink to="/library">
              <LibraryBig size={17} aria-hidden="true" />
              Estante
            </NavLink>
          </nav>
          <Link className="button button--secondary store-header__account" to={accountHref}>
            <LogIn size={17} aria-hidden="true" />
            {accountLabel}
          </Link>
        </div>
      </header>

      <main className="public-store-main">{children}</main>

      <footer className="store-footer">
        <div className="store-footer__inner">
          <div>
            <Logo compact to="/livraria" />
            <p>
              {provider === "amazon"
                ? "Descobertas para a próxima leitura, com compra concluída diretamente na Amazon."
                : "Obras para a próxima leitura, com edições e destinos externos reunidos em um catálogo aberto."}
            </p>
            <nav
              className="store-footer__legal"
              aria-label="Informações legais"
            >
              <Link to="/privacidade">Privacidade</Link>
              <Link to="/termos">Termos</Link>
              <a href={`mailto:${supportEmail}`}>Contato</a>
            </nav>
          </div>
          {provider === "amazon" ? (
            <AmazonDisclosure />
          ) : (
            <OpenLibraryDisclosure />
          )}
        </div>
      </footer>
    </div>
  );
}
