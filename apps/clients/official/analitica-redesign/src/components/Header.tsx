import { useState } from "react";
import { Mail, Menu, MessageCircle, Phone, X } from "lucide-react";

import { contact, navItems } from "../data/analitica";
import { defaultQuoteMessage, whatsappHref } from "../lib/contact";
import { assetPath, withBasePath, type NavigateHandler } from "../lib/navigation";
import { Button } from "./ui/button";

type HeaderProps = {
  onNavigate: NavigateHandler;
};

export function Header({ onNavigate }: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/95 backdrop-blur">
      <div className="hidden border-b border-border/70 bg-primary text-primary-foreground lg:block">
        <div className="container flex h-9 items-center justify-end gap-5 text-xs font-medium">
          <a className="flex items-center gap-2 hover:underline" href={contact.phoneHref}>
            <Phone data-icon="inline-start" />
            Central de vendas: {contact.phone}
          </a>
          <a
            className="flex items-center gap-2 hover:underline"
            href={whatsappHref(defaultQuoteMessage)}
            target="_blank"
            rel="noreferrer"
          >
            <MessageCircle data-icon="inline-start" />
            {contact.whatsapp}
          </a>
          <a className="flex items-center gap-2 hover:underline" href={contact.emailHref}>
            <Mail data-icon="inline-start" />
            {contact.email}
          </a>
        </div>
      </div>

      <div className="container flex h-20 items-center justify-between gap-4">
        <a href={withBasePath("/")} onClick={(event) => onNavigate("/", event)} aria-label="Voltar ao início">
          <img
            className="h-12 w-auto sm:h-14"
            src={assetPath("/assets/logo-analitica.png")}
            alt="Analítica"
          />
        </a>

        <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground lg:flex">
          {navItems.map((item) => (
            <a
              key={item.href}
              className="transition-colors hover:text-foreground"
              href={withBasePath(item.href)}
              onClick={(event) => onNavigate(item.href, event)}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          <Button asChild>
            <a
              href={withBasePath("/orcamento")}
              onClick={(event) => onNavigate("/orcamento", event)}
            >
              Solicitar cotação
            </a>
          </Button>
        </div>

        <Button
          aria-controls="mobile-navigation"
          aria-expanded={menuOpen}
          aria-label={menuOpen ? "Fechar navegação" : "Abrir navegação"}
          className="lg:hidden"
          onClick={() => setMenuOpen((current) => !current)}
          size="icon"
          variant="outline"
        >
          {menuOpen ? <X data-icon="inline-start" /> : <Menu data-icon="inline-start" />}
        </Button>
      </div>

      {menuOpen && (
        <nav
          id="mobile-navigation"
          className="border-t border-border bg-background px-4 pb-5 lg:hidden"
        >
          <div className="mx-auto flex max-w-md flex-col gap-2 pt-4">
            <a
              className="rounded-xl px-3 py-3 text-sm font-semibold text-foreground hover:bg-secondary"
              href={withBasePath("/")}
              onClick={(event) => {
                onNavigate("/", event);
                setMenuOpen(false);
              }}
            >
              Home
            </a>
            {navItems.map((item) => (
              <a
                key={item.href}
                className="rounded-xl px-3 py-3 text-sm font-semibold text-foreground hover:bg-secondary"
                href={withBasePath(item.href)}
                onClick={(event) => {
                  onNavigate(item.href, event);
                  setMenuOpen(false);
                }}
              >
                {item.label}
              </a>
            ))}
            <Button asChild className="mt-2 w-full" variant="whatsapp">
              <a href={whatsappHref(defaultQuoteMessage)} target="_blank" rel="noreferrer">
                <MessageCircle data-icon="inline-start" />
                WhatsApp comercial
              </a>
            </Button>
          </div>
        </nav>
      )}
    </header>
  );
}
