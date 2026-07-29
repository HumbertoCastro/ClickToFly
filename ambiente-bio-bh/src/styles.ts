import styled, { createGlobalStyle } from "styled-components";

const container = `
  width: min(1240px, calc(100% - clamp(32px, 5vw, 72px)));
  margin-inline: auto;
`;

export const GlobalStyle = createGlobalStyle`
  *, *::before, *::after {
    box-sizing: border-box;
  }

  html {
    scroll-behavior: smooth;
    background: var(--paper);
    overflow-x: clip;
  }

  body {
    margin: 0;
    min-width: 320px;
    overflow-x: clip;
    color: var(--ink);
    background: var(--paper);
    font-family: var(--font-body);
    font-size: 1rem;
    line-height: 1.55;
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
  }

  button, input, select, textarea {
    font: inherit;
  }

  img {
    display: block;
    max-width: 100%;
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  button, a, select, textarea {
    -webkit-tap-highlight-color: transparent;
  }

  :focus-visible {
    outline: 3px solid var(--focus);
    outline-offset: 4px;
  }

  ::selection {
    color: var(--white);
    background: var(--red);
  }

  .skip-link {
    position: fixed;
    z-index: 100;
    top: 12px;
    left: 12px;
    min-height: 44px;
    padding: 0.7rem 1rem;
    color: var(--white);
    background: var(--forest-deep);
    transform: translateY(-160%);
    transition: transform 180ms var(--ease);
  }

  .skip-link:focus {
    transform: translateY(0);
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  #top,
  #sinais,
  #servicos,
  #metodo,
  #setores,
  #ocorrencias,
  #duvidas,
  #contato,
  #agendar-contato {
    scroll-margin-top: 88px;
  }

  [data-reveal-delay="1"] {
    --reveal-delay: 80ms;
  }

  [data-reveal-delay="2"] {
    --reveal-delay: 160ms;
  }

  [data-reveal-delay="3"] {
    --reveal-delay: 240ms;
  }

  [data-reveal-delay="4"] {
    --reveal-delay: 320ms;
  }

  [data-reveal-delay="5"] {
    --reveal-delay: 400ms;
  }

  .motion-ready [data-reveal][data-revealed="false"] {
    opacity: 0;
    transform: translate3d(0, 28px, 0);
  }

  .motion-ready [data-reveal="left"][data-revealed="false"] {
    transform: translate3d(-28px, 0, 0);
  }

  .motion-ready [data-reveal="right"][data-revealed="false"] {
    transform: translate3d(28px, 0, 0);
  }

  .motion-ready [data-reveal="mask"][data-revealed="false"] {
    clip-path: inset(0 0 18% 0);
    transform: scale(1.025);
  }

  .motion-ready [data-reveal="line"][data-revealed="false"] {
    opacity: 1;
    transform: none;
  }

  .motion-ready [data-reveal="hero-copy"] {
    opacity: 1;
    transform: none;
  }

  .motion-ready [data-reveal="hero-copy"] > * {
    transition:
      opacity 560ms var(--ease),
      transform 560ms var(--ease);
  }

  .motion-ready [data-reveal="hero-copy"][data-revealed="false"] > * {
    opacity: 0;
    transform: translate3d(0, 22px, 0);
  }

  .motion-ready [data-reveal="hero-copy"] > *:nth-child(2) {
    transition-delay: 80ms;
  }

  .motion-ready [data-reveal="hero-copy"] > *:nth-child(3) {
    transition-delay: 160ms;
  }

  .motion-ready [data-reveal="hero-copy"] > *:nth-child(4) {
    transition-delay: 240ms;
  }

  .motion-ready [data-reveal="hero-copy"][data-revealed="true"] > * {
    opacity: 1;
    transform: none;
  }

  .motion-ready [data-reveal] {
    transition:
      opacity 560ms var(--ease) var(--reveal-delay, 0ms),
      transform 560ms var(--ease) var(--reveal-delay, 0ms),
      clip-path 640ms var(--ease) var(--reveal-delay, 0ms);
    will-change: opacity, transform;
  }

  .motion-ready [data-reveal="hero-copy"] {
    transition: none;
    will-change: auto;
  }

  .motion-ready [data-reveal="hero-person"] {
    transition:
      opacity 380ms var(--ease) var(--reveal-delay, 0ms),
      transform 380ms var(--ease) var(--reveal-delay, 0ms);
  }

  .motion-ready [data-reveal="hero-person"][data-revealed="false"] {
    opacity: 0;
    transform: translate3d(12px, 0, 0);
  }

  .motion-ready [data-reveal][data-revealed="true"] {
    opacity: 1;
    clip-path: inset(0);
    transform: none;
    will-change: auto;
  }

  .motion-ready [data-reveal="hero-person"][data-revealed="true"] {
    clip-path: none;
  }

  @media (prefers-reduced-motion: reduce) {
    html {
      scroll-behavior: auto;
    }

    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      scroll-behavior: auto !important;
      transition-duration: 0.01ms !important;
      transition-delay: 0ms !important;
    }

    [data-reveal] {
      opacity: 1 !important;
      clip-path: none !important;
      transform: none !important;
    }

    [data-reveal="hero-copy"] > * {
      opacity: 1 !important;
      transform: none !important;
    }
  }
`;

export const SiteShell = styled.div`
  position: relative;
  min-height: 100dvh;
  overflow-x: clip;
  isolation: isolate;
  background: var(--paper);

  &::before {
    position: fixed;
    z-index: 50;
    inset: 0;
    content: "";
    pointer-events: none;
    opacity: 0.026;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.86' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.55'/%3E%3C/svg%3E");
  }
`;

export const Header = styled.header`
  position: sticky;
  z-index: 40;
  top: 0;
  border-bottom: 1px solid var(--border);
  color: var(--ink);
  background: color-mix(in srgb, var(--paper) 94%, transparent);
  backdrop-filter: blur(16px);
  transition:
    background 240ms ease,
    box-shadow 240ms ease;

  &[data-header-compact="true"] {
    background: color-mix(in srgb, var(--paper) 98%, transparent);
    box-shadow: 0 14px 35px rgba(3, 38, 18, 0.1);
  }
`;

export const HeaderInner = styled.div`
  ${container}
  position: relative;
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto auto;
  align-items: center;
  min-height: 78px;
  gap: clamp(0.75rem, 2.2vw, 2.5rem);
  transition: min-height 240ms var(--ease);

  header[data-header-compact="true"] & {
    min-height: 62px;
  }

  @media (max-width: 640px) {
    min-height: 68px;
    gap: 0.65rem;

    header[data-header-compact="true"] & {
      min-height: 58px;
    }
  }
`;

