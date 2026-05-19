import { Instagram, Mail, MessageCircle, Phone } from 'lucide-react';
import { navItems, whatsappMessage, whatsappNumber } from '../data';
import { Logo } from './Logo';

const whatsappHref = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;

export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div>
          <Logo />
          <p>
            Agencia de viagens focada em oportunidades reais, curadoria de promocoes e
            planejamento personalizado.
          </p>
        </div>

        <nav aria-label="Links do rodape">
          <strong>Navegacao</strong>
          {navItems.map((item) => (
            <a key={item.href} href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>

        <div className="footer-contact">
          <strong>Contato</strong>
          <a href={whatsappHref} target="_blank" rel="noreferrer">
            <MessageCircle /> Grupo de promocoes
          </a>
          <a href="tel:+5531975863351">
            <Phone /> +55 (31) 97586-3351
          </a>
          <a href="mailto:contato@clicktofly.com.br">
            <Mail /> contato@clicktofly.com.br
          </a>
          <a href="https://www.instagram.com/" target="_blank" rel="noreferrer">
            <Instagram /> Instagram
          </a>
        </div>
      </div>
      <div className="container footer-bottom">
        <span>© 2026 Click To Fly. Todos os direitos reservados.</span>
        <span>Promocoes sujeitas a disponibilidade e regras tarifarias.</span>
      </div>
    </footer>
  );
}
