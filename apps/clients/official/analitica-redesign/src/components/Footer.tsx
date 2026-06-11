import { contact, navItems } from "../data/analitica";
import { assetPath, withBasePath, type NavigateHandler } from "../lib/navigation";

type FooterProps = {
  onNavigate: NavigateHandler;
};

export function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="border-t border-border bg-white">
      <div className="container grid gap-8 py-10 md:grid-cols-[1.2fr_0.8fr_0.8fr]">
        <div className="flex flex-col gap-4">
          <img className="h-12 w-fit" src={assetPath("/assets/logo-analitica.png")} alt="Analítica" />
          <p className="max-w-md text-sm leading-6 text-muted-foreground">
            A empresa Analítica LTDA foi fundada em 1989 com a principal missão de comercializar
            reagentes analíticos e outros suprimentos para laboratórios.
          </p>
        </div>
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold">Mapa do site</h2>
          <nav className="flex flex-col gap-2 text-sm text-muted-foreground">
            <a
              className="hover:text-foreground"
              href={withBasePath("/")}
              onClick={(event) => onNavigate("/", event)}
            >
              Home
            </a>
            {navItems.map((item) => (
              <a
                key={item.href}
                className="hover:text-foreground"
                href={withBasePath(item.href)}
                onClick={(event) => onNavigate(item.href, event)}
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
        <div className="flex flex-col gap-3">
          <h2 className="text-sm font-semibold">Contato</h2>
          <div className="flex flex-col gap-2 text-sm text-muted-foreground">
            <a className="hover:text-foreground" href={contact.emailHref}>
              {contact.email}
            </a>
            <a className="hover:text-foreground" href={contact.phoneHref}>
              {contact.phone}
            </a>
            <a className="hover:text-foreground" href={contact.mapsHref} target="_blank" rel="noreferrer">
              {contact.address}
            </a>
            <a className="hover:text-foreground" href={contact.instagram} target="_blank" rel="noreferrer">
              @analiticalabor
            </a>
          </div>
        </div>
      </div>
      <div className="border-t border-border py-5">
        <div className="container flex flex-col gap-2 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>Analítica, todos os direitos reservados.</p>
          <p>Redesign com conteúdo e imagens do site institucional.</p>
        </div>
      </div>
    </footer>
  );
}