export const Brand = styled.a`
  display: inline-flex;
  width: 68px;
  height: 48px;
  align-items: center;
  justify-content: center;
  line-height: 0;
  transition:
    filter 200ms ease,
    opacity 200ms ease;

  img {
    width: 68px;
    height: 68px;
    max-width: none;
    object-fit: contain;
  }

  &:hover {
    filter: saturate(1.08);
  }

  &:active {
    opacity: 0.82;
  }

  @media (max-width: 640px) {
    width: 60px;
    height: 44px;

    img {
      width: 60px;
      height: 60px;
    }
  }
`;

export const Nav = styled.nav<{ $open?: boolean }>`
  display: flex;
  justify-self: center;
  align-items: center;
  gap: clamp(1.2rem, 2.5vw, 2.3rem);
  color: var(--ink-soft);
  font-size: 0.83rem;
  font-weight: 600;

  a {
    position: relative;
    min-height: 44px;
    display: inline-flex;
    align-items: center;
  }

  a::after {
    position: absolute;
    right: 0;
    bottom: 8px;
    left: 0;
    height: 2px;
    content: "";
    background: var(--red);
    transform: scaleX(0);
    transform-origin: left;
    transition: transform 220ms var(--ease);
  }

  a:hover,
  a[aria-current="location"] {
    color: var(--ink);
  }

  a:hover::after,
  a:focus-visible::after,
  a[aria-current="location"]::after {
    transform: scaleX(1);
  }

  @media (max-width: 980px) {
    position: absolute;
    top: calc(100% + 1px);
    right: 0;
    left: 0;
    display: ${({ $open }) => ($open ? "grid" : "none")};
    justify-self: stretch;
    gap: 0;
    padding: 0.75rem;
    border: 1px solid var(--border);
    border-top: 0;
    border-radius: 0 0 var(--radius-large) var(--radius-large);
    background: var(--paper);
    box-shadow: 0 24px 55px rgba(3, 38, 18, 0.14);

    a {
      min-height: 52px;
      padding-inline: 0.75rem;
      border-bottom: 1px solid var(--border);
    }

    a:last-child {
      border-bottom: 0;
    }

    a::after {
      right: auto;
      bottom: 0;
      left: 0.75rem;
      width: 36px;
    }
  }
`;

export const HeaderActions = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 1.25rem;

  > a:first-child {
    display: inline-flex;
    min-height: 44px;
    align-items: center;
    color: var(--ink-soft);
    font-size: 0.8rem;
    font-weight: 600;
    transition: color 180ms ease;
  }

  > a:first-child:hover {
    color: var(--ink);
  }

  @media (max-width: 640px) {
    gap: 0.5rem;

    > a:first-child {
      display: none;
    }
  }
`;

export const MenuButton = styled.button`
  position: relative;
  display: none;
  width: 44px;
  height: 44px;
  place-items: center;
  padding: 0;
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-small);
  color: var(--ink);
  background: transparent;
  cursor: pointer;
  transition:
    color 180ms ease,
    border-color 180ms ease,
    background 180ms ease;

  span,
  &::before,
  &::after {
    position: absolute;
    left: 12px;
    display: block;
    width: 18px;
    height: 2px;
    content: "";
    background: currentColor;
    transition:
      transform 220ms var(--ease),
      opacity 180ms ease;
  }

  &::before {
    top: 15px;
  }

  span {
    top: 21px;
  }

  &::after {
    top: 27px;
  }

  &[aria-expanded="true"]::before {
    top: 21px;
    transform: rotate(45deg);
  }

  &[aria-expanded="true"] span {
    opacity: 0;
  }

  &[aria-expanded="true"]::after {
    top: 21px;
    transform: rotate(-45deg);
  }

  &:hover {
    border-color: var(--green);
    color: var(--green);
    background: var(--mint-soft);
  }

  @media (max-width: 980px) {
    display: grid;
  }
`;

export const LinkButton = styled.a`
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  justify-content: center;
  padding: 0.68rem 1rem;
  border: 1px solid var(--red);
  border-radius: var(--radius-small);
  color: var(--white);
  background: var(--red);
  box-shadow: 0 10px 24px rgba(121, 0, 0, 0.2);
  font-size: 0.8rem;
  font-weight: 600;
  line-height: 1;
  transition:
    background 200ms ease,
    border-color 200ms ease,
    box-shadow 200ms ease;

  &:hover {
    border-color: var(--red-dark);
    background: var(--red-dark);
    box-shadow: 0 14px 28px rgba(121, 0, 0, 0.26);
  }

  &:active {
    box-shadow: 0 6px 16px rgba(121, 0, 0, 0.2);
  }

  @media (max-width: 640px) {
    padding-inline: 0.78rem;
    font-size: 0.78rem;
  }
`;

export const PrimaryButton = styled.button`
  display: inline-flex;
  min-height: 52px;
  align-items: center;
  justify-content: center;
  gap: 1rem;
  padding: 0.85rem 1.05rem 0.85rem 1.35rem;
  border: 1px solid var(--red);
  border-radius: var(--radius-small);
  color: var(--white);
  background: var(--red);
  box-shadow: 0 14px 35px rgba(115, 0, 0, 0.2);
  font-size: 0.88rem;
  font-weight: 600;
  line-height: 1;
  cursor: pointer;
  transition:
    background 220ms ease,
    border-color 220ms ease,
    box-shadow 220ms ease;

  &:hover {
    border-color: var(--red-dark);
    background: var(--red-dark);
    box-shadow: 0 18px 38px rgba(115, 0, 0, 0.27);
  }

  &:active {
    box-shadow: 0 7px 20px rgba(115, 0, 0, 0.22);
  }
`;

export const ButtonArrow = styled.span`
  display: grid;
  width: 28px;
  height: 28px;
  place-items: center;
  border: 1px solid rgba(255, 255, 255, 0.42);
  border-radius: 50%;
  font-size: 0.9rem;
  transition: transform 220ms var(--ease);

  ${PrimaryButton}:hover & {
    transform: translate3d(2px, -2px, 0);
  }

  @media (prefers-reduced-motion: reduce) {
    ${PrimaryButton}:hover & {
      transform: none;
    }
  }
`;

export const HeroStage = styled.div`
  position: relative;
  overflow: hidden;
  color: var(--white);
  background:
    radial-gradient(circle at 76% 30%, rgba(69, 145, 87, 0.3), transparent 31%),
    radial-gradient(circle at 18% 86%, rgba(10, 96, 44, 0.34), transparent 32%),
    var(--forest);

  &::before {
    position: absolute;
    inset: 0;
    content: "";
    pointer-events: none;
    opacity: 0.24;
    background-image:
      linear-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255, 255, 255, 0.08) 1px, transparent 1px);
    background-size: 64px 64px;
    mask-image: linear-gradient(to right, transparent 4%, black 52%, transparent 98%);
  }

  &::after {
    position: absolute;
    right: -14%;
    bottom: -38%;
    width: min(62vw, 880px);
    aspect-ratio: 1;
    border-radius: 50%;
    content: "";
    pointer-events: none;
    background: radial-gradient(circle, rgba(112, 190, 128, 0.19), transparent 68%);
  }
