import styled, { createGlobalStyle } from "styled-components";
import { AboutSection } from "./components/AboutSection";
import { FinalCtaSection } from "./components/FinalCtaSection";
import { FloatingWhatsAppButton } from "./components/FloatingWhatsAppButton";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import { HeroSection } from "./components/HeroSection";
import { ProcessSection } from "./components/ProcessSection";
import { ProductShowcase } from "./components/ProductShowcase";
import { RetailerSection } from "./components/RetailerSection";
import { ScrollEyewearBridge } from "./components/ScrollEyewearBridge";
import { ScrollRevealController } from "./components/ScrollRevealController";
import { TrustBar } from "./components/TrustBar";
import { palette, radii } from "./theme";

const SkipLink = styled.a`
  position: fixed;
  left: 16px;
  top: 12px;
  z-index: 100;
  border-radius: ${radii.pill};
  background: ${palette.navy};
  color: ${palette.paper};
  font-size: 0.92rem;
  font-weight: 900;
  padding: 10px 16px;
  text-decoration: none;
  transform: translateY(-140%);
  transition: transform 160ms ease;

  &:focus-visible {
    transform: translateY(0);
    outline: 3px solid rgba(143, 104, 31, 0.32);
    outline-offset: 3px;
  }
`;

const GlobalStyle = createGlobalStyle`
  * {
    box-sizing: border-box;
  }

  html {
    background: ${palette.paper};
    color: ${palette.ink};
    scroll-behavior: smooth;
  }

  body {
    min-width: 320px;
    margin: 0;
    overflow-x: clip;
    background: ${palette.paper};
    color: ${palette.ink};
    font-family: "Afacad", ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
    font-synthesis: none;
    font-kerning: normal;
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }

  #root {
    min-height: 100dvh;
    overflow-x: clip;
  }

  a,
  button {
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
  }

  button,
  input,
  textarea,
  select {
    font: inherit;
  }

  img {
    max-width: 100%;
  }

  h1,
  h2,
  h3 {
    text-wrap: balance;
  }

  p {
    text-wrap: pretty;
    overflow-wrap: break-word;
  }

  h1,
  h2,
  h3,
  strong,
  a,
  button {
    overflow-wrap: break-word;
  }

  ::selection {
    background: ${palette.navy};
    color: ${palette.paper};
  }

  .reveal {
    opacity: 0;
    transform: translateY(56px);
    filter: blur(8px);
    transition:
      opacity 1100ms cubic-bezier(0.16, 1, 0.3, 1),
      transform 1100ms cubic-bezier(0.16, 1, 0.3, 1),
      filter 1100ms cubic-bezier(0.16, 1, 0.3, 1);
    transition-delay: var(--reveal-delay, 0ms);
    will-change: opacity, transform, filter;
  }

  .reveal.is-visible {
    opacity: 1;
    transform: translateY(0);
    filter: blur(0);
  }

  @media (prefers-reduced-motion: reduce) {
    *,
    *::before,
    *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      scroll-behavior: auto !important;
      transition-duration: 0.01ms !important;
    }

    .reveal {
      opacity: 1 !important;
      transform: none !important;
      filter: none !important;
      transition: none !important;
      will-change: auto !important;
    }
  }
`;

export default function App() {
  return (
    <>
      <GlobalStyle />
      <SkipLink href="#conteudo">Ir para o conteudo</SkipLink>
      <Header />
      <ScrollEyewearBridge />
      <ScrollRevealController />
      <main id="conteudo" tabIndex={-1}>
        <HeroSection />
        <TrustBar />
        <RetailerSection />
        <ProductShowcase />
        <AboutSection />
        <ProcessSection />
        <FinalCtaSection />
      </main>
      <Footer />
      <FloatingWhatsAppButton />
    </>
  );
}
