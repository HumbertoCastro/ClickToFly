import { BookHeart, LibraryBig, LogIn, ShoppingBag } from "lucide-react";
import { Link, NavLink } from "react-router-dom";
import { AmazonDisclosure } from "./AmazonDisclosure";
import { LibraryBackdrop } from "./LibraryBackdrop";
import { Logo } from "./Logo";

export interface PublicStoreShellProps {
  children: React.ReactNode;
  accountHref?: string;
  accountLabel?: string;
  offerCount?: number;
}

export function PublicStoreShell({
  children,
  accountHref = "/login",
  accountLabel = "Entrar",
  offerCount = 0,
}: PublicStoreShellProps) {
  return (
    <div className="public-store-shell">
      <LibraryBackdrop variant="app" />
      <header className="store-header">
        <div className="store-header__inner">
          <Logo to="/livraria" />
          <nav className="store-header__nav" aria-label="Navegação da livraria">
            <NavLink to="/livraria">
              <ShoppingBag size={17} aria-hidden="true" />
              Livraria
            </NavLink>
            <NavLink to="/ofertas">
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
              Descobertas para a próxima leitura, com compra concluída
              diretamente na Amazon.
            </p>
          </div>
          <AmazonDisclosure />
        </div>
      </footer>
    </div>
  );
}