`;

export const Hero = styled.section`
  ${container}
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(12, minmax(0, 1fr));
  align-items: end;
  min-height: clamp(600px, calc(100svh - 78px), 760px);
  column-gap: clamp(1.4rem, 2.5vw, 2.75rem);
  padding-top: clamp(3rem, 5vw, 5.25rem);

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    min-height: auto;
    gap: 2.75rem;
    padding-top: 4rem;
  }

  @media (max-width: 640px) {
    gap: 2.25rem;
    padding-top: 3.25rem;
  }
`;

export const HeroCopy = styled.div`
  position: relative;
  z-index: 2;
  grid-column: 1 / span 5;
  align-self: center;
  padding-bottom: clamp(2.5rem, 5vw, 5rem);

  > p {
    max-width: 34rem;
    margin: 1.7rem 0 0;
    color: rgba(255, 255, 255, 0.73);
    font-size: clamp(1.04rem, 1.5vw, 1.2rem);
    line-height: 1.65;
    text-wrap: pretty;
  }

  @media (max-width: 900px) {
    grid-column: 1;
    padding-bottom: 0;
  }
`;

export const HeroEyebrow = styled.p`
  display: flex;
  align-items: center;
  gap: 0.7rem;
  margin: 0 0 1.4rem !important;
  color: rgba(255, 255, 255, 0.74) !important;
  font-size: 0.72rem !important;
  font-weight: 600;
  line-height: 1 !important;
  letter-spacing: 0.12em;
  text-transform: uppercase;

  span {
    width: 9px;
    height: 9px;
    background: var(--red);
    transform: rotate(45deg);
  }
`;

export const HeroTitle = styled.h1`
  max-width: 10.8ch;
  margin: 0;
  font-family: var(--font-display);
  font-size: clamp(3.15rem, 5.2vw, 5.35rem);
  font-weight: 600;
  line-height: 0.92;
  letter-spacing: -0.068em;
  text-wrap: balance;
`;

export const HeroActions = styled.div`
  display: flex;
  align-items: center;
  gap: 1.35rem;
  margin-top: 2.4rem;

  > a:not(${PrimaryButton}) {
    display: inline-flex;
    min-height: 44px;
    align-items: center;
    border-bottom: 1px solid rgba(255, 255, 255, 0.34);
    color: rgba(255, 255, 255, 0.75);
    font-size: 0.86rem;
    font-weight: 600;
    transition:
      color 180ms ease,
      border-color 180ms ease;
  }

  > a:not(${PrimaryButton}):hover {
    border-color: var(--white);
    color: var(--white);
  }

  @media (max-width: 520px) {
    align-items: flex-start;
    flex-direction: column;
  }
`;

export const HeroMedia = styled.figure`
  position: relative;
  z-index: 1;
  grid-column: 6 / -1;
  align-self: end;
  display: grid;
  height: clamp(540px, calc(100svh - 120px), 710px);
  place-items: end center;
  margin: 0;

  picture {
    display: flex;
    width: 100%;
    height: 100%;
    align-items: flex-end;
    justify-content: flex-end;
  }

  @media (max-width: 900px) {
    grid-column: 1;
    width: min(100%, 720px);
    height: clamp(480px, 84vw, 660px);
    justify-self: center;

    picture {
      justify-content: center;
    }
  }

  @media (max-width: 640px) {
    height: clamp(350px, 112vw, 500px);
  }
`;

export const HeroImage = styled.img`
  display: block;
  width: auto;
  max-width: 100%;
  height: 100%;
  object-fit: contain;
  object-position: bottom right;
  filter: drop-shadow(0 26px 28px rgba(0, 20, 9, 0.24));
`;

export const TrustRail = styled.div`
  ${container}
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  border-top: 1px solid rgba(255, 255, 255, 0.16);
  color: var(--white);

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

export const TrustItem = styled.div`
  display: grid;
  min-height: 104px;
  align-content: center;
  gap: 0.2rem;
  padding: 1rem clamp(0.5rem, 2.5vw, 2rem);
  color: var(--white);

  & + & {
    border-left: 1px solid rgba(255, 255, 255, 0.16);
  }

  strong {
    font-family: var(--font-display);
    font-size: clamp(1.1rem, 1.8vw, 1.45rem);
    font-weight: 600;
    letter-spacing: -0.03em;
  }

  span {
    color: rgba(255, 255, 255, 0.58);
    font-size: 0.74rem;
    line-height: 1.35;
  }

  @media (max-width: 640px) {
    min-height: 62px;
    padding-inline: 0;

    & + & {
      border-top: 1px solid rgba(255, 255, 255, 0.14);
      border-left: 0;
    }
  }
`;

export const SignalBand = styled.section`
  display: grid;
  grid-template-columns: minmax(250px, 0.68fr) minmax(0, 1.32fr);
  align-items: center;
  gap: clamp(2.5rem, 7vw, 8rem);
  padding-block: clamp(4.5rem, 8vw, 7rem);
  padding-inline: max(
    clamp(16px, 2.5vw, 36px),
    calc((100vw - 1240px) / 2)
  );
  background:
    radial-gradient(circle at 6% 90%, rgba(6, 96, 32, 0.1), transparent 26%),
    var(--mint);

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    gap: 2.5rem;
  }
`;

export const SignalIntro = styled.div`
  h2 {
    max-width: 13ch;
    margin: 0.72rem 0 0;
    font-family: var(--font-display);
    font-size: clamp(2.05rem, 3.6vw, 3.5rem);
    font-weight: 600;
    line-height: 1;
    letter-spacing: -0.05em;
    text-wrap: balance;
  }
`;

export const SignalList = styled.ol`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin: 0;
  padding: 0;
  border-top: 1px solid color-mix(in srgb, var(--green) 28%, transparent);
  list-style: none;

  li {
    display: grid;
    min-height: 116px;
    align-content: space-between;
    padding: 1.2rem clamp(1rem, 2vw, 1.6rem);
    border-bottom: 1px solid color-mix(in srgb, var(--green) 28%, transparent);
  }

  li:nth-child(even) {
    border-left: 1px solid color-mix(in srgb, var(--green) 28%, transparent);
  }

  li span {
    color: var(--red);
    font-family: var(--font-display);
    font-size: 0.7rem;
    font-weight: 600;
    letter-spacing: 0.1em;
  }

  li strong {
    font-family: var(--font-display);
    font-size: clamp(1rem, 1.7vw, 1.3rem);
    font-weight: 600;
  }

  @media (max-width: 520px) {
    grid-template-columns: 1fr;

    li {
      min-height: 94px;
    }

    li:nth-child(even) {
      border-left: 0;
    }
  }
`;

