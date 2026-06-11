import { ArrowUpRight } from "lucide-react";
import { contactInfo, navItems, socialLinks } from "@/data/site";
import { toAppHref, toAssetUrl } from "@/lib/routing";

const madeByHref = "https://www.hcwebsolutions.com.br/";
const madeByIcon = toAssetUrl("/assets/hc-web-solutions-icon.png");

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer__inner">
        <div className="site-footer__brand">
          <div className="flex items-center gap-3">
            <span className="brand-sigil">Δ</span>
            <div>
              <strong className="site-footer__logo">DGΔD</strong>
              <p className="site-footer__tagline">Disciplina Gera Destino · LifeForce 360º</p>
            </div>
          </div>
          <p className="site-footer__text">
            Um sistema para organizar áreas essenciais da vida com disciplina, execução e responsabilidade pessoal.
          </p>
        </div>

        <div className="site-footer__column">
          <h2 className="footer-heading">Navegação</h2>
          {navItems.map((item) => (
            <a key={item.href} href={toAppHref(item.href)} className="footer-link">
              {item.label}
            </a>
          ))}
          <a href={toAppHref("/politica-de-privacidade")} className="footer-link">
            Privacidade
          </a>
          <a href={toAppHref("/pagamento-e-reembolso")} className="footer-link">
            Pagamento
          </a>
        </div>

        <div className="site-footer__column">
          <h2 className="footer-heading">Contato</h2>
          <a className="footer-link" href="https://wa.me/5511999739131">
            {contactInfo.whatsapp}
          </a>
          <a className="footer-link" href={`mailto:${contactInfo.email}`}>
            {contactInfo.email}
          </a>
          {socialLinks.map((link) => (
            <a key={link.href} href={link.href} className="footer-link" target="_blank" rel="noreferrer">
              {link.label}
              <ArrowUpRight aria-hidden="true" />
            </a>
          ))}
        </div>

        <div className="site-footer__meta">
          <span className="site-footer__copyright">
            © {new Date().getFullYear()} DGΔD. Todos os direitos reservados.
          </span>
          <a
            className="footer-made-by"
            href={madeByHref}
            target="_blank"
            rel="noreferrer"
            aria-label="Made By HC Web Solutions"
          >
            <span>Made By:</span>
            <span className="footer-made-mark" aria-hidden="true">
              <img src={madeByIcon} alt="" />
            </span>
          </a>
        </div>
      </div>
    </footer>
  );
}
