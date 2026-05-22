import { Instagram, Mail, MessageCircle } from 'lucide-react';
import hcWebSolutionsIcon from '../assets/hc-web-solutions-icon.png';
import { navItems, whatsappMessage, whatsappNumber } from '../data';
import { withBasePath } from '../lib/routing';
import { Logo } from './Logo';

const whatsappHref = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;
const madeByHref = 'https://www.hcwebsolutions.com.br/';
const directContactLinks = [
  { label: 'WhatsApp', href: whatsappHref, icon: MessageCircle, external: true },
  { label: 'E-mail', href: 'mailto:contato@clicktofly.com.br', icon: Mail },
  { label: 'Instagram', href: 'https://www.instagram.com/', icon: Instagram, external: true },
];

export function Footer() {
  return (
    <footer className="footer" aria-label="Rodapé Click To Fly">
      <div className="container footer-minimal">
        <div className="footer-brand-line">
          <Logo />
          <p>Agência de viagens focada em oportunidades reais e planejamento personalizado.</p>
        </div>

        <div className="footer-link-bar">
          <nav className="footer-direct-links" aria-label="Links diretos">
            {navItems.map((item) => (
              <a key={item.href} href={withBasePath(item.href)}>
                {item.label}
              </a>
            ))}
          </nav>

          <div className="footer-contact-links" aria-label="Contato">
            {directContactLinks.map((item) => {
              const Icon = item.icon;

              return (
                <a
                  key={item.label}
                  href={item.href}
                  target={item.external ? '_blank' : undefined}
                  rel={item.external ? 'noreferrer' : undefined}
                >
                  <Icon />
                  {item.label}
                </a>
              );
            })}
          </div>
        </div>

        <div className="footer-meta">
          <span>Copyright 2026 Click To Fly. Todos os direitos reservados.</span>
          <a
            className="footer-made-by"
            href={madeByHref}
            target="_blank"
            rel="noreferrer"
            aria-label="Made By HC Web Solutions"
          >
            <span>Made By:</span>
            <span className="footer-made-mark" aria-hidden="true">
              <img src={hcWebSolutionsIcon} alt="" />
            </span>
          </a>
        </div>
      </div>
    </footer>
  );
}