export const Section = styled.section`
  ${container}
  padding-block: clamp(4.75rem, 8vw, 7.5rem);
`;

export const SectionHeader = styled.header`
  display: grid;
  grid-template-columns: minmax(0, 1.2fr) minmax(260px, 0.8fr);
  align-items: end;
  gap: clamp(2rem, 7vw, 8rem);
  margin-bottom: clamp(3rem, 5.5vw, 5rem);

  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    align-items: start;
    gap: 1.25rem;
  }
`;

export const SectionKicker = styled.p`
  margin: 0;
  color: var(--green);
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.13em;
  text-transform: uppercase;
`;

export const SectionTitle = styled.h2`
  max-width: 16ch;
  margin: 0.9rem 0 0;
  font-family: var(--font-display);
  font-size: clamp(2.4rem, 4.5vw, 4.35rem);
  font-weight: 600;
  line-height: 0.98;
  letter-spacing: -0.06em;
  text-wrap: balance;
`;

export const SectionIntro = styled.p`
  max-width: 32rem;
  margin: 0;
  color: var(--ink-soft);
  font-size: 1rem;
  line-height: 1.65;
  text-wrap: pretty;
`;

export const SolutionGrid = styled.div`
  display: grid;
  gap: clamp(4.5rem, 9vw, 8rem);
`;

export const ImageCardMedia = styled.div`
  position: relative;
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: clamp(14px, 2vw, 24px);
  background:
    radial-gradient(circle at 82% 12%, rgba(6, 96, 32, 0.1), transparent 34%),
    var(--mint-soft);

  picture {
    display: flex;
    height: 100%;
  }

  img {
    width: 100%;
    height: 100%;
    min-height: 440px;
    object-fit: cover;
    filter: saturate(0.9) contrast(1.02);
    transition:
      filter 220ms ease,
      transform 240ms var(--ease);
  }

  &::after {
    position: absolute;
    top: 1.1rem;
    right: 1.1rem;
    width: 42px;
    height: 42px;
    border: 1px solid rgba(255, 255, 255, 0.46);
    border-radius: 50%;
    content: "";
    background: var(--red);
    box-shadow: inset 0 0 0 12px rgba(255, 255, 255, 0.08);
    transition: transform 240ms var(--ease);
  }

  @media (max-width: 768px) {
    img {
      min-height: 0;
      aspect-ratio: 4 / 3;
    }
  }
`;

export const ImageCard = styled.article`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(320px, 0.78fr);
  align-items: stretch;
  gap: clamp(2.75rem, 8vw, 7rem);
  padding-top: clamp(2.25rem, 4vw, 3.5rem);
  border-top: 1px solid var(--border);

  &:hover ${ImageCardMedia} img {
    filter: saturate(1) contrast(1.02);
    transform: scale(1.02);
  }

  &:hover ${ImageCardMedia}::after {
    transform: rotate(45deg);
  }

  &:nth-child(even) {
    grid-template-columns: minmax(320px, 0.78fr) minmax(0, 1fr);
  }

  &:nth-child(even) ${ImageCardMedia} {
    order: 2;
  }

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
    gap: 2rem;

    &:nth-child(even) {
      grid-template-columns: 1fr;
    }

    &:nth-child(even) ${ImageCardMedia} {
      order: 0;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    &:hover ${ImageCardMedia} img,
    &:hover ${ImageCardMedia}::after {
      transform: none;
    }
  }
`;

export const ImageCardBody = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  justify-content: center;
  padding-block: clamp(1rem, 3vw, 3rem);

  h3 {
    max-width: 15ch;
    margin: 1rem 0 0;
    font-family: var(--font-display);
    font-size: clamp(2.15rem, 4vw, 4rem);
    font-weight: 600;
    line-height: 0.98;
    letter-spacing: -0.06em;
    text-wrap: balance;
  }

  > p:not(${SectionKicker}) {
    max-width: 36rem;
    margin: 1.35rem 0 0;
    color: var(--ink-soft);
    font-size: 1.02rem;
    line-height: 1.65;
  }

  ul {
    display: grid;
    gap: 0.65rem;
    width: 100%;
    margin: 1.5rem 0 0;
    padding: 1.35rem 0 0;
    border-top: 1px solid var(--border);
    list-style: none;
  }

  li {
    position: relative;
    padding-left: 1.7rem;
    color: var(--ink-soft);
    font-size: 0.9rem;
  }

  li::before {
    position: absolute;
    top: 0.3rem;
    left: 0;
    width: 9px;
    height: 9px;
    border: 1px solid var(--green);
    content: "";
    transform: rotate(45deg);
  }

  > a {
    display: inline-flex;
    min-height: 44px;
    align-items: center;
    gap: 0.6rem;
    margin-top: 1.45rem;
    border-bottom: 1px solid var(--border-strong);
    font-size: 0.84rem;
    font-weight: 600;
    transition:
      color 180ms ease,
      border-color 180ms ease;
  }

  > a span {
    color: var(--red);
    transition: transform 220ms var(--ease);
  }

  > a:hover {
    border-color: var(--red);
    color: var(--green);
  }

  > a:hover span {
    transform: translate3d(2px, -2px, 0);
  }

  @media (prefers-reduced-motion: reduce) {
    > a:hover span {
      transform: none;
    }
  }
`;

export const SpecialtyGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1px;
  background: rgba(255, 255, 255, 0.18);

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

export const SpecialtyItem = styled.a`
  display: flex;
  min-height: 190px;
  align-items: flex-start;
  gap: 1.1rem;
  padding: clamp(1.6rem, 4vw, 3.25rem);
  color: var(--white);
  background: rgba(255, 255, 255, 0.045);
  transition:
    color 220ms ease,
    background 220ms ease;

  > span {
    display: grid;
    width: 32px;
    height: 32px;
    flex: none;
    place-items: center;
    border: 1px solid rgba(255, 255, 255, 0.34);
    border-radius: 50%;
    color: var(--red-soft);
    line-height: 1;
    transition:
      color 240ms ease,
      background 240ms ease,
      transform 240ms var(--ease);
  }

  h3 {
    margin: 0;
    font-family: var(--font-display);
    font-size: clamp(1.3rem, 2vw, 1.75rem);
    font-weight: 600;
  }

  p {
    margin: 0.38rem 0 0;
    max-width: 32rem;
    color: rgba(255, 255, 255, 0.62);
    font-size: 0.94rem;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.09);
  }

  &:hover > span,
  &:focus-visible > span {
    color: var(--white);
    background: var(--red);
    transform: translate3d(2px, -2px, 0);
  }

  @media (prefers-reduced-motion: reduce) {
    &:hover > span,
    &:focus-visible > span {
      transform: none;
    }
  }

  @media (max-width: 640px) {
    min-height: 160px;
  }
