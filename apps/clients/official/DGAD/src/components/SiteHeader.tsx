import { Menu, ShieldCheck, X } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { navItems, offer } from "@/data/site";
import { getRoutePathFromHref, toAppHref } from "@/lib/routing";

type SiteHeaderProps = {
  currentPath: string;
};

export function SiteHeader({ currentPath }: SiteHeaderProps) {
  const [open, setOpen] = useState(false);
  const isActiveLink = (href: string) => !href.includes("#") && currentPath === getRoutePathFromHref(href);

  return (
    <header className="fixed inset-x-0 top-0 isolate z-40 border-b border-border/60 bg-background/78 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <a href={toAppHref("/")} className="group flex items-center gap-3" aria-label="Ir para a home DGΔD">
          <span className="brand-sigil">Δ</span>
          <span className="flex flex-col leading-none">
            <strong className="font-serif text-lg tracking-[0.16em] text-primary">DGΔD</strong>
            <span className="hidden text-[0.62rem] uppercase tracking-[0.32em] text-muted-foreground sm:block">
              LifeForce 360º
            </span>
          </span>
        </a>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Navegação principal">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={toAppHref(item.href)}
              className={isActiveLink(item.href) ? "nav-link nav-link--active" : "nav-link"}
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-2 sm:flex">
          <Button asChild size="lg" className="cta-button h-11 px-4">
            <a href={offer.checkoutUrl} target="_blank" rel="noreferrer">
              <ShieldCheck data-icon="inline-start" />
              Comprar coleção
            </a>
          </Button>
        </div>

        <Button
          type="button"
          variant="outline"
          size="icon-lg"
          className="h-11 w-11 lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-menu"
          aria-label={open ? "Fechar navegação" : "Abrir navegação"}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
        </Button>
      </div>

      {open ? (
        <div id="mobile-menu" className="border-t border-border/60 bg-background/96 px-4 py-4 lg:hidden">
          <nav className="mx-auto flex max-w-7xl flex-col gap-2" aria-label="Navegação móvel">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={toAppHref(item.href)}
                className={
                  isActiveLink(item.href) ? "mobile-nav-link mobile-nav-link--active" : "mobile-nav-link"
                }
                onClick={() => setOpen(false)}
              >
                {item.label}
              </a>
            ))}
            <Button asChild size="lg" className="cta-button mt-2 h-12">
              <a href={offer.checkoutUrl} target="_blank" rel="noreferrer">
                <ShieldCheck data-icon="inline-start" />
                Comprar coleção
              </a>
            </Button>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
