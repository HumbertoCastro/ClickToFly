import { Menu, MessageCircle, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { navItems, whatsappMessage, whatsappNumber } from '../data';
import { Logo } from './Logo';

const whatsappHref = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(whatsappMessage)}`;

export function Header() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 14);

    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`site-header ${scrolled ? 'is-scrolled' : ''}`}>
      <div className="container header-inner">
        <Logo compact />

        <nav className="desktop-nav" aria-label="Navegação principal">
          {navItems.map((item) => (
            <a key={item.href} href={item.href}>
              {item.label}
            </a>
          ))}
        </nav>

        <a className="header-cta" href={whatsappHref} target="_blank" rel="noreferrer">
          <MessageCircle />
          Entrar no grupo
        </a>

        <button
          className="menu-button"
          type="button"
          aria-label={open ? 'Fechar menu' : 'Abrir menu'}
          onClick={() => setOpen((current) => !current)}
        >
          {open ? <X /> : <Menu />}
        </button>
      </div>

      <div className={`mobile-menu ${open ? 'is-open' : ''}`}>
        <nav aria-label="Navegação mobile">
          {navItems.map((item) => (
            <a key={item.href} href={item.href} onClick={() => setOpen(false)}>
              {item.label}
            </a>
          ))}
          <a className="mobile-menu-cta" href={whatsappHref} target="_blank" rel="noreferrer">
            Entrar no grupo
          </a>
        </nav>
      </div>
    </header>
  );
}