`;

export const SpecialtySpotlight = styled.aside`
  margin-top: clamp(5rem, 9vw, 8rem);
  padding: clamp(2rem, 5vw, 4.5rem);
  border-radius: clamp(16px, 2vw, 28px);
  color: var(--white);
  background:
    radial-gradient(circle at 88% 16%, rgba(70, 154, 88, 0.28), transparent 28%),
    var(--forest-deep);
  box-shadow: 0 30px 80px rgba(3, 38, 18, 0.16);

  > header {
    display: grid;
    grid-template-columns: minmax(0, 0.75fr) minmax(260px, 1.25fr);
    gap: 2rem;
    align-items: end;
    margin-bottom: 2.25rem;
  }

  ${SectionKicker} {
    color: var(--red-soft);
  }

  h3 {
    max-width: 16ch;
    margin: 0.8rem 0 0;
    font-family: var(--font-display);
    font-size: clamp(2rem, 3.5vw, 3.5rem);
    font-weight: 600;
    line-height: 1;
    letter-spacing: -0.055em;
    text-wrap: balance;
  }

  > header > p {
    max-width: 36rem;
    margin: 0;
    color: rgba(255, 255, 255, 0.62);
  }

  @media (max-width: 720px) {
    > header {
      grid-template-columns: 1fr;
    }
  }
`;

export const InspectionSection = styled.section`
  padding-block: clamp(5rem, 9vw, 8.5rem);
  padding-inline: max(
    clamp(16px, 2.5vw, 36px),
    calc((100vw - 1240px) / 2)
  );
  background: var(--mint-soft);
`;

export const InspectionHeader = styled.header`
  display: grid;
  grid-template-columns: minmax(0, 0.8fr) minmax(280px, 1.2fr);
  align-items: end;
  gap: clamp(2rem, 8vw, 8rem);
  margin-bottom: clamp(2.75rem, 6vw, 5.5rem);

  ${SectionTitle} {
    max-width: 13ch;
  }

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
    align-items: start;
    gap: 1.25rem;
  }
`;

export const InspectionVisual = styled.figure`
  position: relative;
  margin: 0;
  overflow: hidden;
  border: 1px solid color-mix(in srgb, var(--green) 18%, var(--border));
  border-radius: clamp(16px, 2.2vw, 28px);
  background: var(--forest);
  box-shadow: 0 34px 84px rgba(3, 38, 18, 0.16);

  > picture img {
    width: 100%;
    height: auto;
    aspect-ratio: 16 / 8.8;
    object-fit: cover;
    filter: saturate(0.82) contrast(1.03);
  }

  > figcaption {
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  @media (max-width: 720px) {
    overflow: visible;
    border: 0;
    background: transparent;
    box-shadow: none;

    > picture {
      display: block;
      overflow: hidden;
      border-radius: 16px;
    }

    > picture img {
      aspect-ratio: 4 / 3;
    }

    > figcaption {
      position: static;
      display: grid;
      gap: 0.65rem;
      margin-top: 1rem;
    }
  }
`;

export const InspectionMarker = styled.div<{ $position: number }>`
  position: absolute;
  right: auto;
  bottom: auto;
  left: auto;
  display: grid;
  max-width: 240px;
  padding: 0.95rem 1rem;
  border: 1px solid rgba(255, 255, 255, 0.28);
  border-radius: var(--radius-medium);
  color: var(--white);
  background: rgba(3, 38, 18, 0.88);
  box-shadow: 0 18px 44px rgba(0, 20, 9, 0.22);
  backdrop-filter: blur(8px);
  pointer-events: auto;

  ${({ $position }) =>
    $position === 0
      ? `
        top: 8%;
        left: 6%;
      `
      : $position === 1
        ? `
          top: 14%;
          right: 7%;
        `
        : `
          top: auto;
          bottom: 8%;
          left: 7%;
        `}

  span {
    color: var(--red-soft);
    font-size: 0.68rem;
    font-weight: 600;
    letter-spacing: 0.1em;
  }

  strong {
    margin-top: 0.25rem;
    font-family: var(--font-display);
    font-size: 1rem;
  }

  p {
    margin: 0.35rem 0 0;
    color: rgba(255, 255, 255, 0.64);
    font-size: 0.78rem;
    line-height: 1.35;
  }

  @media (max-width: 720px) {
    position: static;
    max-width: none;
    border-color: var(--border);
    color: var(--ink);
    background: var(--paper);
    box-shadow: none;
    backdrop-filter: none;

    span {
      color: var(--red);
    }

    p {
      color: var(--ink-soft);
    }
  }
`;

export const MethodSection = styled.section`
  position: relative;
  overflow: hidden;
  padding-block: clamp(5.5rem, 9vw, 9rem);
  padding-inline: max(
    clamp(16px, 2.5vw, 36px),
    calc((100vw - 1240px) / 2)
  );
  color: var(--white);
  background:
    radial-gradient(circle at 88% 6%, rgba(69, 151, 85, 0.3), transparent 27%),
    radial-gradient(circle at 6% 100%, rgba(205, 1, 2, 0.1), transparent 24%),
    var(--forest-deep);

  &::after {
    position: absolute;
    right: 7%;
    bottom: -180px;
    width: 420px;
    height: 420px;
    border: 1px solid rgba(255, 255, 255, 0.08);
    border-radius: 50%;
    content: "";
  }
`;

export const MethodLayout = styled.div`
  position: relative;
  z-index: 1;

  > ${SectionHeader} {
    grid-template-columns: minmax(0, 0.95fr) minmax(280px, 0.7fr);
    margin-bottom: clamp(3.5rem, 7vw, 6.5rem);
  }

  ${SectionKicker} {
    color: var(--red-soft);
  }

  ${SectionTitle} {
    max-width: 13ch;
    color: var(--white);
  }

  ${SectionIntro} {
    color: rgba(255, 255, 255, 0.64);
  }

  @media (max-width: 900px) {
    > ${SectionHeader} {
      grid-template-columns: 1fr;
    }
  }
`;

export const AimGrid = styled.ol`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
  margin: 0;
  padding: 0;
  list-style: none;

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
`;

export const AimItem = styled.li`
  display: flex;
  min-height: 310px;
  flex-direction: column;
  justify-content: space-between;
  gap: 4rem;
  padding: clamp(1.8rem, 4vw, 3.25rem);
  border-right: 1px solid rgba(255, 255, 255, 0.2);
  transition: background 220ms ease;

  &:last-child {
    border-right: 0;
  }

  &:hover {
    background: rgba(255, 255, 255, 0.055);
  }

  h3 {
    margin: 0;
    font-family: var(--font-display);
    font-size: clamp(1.8rem, 3vw, 2.85rem);
    font-weight: 600;
    line-height: 1;
    letter-spacing: -0.05em;
  }

  p {
    max-width: 24rem;
    margin: 1rem 0 0;
    color: rgba(255, 255, 255, 0.6);
    text-wrap: pretty;
  }

  @media (max-width: 760px) {
    min-height: 240px;
    border-right: 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.2);

    &:last-child {
      border-bottom: 0;
    }
  }
