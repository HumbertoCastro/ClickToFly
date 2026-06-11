import { List, X } from "@phosphor-icons/react";
import { useEffect, useState } from "react";
import styled from "styled-components";
import { navItems, whatsAppHref } from "../data";
import { palette, radii } from "../theme";
import { BrandMark } from "./BrandMark";

const HeaderShell = styled.header<{ $scrolled: boolean }>`
  position: fixed;
  inset: 0 0 auto;
  z-index: 40;
  border-bottom: 1px solid
    ${(props) => (props.$scrolled ? "rgba(6, 16, 68, 0.11)" : "transparent")};
  background: ${(props) => (props.$scrolled ? "rgba(255, 255, 255, 0.88)" : "rgba(255, 255, 255, 0.72)")};
  backdrop-filter: blur(18px);
  transition:
    background 220ms ease,
    border-color 220ms ease,
    box-shadow 220ms ease;
  box-shadow: ${(props) => (props.$scrolled ? "0 8px 18px rgba(6, 16, 68, 0.08)" : "none")};
`;

const HeaderInner = styled.div`
  width: min(100% - 32px, 1220px);
  min-height: 74px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 22px;
`;

const BrandLink = styled.a`
  display: inline-flex;
  align-items: center;
  color: inherit;
  text-decoration: none;
`;

const Nav = styled.nav`
  display: inline-flex;
  align-items: center;
  gap: 4px;

  @media (max-width: 860px) {
    display: none;
  }
`;

const NavLink = styled.a`
  display: inline-flex;
  min-height: 42px;
  align-items: center;
  border-radius: ${radii.pill};
  color: ${palette.ink};
  font-size: 0.86rem;
  font-weight: 700;
  letter-spacing: 0;
  padding: 0 13px;
  text-decoration: none;
  transition:
    background 180ms ease,
    color 180ms ease;

  &:hover,
  &:focus-visible {
    background: ${palette.mist};
    color: ${palette.navy};
    outline: none;
  }

  &:focus-visible {
    box-shadow: 0 0 0 3px rgba(143, 104, 31, 0.22);
  }
`;

const DesktopCta = styled.a`
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  justify-content: center;
  border: 1px solid ${palette.navy};
  border-radius: ${radii.pill};
  background: ${palette.navy};
  color: ${palette.paper};
  font-size: 0.86rem;
  font-weight: 800;
  padding: 0 18px;
  text-decoration: none;
  transition:
    transform 180ms ease,
    background 180ms ease,
    border-color 180ms ease;

  &:hover,
  &:focus-visible {
    background: ${palette.navyDeep};
    border-color: ${palette.navyDeep};
    transform: translateY(-1px);
    outline: none;
  }

  &:focus-visible {
    box-shadow: 0 0 0 4px rgba(143, 104, 31, 0.24);
  }

  @media (max-width: 860px) {
    display: none;
  }
`;

const MobileButton = styled.button`
  display: none;
  width: 44px;
  height: 44px;
  place-items: center;
  border: 1px solid ${palette.line};
  border-radius: ${radii.pill};
  background: ${palette.paper};
  color: ${palette.navy};
  cursor: pointer;

  &:focus-visible {
    outline: 3px solid rgba(143, 104, 31, 0.28);
    outline-offset: 4px;
  }

  @media (max-width: 860px) {
    display: grid;
  }
`;

const MobilePanel = styled.div<{ $open: boolean }>`
  position: fixed;
  inset: 74px 0 auto;
  z-index: 39;
  display: none;
  border-bottom: 1px solid ${palette.line};
  background: rgba(255, 255, 255, 0.96);
  padding: 16px;
  opacity: ${(props) => (props.$open ? 1 : 0)};
  pointer-events: ${(props) => (props.$open ? "auto" : "none")};
  transform: translateY(${(props) => (props.$open ? "0" : "-8px")});
  transition:
    opacity 180ms ease,
    transform 180ms ease;

  @media (max-width: 860px) {
    display: block;
  }
`;

const MobileNav = styled.nav`
  display: grid;
  gap: 8px;
  width: min(100%, 560px);
  margin: 0 auto;
`;

const MobileLink = styled.a`
  display: flex;
  min-height: 52px;
  align-items: center;
  border: 1px solid ${palette.line};
  border-radius: ${radii.md};
  color: ${palette.ink};
  font-weight: 800;
  padding: 0 16px;
  text-decoration: none;
  transition:
    border-color 180ms ease,
    background 180ms ease,
    color 180ms ease;

  &:last-child {
    background: ${palette.navy};
    color: ${palette.paper};
  }

  &:hover,
  &:focus-visible {
    border-color: ${palette.gold};
    outline: none;
  }

  &:focus-visible {
    box-shadow: 0 0 0 3px rgba(143, 104, 31, 0.22);
  }
`;

const scrollTo = (href: string) => {
  const target = document.querySelector(href);
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  target?.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
};

export function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 16);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  const handleNavigate = (href: string) => {
    setIsOpen(false);
    scrollTo(href);
  };

  return (
    <>
      <HeaderShell $scrolled={isScrolled}>
        <HeaderInner>
          <BrandLink
            href="#inicio"
            onClick={(event) => {
              event.preventDefault();
              handleNavigate("#inicio");
            }}
          >
            <BrandMark compact />
          </BrandLink>

          <Nav aria-label="Navegação principal">
            {navItems.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                onClick={(event) => {
                  event.preventDefault();
                  handleNavigate(item.href);
                }}
              >
                {item.label}
              </NavLink>
            ))}
          </Nav>

          <DesktopCta href={whatsAppHref} target="_blank" rel="noopener noreferrer">
            Falar com representante
          </DesktopCta>

          <MobileButton
            type="button"
            aria-label={isOpen ? "Fechar menu" : "Abrir menu"}
            aria-expanded={isOpen}
            aria-controls="mobile-navigation"
            onClick={() => setIsOpen((current) => !current)}
          >
            {isOpen ? <X size={22} weight="bold" /> : <List size={23} weight="bold" />}
          </MobileButton>
        </HeaderInner>
      </HeaderShell>

      {isOpen ? (
        <MobilePanel $open={isOpen} id="mobile-navigation" data-testid="mobile-panel">
          <MobileNav aria-label="Navegação mobile">
            {navItems.map((item) => (
              <MobileLink
                key={item.href}
                href={item.href}
                data-testid={`mobile-link-${item.href.replace("#", "")}`}
                onClick={(event) => {
                  event.preventDefault();
                  handleNavigate(item.href);
                }}
              >
                {item.label}
              </MobileLink>
            ))}
            <MobileLink
              href={whatsAppHref}
              target="_blank"
              rel="noopener noreferrer"
              data-testid="mobile-link-whatsapp"
            >
              WhatsApp comercial
            </MobileLink>
          </MobileNav>
        </MobilePanel>
      ) : null}
    </>
  );
}