`;

export const AimNumber = styled.span`
  color: var(--red-soft);
  font-family: var(--font-display);
  font-size: 0.74rem;
  font-weight: 600;
  letter-spacing: 0.13em;
`;

export const MethodCta = styled.div`
  display: flex;
  min-height: 96px;
  align-items: center;
  justify-content: space-between;
  gap: 2rem;
  margin-top: clamp(2.5rem, 5vw, 4.5rem);
  padding-top: clamp(2rem, 4vw, 3rem);
  border-top: 1px solid rgba(255, 255, 255, 0.16);

  p {
    max-width: 40rem;
    margin: 0;
    color: rgba(255, 255, 255, 0.62);
  }

  a {
    display: inline-flex;
    min-height: 48px;
    flex: none;
    align-items: center;
    gap: 0.8rem;
    padding-inline: 1.15rem;
    border: 1px solid rgba(255, 255, 255, 0.35);
    border-radius: var(--radius-small);
    font-size: 0.85rem;
    font-weight: 600;
    transition:
      border-color 180ms ease,
      background 180ms ease;
  }

  a:hover {
    border-color: var(--white);
    background: rgba(255, 255, 255, 0.08);
  }

  @media (max-width: 620px) {
    align-items: flex-start;
    flex-direction: column;
  }
`;

export const Coverage = styled.div`
  padding-block: clamp(5.25rem, 9vw, 8.5rem);
  padding-inline: max(
    clamp(16px, 2.5vw, 36px),
    calc((100vw - 1240px) / 2)
  );
  background: var(--paper);
`;

export const CoverageHeader = styled.header`
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(280px, 0.7fr);
  align-items: end;
  gap: clamp(2rem, 8vw, 8rem);
  margin-bottom: clamp(3rem, 6vw, 5.5rem);

  h2 {
    max-width: 13ch;
    margin: 0.9rem 0 0;
    font-family: var(--font-display);
    font-size: clamp(2.4rem, 4.5vw, 4.35rem);
    font-weight: 600;
    line-height: 0.98;
    letter-spacing: -0.06em;
    text-wrap: balance;
  }

  > p {
    max-width: 34rem;
    margin: 0;
    color: var(--ink-soft);
    line-height: 1.65;
  }

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
    align-items: start;
  }
`;

export const SegmentGrid = styled.ol`
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  margin: 0;
  padding: 0;
  border-top: 1px solid var(--border);
  border-left: 1px solid var(--border);
  list-style: none;

  @media (max-width: 920px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 540px) {
    grid-template-columns: 1fr;
  }
`;

export const SegmentItem = styled.li`
  display: flex;
  min-height: 260px;
  flex-direction: column;
  justify-content: space-between;
  gap: 2.5rem;
  padding: clamp(1.35rem, 3vw, 2.25rem);
  border-right: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
  background: var(--paper);
  transition:
    color 220ms ease,
    background 220ms ease;

  &:nth-child(1),
  &:nth-child(2) {
    grid-column: span 3;
  }

  &:nth-child(n + 3) {
    grid-column: span 2;
  }

  span {
    color: var(--red);
    font-size: 0.7rem;
    font-weight: 600;
    letter-spacing: 0.12em;
  }

  h3 {
    max-width: 14ch;
    margin: 0;
    font-family: var(--font-display);
    font-size: clamp(1.5rem, 2.5vw, 2.25rem);
    font-weight: 600;
    line-height: 1;
    letter-spacing: -0.045em;
    text-wrap: balance;
  }

  p {
    max-width: 28rem;
    margin: 0.8rem 0 0;
    color: var(--ink-soft);
    font-size: 0.9rem;
  }

  &:hover {
    color: var(--white);
    background: var(--forest);
  }

  &:hover p {
    color: rgba(255, 255, 255, 0.64);
  }

  &:hover span {
    color: var(--red-soft);
  }

  @media (max-width: 920px) {
    min-height: 230px;

    &:nth-child(n) {
      grid-column: span 1;
    }
  }
`;

export const OccurrenceSection = styled.section`
  padding-block: clamp(5.25rem, 9vw, 8.5rem);
  padding-inline: max(
    clamp(16px, 2.5vw, 36px),
    calc((100vw - 1240px) / 2)
  );
  background:
    radial-gradient(circle at 93% 8%, rgba(6, 96, 32, 0.08), transparent 24%),
    var(--paper-deep);
`;

export const OccurrenceLayout = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.12fr) minmax(330px, 0.88fr);
  align-items: start;
  gap: clamp(2rem, 6vw, 5rem);
  margin-top: clamp(3rem, 6vw, 5.5rem);

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

export const OccurrenceFeature = styled.article`
  overflow: hidden;
  border-radius: clamp(16px, 2vw, 26px);
  color: var(--white);
  background: var(--forest-deep);
  box-shadow: 0 30px 76px rgba(3, 38, 18, 0.18);
`;

export const OccurrenceFeatureMedia = styled.div`
  position: relative;
  overflow: hidden;
  aspect-ratio: 16 / 8.5;
  background: var(--forest);

  &::after {
    position: absolute;
    inset: auto 0 0;
    height: 48%;
    content: "";
    pointer-events: none;
    background: linear-gradient(to top, rgba(3, 38, 18, 0.88), transparent);
  }

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    filter: saturate(0.82) contrast(1.03);
  }
`;

export const OccurrenceFeatureBody = styled.div`
  padding: clamp(1.6rem, 4vw, 3rem);

  > span {
    color: var(--red-soft);
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  h3 {
    margin: 0.65rem 0 0;
    font-family: var(--font-display);
    font-size: clamp(2.1rem, 4vw, 3.7rem);
    font-weight: 600;
    line-height: 0.96;
    letter-spacing: -0.06em;
  }

  > p {
    max-width: 38rem;
    margin: 1rem 0 0;
    color: rgba(255, 255, 255, 0.64);
  }

  ul {
    display: flex;
    flex-wrap: wrap;
    gap: 0.55rem;
    margin: 1.5rem 0 0;
    padding: 0;
    list-style: none;
  }

  li {
    padding: 0.55rem 0.75rem;
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 999px;
    color: rgba(255, 255, 255, 0.78);
    font-size: 0.75rem;
  }
`;

export const PestGrid = styled.ul`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 0;
  margin: 0;
  padding: 0;
  border-top: 1px solid var(--border-strong);
  border-left: 1px solid var(--border-strong);
  list-style: none;

  @media (max-width: 680px) {
    grid-template-columns: 1fr;
  }
`;

export const PestItem = styled.li`
  min-width: 0;
  border-right: 1px solid var(--border-strong);
  border-bottom: 1px solid var(--border-strong);

  button {
    display: grid;
    width: 100%;
    min-height: 126px;
    grid-template-columns: 62px minmax(0, 1fr) auto;
    align-items: center;
    gap: 1rem;
    padding: 1rem;
    border: 0;
    color: var(--ink);
    background: color-mix(in srgb, var(--paper) 76%, transparent);
    text-align: left;
    cursor: pointer;
    transition:
      color 200ms ease,
      background 200ms ease;
  }

  button::after {
    content: "↗";
    color: var(--red);
    font-size: 1rem;
  }

  img {
    width: 62px;
    height: 62px;
    border-radius: 50%;
    object-fit: cover;
    filter: saturate(0.78);
    transition: transform 220ms var(--ease);
  }

  strong {
    font-family: var(--font-display);
    font-size: 1rem;
    font-weight: 600;
    letter-spacing: -0.02em;
  }

  button:hover,
  button[aria-pressed="true"] {
    color: var(--white);
    background: var(--forest);
  }

  button:hover::after,
  button[aria-pressed="true"]::after {
    color: var(--red-soft);
  }

  button:hover img,
  button[aria-pressed="true"] img {
    transform: scale(1.06);
  }

  @media (max-width: 680px) {
    button {
      min-height: 98px;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    button:hover img,
    button[aria-pressed="true"] img {
      transform: none;
    }
  }
`;

export const FaqSection = styled.section`
  display: grid;
  grid-template-columns: minmax(240px, 0.62fr) minmax(0, 1.38fr);
  align-items: start;
  gap: clamp(3rem, 9vw, 9rem);
  padding-block: clamp(5.25rem, 9vw, 8.5rem);
  padding-inline: max(
    clamp(16px, 2.5vw, 36px),
    calc((100vw - 1240px) / 2)
  );
  background: var(--paper);

  @media (max-width: 840px) {
    grid-template-columns: 1fr;
  }
`;

export const FaqHeader = styled.header`
  position: sticky;
  top: 106px;

  h2 {
    max-width: 11ch;
    margin: 0.85rem 0 0;
    font-family: var(--font-display);
    font-size: clamp(2.35rem, 4.2vw, 4rem);
    font-weight: 600;
    line-height: 0.98;
    letter-spacing: -0.06em;
    text-wrap: balance;
  }

  p:last-child {
    max-width: 28rem;
    margin: 1.25rem 0 0;
    color: var(--ink-soft);
  }

  @media (max-width: 840px) {
    position: static;
  }
`;

export const FaqList = styled.div`
  border-top: 1px solid var(--border-strong);

  details {
    border-bottom: 1px solid var(--border-strong);
  }

  summary {
    position: relative;
    min-height: 92px;
    padding: 2rem 3.25rem 1.5rem 0;
    font-family: var(--font-display);
    font-size: clamp(1.15rem, 2vw, 1.55rem);
    font-weight: 600;
    line-height: 1.2;
    letter-spacing: -0.03em;
    cursor: pointer;
    list-style: none;
  }

  summary::-webkit-details-marker {
    display: none;
  }

  summary::after {
    position: absolute;
    top: 1.9rem;
    right: 0.4rem;
    display: grid;
    width: 32px;
    height: 32px;
    place-items: center;
    border: 1px solid var(--border-strong);
    border-radius: 50%;
    color: var(--green);
    content: "+";
    font-family: var(--font-body);
    font-size: 1.1rem;
    font-weight: 400;
    transition:
      color 180ms ease,
      background 180ms ease,
      transform 220ms var(--ease);
  }

  details[open] summary::after {
    color: var(--white);
    background: var(--green);
    transform: rotate(45deg);
  }

  details p {
    max-width: 44rem;
    margin: 0;
    padding: 0 3rem 2rem 0;
    color: var(--ink-soft);
    line-height: 1.7;
  }
`;

export const ContactSection = styled.section`
  padding-block: clamp(2rem, 5vw, 4.5rem) clamp(5.5rem, 9vw, 8.5rem);
  padding-inline: max(
    clamp(16px, 2.5vw, 36px),
    calc((100vw - 1240px) / 2)
  );
  background: var(--paper);
`;

export const ContactGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 0.92fr) minmax(420px, 1.08fr);
  overflow: hidden;
  border: 1px solid var(--border);
  border-radius: clamp(18px, 2.3vw, 30px);
  background: var(--mint-soft);
  box-shadow: 0 30px 80px rgba(3, 38, 18, 0.12);

  @media (max-width: 900px) {
    grid-template-columns: 1fr;
  }
`;

export const ContactIntro = styled.div`
  padding: clamp(2rem, 5.5vw, 5rem);

  ${SectionTitle} {
    max-width: 12ch;
    font-size: clamp(2.35rem, 4vw, 4rem);
  }

  > p {
    max-width: 32rem;
    margin: 1.5rem 0 0;
    color: var(--ink-soft);
  }
`;

export const ContactDetails = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  margin-top: 3rem;
  border-top: 1px solid var(--border-strong);

  > * {
    display: grid;
    min-height: 72px;
    align-content: center;
    padding: 0.8rem 0;
    border-bottom: 1px solid var(--border-strong);
    font-style: normal;
  }

  > *:nth-child(even) {
    padding-left: 1rem;
  }

  span {
    color: var(--muted);
    font-size: 0.72rem;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  strong {
    margin-top: 0.2rem;
    font-size: 0.86rem;
    font-weight: 600;
  }

  @media (max-width: 520px) {
    grid-template-columns: 1fr;

    > *:nth-child(even) {
      padding-left: 0;
    }
  }
`;

export const ContactLink = styled.a`
  &:hover strong {
    text-decoration: underline;
    text-decoration-color: var(--red);
    text-underline-offset: 4px;
  }
`;

export const FormCard = styled.div`
  padding: clamp(1.6rem, 4vw, 3.4rem);
  color: var(--white);
  background:
    radial-gradient(circle at 92% 7%, rgba(62, 147, 81, 0.25), transparent 25%),
    var(--forest-deep);

  > h3 {
    margin: 0.8rem 0 0;
    font-family: var(--font-display);
    font-size: clamp(1.9rem, 3.2vw, 2.8rem);
    font-weight: 600;
    line-height: 1.02;
    letter-spacing: -0.045em;
    text-wrap: balance;
  }

  > p {
    margin: 0.85rem 0 0;
    color: rgba(255, 255, 255, 0.62);
  }
`;

export const FormEyebrow = styled.p`
  margin: 0 !important;
  color: var(--red-soft) !important;
  font-size: 0.72rem;
  font-weight: 600;
  letter-spacing: 0.11em;
  text-transform: uppercase;
`;

export const Form = styled.form`
  display: grid;
  gap: 1.3rem;
  margin-top: 2rem;
`;

export const Field = styled.div`
  display: grid;
  gap: 0.5rem;

  label {
    font-size: 0.82rem;
    font-weight: 600;
  }

  select,
  input,
  textarea {
    width: 100%;
    border: 1px solid rgba(255, 255, 255, 0.34);
    border-radius: var(--radius-small);
    color: var(--ink);
    background: var(--white);
    outline: 0;
    transition:
      border-color 180ms ease,
      box-shadow 180ms ease;
  }

  select {
    height: 52px;
    padding: 0 2.8rem 0 0.9rem;
    background-image:
      linear-gradient(45deg, transparent 50%, var(--ink) 50%),
      linear-gradient(135deg, var(--ink) 50%, transparent 50%);
    background-position:
      calc(100% - 18px) 22px,
      calc(100% - 13px) 22px;
    background-repeat: no-repeat;
    background-size: 5px 5px, 5px 5px;
    appearance: none;
  }

  input {
    height: 52px;
    padding: 0 0.9rem;
  }

  textarea {
    min-height: 126px;
    padding: 0.85rem 0.9rem;
    line-height: 1.45;
    resize: vertical;
  }

  select:focus-visible,
  input:focus-visible,
  textarea:focus-visible {
    border-color: var(--white);
    box-shadow: none;
    outline: 3px solid var(--red-soft);
    outline-offset: 2px;
  }

  select[aria-invalid="true"],
  input[aria-invalid="true"],
  textarea[aria-invalid="true"] {
    border-color: var(--red-soft);
  }
`;

export const FieldMeta = styled.span`
  display: flex;
  min-height: 18px;
  justify-content: space-between;
  gap: 1rem;
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.72rem;

  span:last-child {
    flex: none;
    font-variant-numeric: tabular-nums;
  }
`;

export const FieldError = styled.span`
  color: var(--red-soft);
  font-size: 0.78rem;
  font-weight: 600;
`;

export const PreferenceGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 1rem;
  padding-top: 0.2rem;

  @media (max-width: 540px) {
    grid-template-columns: 1fr;
  }
`;

export const PreferenceNote = styled.p`
  margin: -0.35rem 0 0;
  color: rgba(255, 255, 255, 0.5);
  font-size: 0.75rem;
  line-height: 1.45;
`;

export const FormActions = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
  margin-top: 0.25rem;

  > span {
    color: rgba(255, 255, 255, 0.62);
    font-size: 0.78rem;
  }

  @media (max-width: 520px) {
    align-items: stretch;
    flex-direction: column;

    ${PrimaryButton} {
      width: 100%;
    }
  }
`;

export const Footer = styled.footer`
  color: var(--white);
  background:
    radial-gradient(circle at 84% 0%, rgba(48, 131, 68, 0.23), transparent 26%),
    var(--forest-deep);
`;

export const FooterCta = styled.div`
  ${container}
  display: grid;
  grid-template-columns: minmax(0, 1.25fr) minmax(260px, 0.75fr);
  align-items: end;
  gap: clamp(2rem, 8vw, 8rem);
  padding-block: clamp(4.5rem, 8vw, 7.5rem);
  border-bottom: 1px solid rgba(255, 255, 255, 0.17);

  p:first-child {
    margin: 0 0 0.9rem;
    color: var(--red-soft);
    font-size: 0.72rem;
    font-weight: 600;
    letter-spacing: 0.13em;
    text-transform: uppercase;
  }

  h2 {
    max-width: 15ch;
    margin: 0;
    font-family: var(--font-display);
    font-size: clamp(2.5rem, 5.2vw, 5.3rem);
    font-weight: 600;
    line-height: 0.93;
    letter-spacing: -0.065em;
    text-wrap: balance;
  }

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
    align-items: start;
  }
`;

export const FooterCtaActions = styled.div`
  display: grid;
  gap: 0.75rem;

  ${PrimaryButton} {
    width: 100%;
  }

  > a:last-child {
    display: inline-flex;
    min-height: 48px;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding-inline: 1rem;
    border: 1px solid rgba(255, 255, 255, 0.3);
    border-radius: var(--radius-small);
    color: rgba(255, 255, 255, 0.82);
    font-size: 0.85rem;
    font-weight: 600;
    transition:
      border-color 180ms ease,
      background 180ms ease;
  }

  > a:last-child:hover {
    border-color: var(--white);
    background: rgba(255, 255, 255, 0.07);
  }
`;

export const FooterInner = styled.div`
  ${container}
  display: grid;
  grid-template-columns: minmax(240px, 1.1fr) repeat(2, minmax(150px, 0.45fr));
  gap: clamp(2.5rem, 7vw, 7rem);
  padding-block: clamp(3rem, 6vw, 5rem);

  @media (max-width: 760px) {
    grid-template-columns: 1fr 1fr;
  }

  @media (max-width: 520px) {
    grid-template-columns: 1fr;
  }
`;

export const FooterBrand = styled.div`
  ${Brand} {
    width: 72px;
    height: 54px;

    img {
      width: 72px;
      height: 72px;
    }
  }

  p {
    max-width: 28rem;
    margin: 1.2rem 0 0;
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.88rem;
  }
`;

export const FooterColumn = styled.div`
  display: grid;
  align-content: start;
  gap: 0.55rem;

  h3 {
    margin: 0 0 0.65rem;
    color: rgba(255, 255, 255, 0.47);
    font-size: 0.7rem;
    font-weight: 600;
    letter-spacing: 0.13em;
    text-transform: uppercase;
  }

  a {
    display: inline-flex;
    min-height: 44px;
    align-items: center;
    color: rgba(255, 255, 255, 0.76);
    font-size: 0.88rem;
    transition: color 180ms ease;
  }

  a:hover {
    color: var(--white);
  }
`;

export const FooterMeta = styled.div`
  ${container}
  display: flex;
  min-height: 84px;
  align-items: center;
  justify-content: space-between;
  gap: 1.5rem;
  border-top: 1px solid rgba(255, 255, 255, 0.14);
  color: rgba(255, 255, 255, 0.48);
  font-size: 0.75rem;

  p {
    margin: 0;
  }

  a {
    display: inline-flex;
    min-height: 44px;
    align-items: center;
    text-decoration: underline;
    text-underline-offset: 4px;
  }

  a:hover {
    color: var(--white);
  }

  @media (max-width: 620px) {
    align-items: flex-start;
    flex-direction: column;
    gap: 0;
    padding-block: 1.25rem;
  }
`;
