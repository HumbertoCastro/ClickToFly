import styled, { createGlobalStyle, keyframes } from "styled-components";
import { Box, Button, Container } from "@mui/material";

const rise = keyframes`
  from {
    opacity: 0;
    transform: translateY(14px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

export const GlobalStyle = createGlobalStyle`
  html {
    scroll-behavior: smooth;
  }

  html,
  body {
    margin: 0;
    min-width: 320px;
    overflow-x: clip;
    background: var(--color-paper);
    color: var(--color-ink);
    font-family: var(--font-body);
    font-size: 16px;
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
  }

  body {
    min-height: 100vh;
  }

  *,
  *::before,
  *::after {
    box-sizing: border-box;
  }

  a {
    color: inherit;
    text-decoration: none;
  }

  img {
    display: block;
    max-width: 100%;
  }

  button,
  input,
  textarea {
    font: inherit;
  }

  ::selection {
    background: var(--color-alert-100);
    color: var(--color-forest-950);
  }

  :focus-visible {
    outline: 3px solid var(--color-focus);
    outline-offset: 4px;
  }

  .skip-link {
    position: fixed;
    left: var(--space-md);
    top: var(--space-md);
    z-index: 100;
    transform: translateY(-160%);
    border-radius: var(--radius-md);
    background: var(--color-forest-950);
    color: var(--color-white);
    padding: var(--space-sm) var(--space-md);
    font-weight: 800;
    transition: transform var(--dur-base) var(--ease-out);
  }

  .skip-link:focus {
    transform: translateY(0);
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
  }
`;

export const SiteShell = styled(Box)`
  min-height: 100vh;
  background: linear-gradient(180deg, var(--color-paper) 0%, var(--color-forest-050) 44%, var(--color-paper) 100%);
`;

export const Header = styled.header`
  position: sticky;
  top: 0;
  z-index: 30;
  border-bottom: 1px solid color-mix(in oklch, var(--color-border) 68%, transparent);
  background: color-mix(in oklch, var(--color-paper) 88%, transparent);
  backdrop-filter: blur(18px);
`;

export const HeaderInner = styled(Container)`
  && {
    min-height: 76px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-md);
  }

  @media (max-width: 560px) {
    && {
      min-height: 68px;
      gap: var(--space-sm);
    }

    .header-action {
      min-width: 0;
      padding-inline: var(--space-sm);
    }
  }
`;

export const BrandMark = styled.a`
  display: inline-flex;
  align-items: center;
  gap: var(--space-sm);
  min-height: 44px;
  min-width: 0;
  padding-right: var(--space-xs);
`;

export const BrandName = styled.span`
  display: grid;
  line-height: 0.92;
`;

export const BrandWord = styled.span`
  color: var(--color-forest-700);
  font-family: var(--font-display);
  font-size: clamp(1.35rem, 3vw, 2rem);
  font-weight: 760;
  letter-spacing: 0;
`;

export const BrandSub = styled.span`
  color: var(--color-forest-950);
  font-size: 0.56rem;
  font-weight: 800;
  letter-spacing: 0.04em;
`;

export const OrkinBadge = styled.span`
  display: inline-flex;
  min-width: 48px;
  min-height: 26px;
  align-items: center;
  justify-content: center;
  transform: skew(-18deg);
  background: var(--color-alert-600);
  color: var(--color-white);
  font-family: var(--font-display);
  font-size: 0.66rem;
  font-weight: 800;
  letter-spacing: 0.03em;

  span {
    transform: skew(18deg);
  }

  @media (max-width: 420px) {
    display: none;
  }
`;

export const Nav = styled.nav`
  display: flex;
  align-items: center;
  gap: var(--space-xs);
  color: var(--color-ink-soft);
  font-size: var(--text-sm);
  font-weight: 800;

  a {
    min-height: 44px;
    display: inline-flex;
    align-items: center;
    gap: var(--space-xs);
    border-radius: var(--radius-md);
    padding: 0 var(--space-md);
    transition:
      background var(--dur-fast) var(--ease-out),
      color var(--dur-fast) var(--ease-out);
  }

  a:hover {
    background: var(--color-forest-050);
    color: var(--color-forest-900);
  }

  @media (max-width: 980px) {
    display: none;
  }
`;

export const ActionButton = styled(Button)`
  && {
    min-height: 48px;
    border-radius: var(--radius-md);
    background: var(--color-alert-600);
    color: var(--color-white);
    box-shadow: 0 0.55rem 0 color-mix(in oklch, var(--color-alert-700) 86%, var(--color-forest-950));
    padding: 0 var(--space-lg);
    font-weight: 850;
    line-height: 1;
    transition:
      transform var(--dur-fast) var(--ease-out),
      box-shadow var(--dur-fast) var(--ease-out),
      background var(--dur-fast) var(--ease-out);
  }

  &&:hover {
    background: var(--color-alert-700);
    box-shadow: 0 0.38rem 0 color-mix(in oklch, var(--color-alert-700) 92%, var(--color-forest-950));
    transform: translateY(3px);
  }

  &&:active {
    box-shadow: 0 0.15rem 0 color-mix(in oklch, var(--color-alert-700) 92%, var(--color-forest-950));
    transform: translateY(6px);
  }

  && .MuiButton-startIcon,
  && .MuiButton-endIcon {
    color: currentColor;
  }
`;

export const SecondaryButton = styled(Button)`
  && {
    min-height: 48px;
    border-radius: var(--radius-md);
    border: 1px solid var(--color-forest-700);
    color: var(--color-forest-900);
    background: var(--color-surface);
    padding: 0 var(--space-lg);
    font-weight: 850;
  }

  &&:hover {
    background: var(--color-forest-050);
    border-color: var(--color-forest-950);
  }
`;

export const Hero = styled.section`
  position: relative;
  isolation: isolate;
  overflow: clip;
  border-bottom: 1px solid var(--color-border);
  background:
    linear-gradient(90deg, color-mix(in oklch, var(--color-forest-950) 95%, black) 0%, color-mix(in oklch, var(--color-forest-950) 72%, transparent) 36%, transparent 62%),
    linear-gradient(128deg, var(--color-forest-950) 0%, var(--color-forest-900) 42%, var(--color-forest-700) 74%, var(--color-forest-100) 128%);

  &::before,
  &::after {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
  }

  &::before {
    z-index: 0;
    background:
      linear-gradient(116deg, transparent 0 42%, color-mix(in oklch, var(--color-forest-700) 15%, transparent) 42% 54%, transparent 54% 100%),
      linear-gradient(72deg, color-mix(in oklch, var(--color-white) 5%, transparent) 0 1px, transparent 1px 100%),
      repeating-linear-gradient(90deg, color-mix(in oklch, var(--color-white) 5%, transparent) 0 1px, transparent 1px 96px),
      repeating-linear-gradient(0deg, color-mix(in oklch, var(--color-white) 4%, transparent) 0 1px, transparent 1px 88px);
    mask-image: linear-gradient(90deg, rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.28) 58%, transparent 100%);
  }

  &::after {
    z-index: 0;
    background:
      linear-gradient(100deg, transparent 0 64%, color-mix(in oklch, var(--color-alert-600) 13%, transparent) 64% 64.42%, transparent 64.42% 100%),
      linear-gradient(148deg, transparent 0 57%, color-mix(in oklch, var(--color-white) 5%, transparent) 57% 57.72%, transparent 57.72% 100%),
      linear-gradient(180deg, transparent 0 72%, color-mix(in oklch, var(--color-forest-950) 55%, transparent) 100%);
    opacity: 0.82;
  }
`;

export const HeroGrid = styled(Container)`
  && {
    position: relative;
    z-index: 1;
    min-height: calc(100vh - 76px);
    display: grid;
    grid-template-columns: minmax(0, 0.56fr) minmax(360px, 1fr);
    align-items: center;
    gap: clamp(var(--space-xl), 5vw, var(--space-4xl));
    padding-top: clamp(var(--space-2xl), 5vw, var(--space-4xl));
    padding-bottom: clamp(var(--space-2xl), 5vw, var(--space-4xl));
  }

  @media (max-width: 1180px) {
    && {
      min-height: auto;
      grid-template-columns: minmax(0, 0.8fr) minmax(300px, 1fr);
    }
  }

  @media (max-width: 820px) {
    && {
      grid-template-columns: minmax(0, 1fr);
      padding-top: var(--space-2xl);
    }
  }
`;

export const HeroCopy = styled.div`
  animation: ${rise} var(--dur-slow) var(--ease-out) both;

  > p {
    max-width: 39ch;
    margin: var(--space-lg) 0 0;
    color: color-mix(in oklch, var(--color-white) 82%, var(--color-forest-100));
    font-size: clamp(1.08rem, 1.6vw, 1.26rem);
    line-height: 1.52;
    text-wrap: pretty;
  }
`;

export const HeroKicker = styled.p`
  width: fit-content;
  display: inline-flex;
  align-items: center;
  gap: var(--space-xs);
  margin: 0 0 var(--space-lg);
  border: 1px solid color-mix(in oklch, var(--color-white) 28%, transparent);
  background: color-mix(in oklch, var(--color-white) 8%, transparent);
  color: var(--color-white);
  padding: var(--space-xs) var(--space-sm);
  font-size: var(--text-sm);
  font-weight: 850;
`;

export const HeroTitle = styled.h1`
  max-width: 13ch;
  margin: 0;
  color: var(--color-white);
  font-family: var(--font-display);
  font-size: clamp(3rem, 6vw, 6.1rem);
  font-weight: 820;
  letter-spacing: 0;
  line-height: 0.95;
  text-wrap: balance;
  overflow-wrap: anywhere;
`;

export const ButtonRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-md);
  margin-top: var(--space-xl);
`;

export const HeroMedia = styled.figure`
  position: relative;
  min-width: 0;
  margin: 0;
  align-self: center;
  display: grid;
  align-items: center;
  justify-items: end;
  animation: ${rise} var(--dur-slow) var(--ease-out) 80ms both;

  @media (max-width: 1180px) {
    align-self: auto;
  }
`;

export const HeroImage = styled.img`
  width: min(100%, 980px);
  max-width: none;
  min-height: 0;
  max-height: min(78vh, 760px);
  object-fit: contain;
  object-position: center;
  filter: drop-shadow(0 2.2rem 3.2rem color-mix(in oklch, var(--color-forest-950) 34%, transparent));

  @media (max-width: 1180px) {
    max-height: 660px;
  }

  @media (max-width: 820px) {
    max-height: 520px;
  }

  @media (max-width: 420px) {
    max-height: 470px;
  }
`;

export const Section = styled.section`
  padding: clamp(var(--space-3xl), 8vw, var(--space-4xl)) 0;
  background: color-mix(in oklch, var(--color-paper) 90%, var(--color-white));

  &[id="contato"] {
    background: var(--color-forest-950);
    color: var(--color-white);
  }
`;

export const SectionFrame = styled(Container)`
  && {
    min-width: 0;
  }
`;

export const SectionHead = styled.div`
  max-width: 840px;
  margin-bottom: clamp(var(--space-xl), 5vw, var(--space-3xl));

  h2 {
    margin: 0;
    color: var(--color-forest-950);
    font-family: var(--font-display);
    font-size: var(--text-2xl);
    font-weight: 800;
    letter-spacing: 0;
    line-height: 1.04;
    text-wrap: balance;
  }

  p {
    max-width: 68ch;
    margin: var(--space-md) 0 0;
    color: var(--color-ink-soft);
    font-size: var(--text-lg);
    line-height: 1.55;
  }
`;

export const SectionEyebrow = styled.span`
  display: inline-flex;
  margin-bottom: var(--space-sm);
  color: var(--color-alert-700);
  font-size: var(--text-xs);
  font-weight: 900;
  letter-spacing: 0.09em;
  text-transform: uppercase;
`;

export const ResponseList = styled.div`
  display: grid;
  border-top: 1px solid var(--color-rule);
`;

export const ResponseRow = styled.article`
  display: grid;
  grid-template-columns: 8rem minmax(0, 1fr);
  gap: clamp(var(--space-md), 4vw, var(--space-2xl));
  border-bottom: 1px solid var(--color-border);
  padding: clamp(var(--space-lg), 4vw, var(--space-2xl)) 0;

  > span {
    color: var(--color-alert-600);
    font-family: var(--font-display);
    font-size: clamp(2rem, 5vw, 4rem);
    font-weight: 800;
    line-height: 0.9;
  }

  h3 {
    margin: 0;
    color: var(--color-forest-950);
    font-family: var(--font-display);
    font-size: clamp(1.35rem, 3vw, 2rem);
    line-height: 1.05;
  }

  p {
    max-width: 68ch;
    margin: var(--space-sm) 0 0;
    color: var(--color-ink-soft);
    font-size: var(--text-lg);
    line-height: 1.55;
  }

  @media (max-width: 640px) {
    grid-template-columns: minmax(0, 1fr);
    gap: var(--space-sm);
  }
`;

export const ServiceGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: var(--space-sm);
`;

export const ServiceItem = styled.article`
  min-width: 0;
  display: grid;
  align-content: start;
  gap: var(--space-sm);
  grid-column: span 2;
  min-height: 280px;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: color-mix(in oklch, var(--color-surface) 94%, var(--color-forest-050));
  padding: clamp(var(--space-lg), 3vw, var(--space-xl));
  transition:
    transform var(--dur-base) var(--ease-out),
    border-color var(--dur-base) var(--ease-out),
    background var(--dur-base) var(--ease-out);

  &:first-child,
  &:nth-child(2) {
    grid-column: span 3;
  }

  &:hover {
    transform: translateY(-4px);
    border-color: var(--color-forest-700);
    background: var(--color-surface);
  }

  span {
    width: fit-content;
    border-left: 3px solid var(--color-alert-600);
    background: var(--color-alert-100);
    color: var(--color-alert-700);
    padding: var(--space-2xs) var(--space-sm);
    font-size: var(--text-xs);
    font-weight: 900;
  }

  h3 {
    margin: var(--space-md) 0 0;
    color: var(--color-forest-950);
    font-family: var(--font-display);
    font-size: clamp(1.35rem, 2.7vw, 2.15rem);
    line-height: 1.05;
    text-wrap: balance;
  }

  p {
    margin: 0;
    color: var(--color-ink-soft);
    font-size: var(--text-lg);
    line-height: 1.5;
  }

  @media (max-width: 1020px) {
    grid-column: span 3;

    &:first-child,
    &:nth-child(2) {
      grid-column: span 3;
    }
  }

  @media (max-width: 680px) {
    grid-column: 1 / -1;
    min-height: 0;

    &:first-child,
    &:nth-child(2) {
      grid-column: 1 / -1;
    }
  }
`;

export const MethodBand = styled.section`
  padding: clamp(var(--space-3xl), 8vw, var(--space-4xl)) 0;
  background: linear-gradient(145deg, var(--color-forest-950) 0%, var(--color-forest-900) 62%, var(--color-forest-800) 100%);
  color: var(--color-white);

  ${SectionHead} h2,
  ${SectionHead} p {
    color: var(--color-white);
  }

  ${SectionHead} p {
    color: color-mix(in oklch, var(--color-white) 78%, var(--color-forest-100));
  }

  ${SectionEyebrow} {
    color: var(--color-amber-200);
  }
`;

export const MethodGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  border-top: 1px solid color-mix(in oklch, var(--color-white) 28%, transparent);
  border-left: 1px solid color-mix(in oklch, var(--color-white) 20%, transparent);

  @media (max-width: 820px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

export const MethodItem = styled.article`
  min-width: 0;
  border-right: 1px solid color-mix(in oklch, var(--color-white) 20%, transparent);
  border-bottom: 1px solid color-mix(in oklch, var(--color-white) 20%, transparent);
  padding: clamp(var(--space-lg), 4vw, var(--space-2xl));

  span {
    color: var(--color-amber-200);
    font-family: var(--font-display);
    font-size: var(--text-xl);
    font-weight: 800;
  }

  h3 {
    margin: var(--space-lg) 0 0;
    color: var(--color-white);
    font-family: var(--font-display);
    font-size: clamp(1.55rem, 3vw, 2.45rem);
    line-height: 1;
  }

  p {
    margin: var(--space-md) 0 0;
    color: color-mix(in oklch, var(--color-white) 78%, var(--color-forest-100));
    line-height: 1.6;
  }
`;

export const RiskPlanList = styled.div`
  display: grid;
  gap: clamp(var(--space-xl), 6vw, var(--space-3xl));
`;

export const RiskPlanCopy = styled.div`
  min-width: 0;

  span {
    display: inline-flex;
    width: fit-content;
    border-left: 3px solid var(--color-alert-600);
    background: var(--color-alert-100);
    color: var(--color-alert-700);
    padding: var(--space-2xs) var(--space-sm);
    font-size: var(--text-xs);
    font-weight: 900;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  h3 {
    max-width: 12ch;
    margin: var(--space-lg) 0 0;
    color: var(--color-forest-950);
    font-family: var(--font-display);
    font-size: clamp(2.25rem, 4.8vw, 4.75rem);
    font-weight: 830;
    letter-spacing: 0;
    line-height: 0.94;
    text-wrap: balance;
  }

  p {
    max-width: 56ch;
    margin: var(--space-lg) 0 0;
    color: var(--color-ink-soft);
    font-size: clamp(1rem, 1.45vw, 1.24rem);
    line-height: 1.55;
    text-wrap: pretty;
  }

  strong {
    display: block;
    max-width: 48ch;
    margin-top: var(--space-md);
    color: var(--color-forest-900);
    font-size: var(--text-lg);
    line-height: 1.35;
  }
`;

export const RiskPlanMedia = styled.figure`
  position: relative;
  min-width: 0;
  margin: 0;
  overflow: hidden;
  border-radius: var(--radius-lg);
  background: var(--color-forest-950);
  box-shadow:
    0 0 0 1px rgba(0, 0, 0, 0.1),
    0 1.4rem 3.2rem color-mix(in oklch, var(--color-forest-950) 18%, transparent);

  &::after {
    content: "";
    position: absolute;
    inset: 0;
    pointer-events: none;
    background:
      linear-gradient(180deg, transparent 48%, color-mix(in oklch, var(--color-forest-950) 30%, transparent) 100%),
      linear-gradient(90deg, color-mix(in oklch, var(--color-forest-950) 18%, transparent), transparent 28%);
    mix-blend-mode: multiply;
  }
`;

export const RiskPlanImage = styled.img`
  width: 100%;
  height: min(68vh, 680px);
  min-height: 480px;
  object-fit: cover;
  outline: 1px solid rgba(0, 0, 0, 0.1);
  outline-offset: -1px;
  transition:
    transform var(--dur-slow) var(--ease-out),
    filter var(--dur-slow) var(--ease-out);
`;

export const RiskPlanItem = styled.article`
  display: grid;
  grid-template-columns: minmax(0, 0.84fr) minmax(320px, 0.72fr);
  gap: clamp(var(--space-xl), 6vw, var(--space-4xl));
  align-items: center;
  border-top: 1px solid var(--color-border);
  padding-top: clamp(var(--space-xl), 5vw, var(--space-3xl));

  &:nth-child(even) {
    grid-template-columns: minmax(320px, 0.72fr) minmax(0, 0.84fr);
  }

  &:nth-child(even) ${RiskPlanCopy} {
    grid-column: 2;
    grid-row: 1;
  }

  &:nth-child(even) ${RiskPlanMedia} {
    grid-column: 1;
    grid-row: 1;
  }

  &:hover ${RiskPlanImage} {
    filter: saturate(1.08) contrast(1.04);
    transform: scale(1.025);
  }

  @media (max-width: 900px) {
    grid-template-columns: minmax(0, 1fr);

    &:nth-child(even) {
      grid-template-columns: minmax(0, 1fr);
    }

    &:nth-child(even) ${RiskPlanCopy},
    &:nth-child(even) ${RiskPlanMedia} {
      grid-column: auto;
      grid-row: auto;
    }

    ${RiskPlanMedia} {
      order: -1;
    }

    ${RiskPlanCopy} h3 {
      max-width: 14ch;
      font-size: clamp(2rem, 10vw, 3.2rem);
    }

    ${RiskPlanImage} {
      height: 74vh;
      min-height: 440px;
    }
  }

  @media (max-width: 520px) {
    gap: var(--space-lg);

    ${RiskPlanImage} {
      height: 520px;
      min-height: 0;
    }
  }
`;

export const ProofGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(260px, 0.75fr) minmax(0, 1fr);
  gap: clamp(var(--space-xl), 7vw, var(--space-4xl));
  align-items: center;

  @media (max-width: 900px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

export const SpecialistFigure = styled.figure`
  position: relative;
  margin: 0;

  &::before {
    content: "";
    position: absolute;
    inset: 9% auto 9% -7%;
    width: 44%;
    background: var(--color-alert-600);
    z-index: -1;
  }
`;

export const ProofImage = styled.img`
  width: 100%;
  max-height: 720px;
  object-fit: cover;
  object-position: 42% 34%;
  border-radius: var(--radius-lg);
  border: 1px solid var(--color-border);
  background: var(--color-forest-050);
  box-shadow: var(--shadow-panel);

  @media (max-width: 900px) {
    max-height: 560px;
  }
`;

export const ProofCopy = styled.div`
  h2 {
    margin: 0;
    color: var(--color-forest-950);
    font-family: var(--font-display);
    font-size: var(--text-2xl);
    font-weight: 800;
    line-height: 1.03;
    text-wrap: balance;
  }

  > p {
    max-width: 68ch;
    margin: var(--space-lg) 0 0;
    color: var(--color-ink-soft);
    font-size: var(--text-lg);
    line-height: 1.55;
  }
`;

export const Evidence = styled.ul`
  display: grid;
  gap: var(--space-md);
  padding: 0;
  margin: var(--space-xl) 0 0;
  list-style: none;
`;

export const EvidenceItem = styled.li`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: var(--space-md);
  border-top: 1px solid var(--color-border);
  padding-top: var(--space-md);

  svg {
    color: var(--color-alert-600);
    margin-top: 0.2rem;
  }

  h3 {
    margin: 0;
    color: var(--color-forest-950);
    font-family: var(--font-display);
    font-size: var(--text-lg);
    line-height: 1.15;
  }

  p {
    margin: var(--space-xs) 0 0;
    color: var(--color-ink-soft);
    line-height: 1.5;
  }
`;

export const PestTrack = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: var(--space-sm);
  margin-bottom: var(--space-xl);
`;

export const PestChip = styled.article`
  position: relative;
  isolation: isolate;
  min-width: 0;
  min-height: 242px;
  display: grid;
  grid-template-rows: 1fr auto;
  gap: var(--space-sm);
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border-radius: var(--radius-lg);
  background: color-mix(in oklch, var(--color-surface) 91%, var(--color-forest-050));
  color: var(--color-forest-900);
  padding: var(--space-lg);
  box-shadow:
    0 0 0 1px color-mix(in oklch, var(--color-forest-950) 9%, transparent),
    0 0.6rem 1.4rem color-mix(in oklch, var(--color-forest-950) 6%, transparent);
  cursor: default;
  transition:
    transform var(--dur-base) var(--ease-out),
    scale var(--dur-fast) var(--ease-out),
    background var(--dur-base) var(--ease-out),
    color var(--dur-base) var(--ease-out),
    box-shadow var(--dur-base) var(--ease-out);

  .pest-visual {
    width: min(172px, 76%);
    aspect-ratio: 4 / 3;
    display: grid;
    place-items: center;
    color: var(--color-forest-700);
    transition:
      transform var(--dur-base) var(--ease-out),
      opacity var(--dur-base) var(--ease-out),
      filter var(--dur-base) var(--ease-out),
      color var(--dur-base) var(--ease-out);
  }

  .pest-visual img {
    width: 100%;
    height: 100%;
    object-fit: contain;
    filter: drop-shadow(0 0.75rem 1.2rem color-mix(in oklch, var(--color-forest-950) 12%, transparent));
    transition: filter var(--dur-base) var(--ease-out);
  }

  strong {
    position: relative;
    z-index: 2;
    color: var(--color-forest-950);
    font-family: var(--font-display);
    font-size: var(--text-lg);
    font-weight: 830;
    letter-spacing: 0;
    line-height: 1;
    text-align: center;
    text-wrap: balance;
    transition:
      transform var(--dur-base) var(--ease-out),
      color var(--dur-base) var(--ease-out);
  }

  strong[id="vespas-title"] {
    max-width: 17ch;
    font-size: 1.02rem;
    line-height: 1.08;
  }

  p {
    position: absolute;
    inset: auto var(--space-md) var(--space-lg);
    z-index: 3;
    max-width: 34ch;
    margin: 0 auto;
    color: color-mix(in oklch, var(--color-white) 86%, var(--color-forest-100));
    font-size: 0.88rem;
    font-weight: 700;
    line-height: 1.34;
    text-align: center;
    text-wrap: pretty;
    opacity: 0;
    filter: blur(4px);
    transform: translateY(10px);
    transition:
      opacity var(--dur-base) var(--ease-out),
      filter var(--dur-base) var(--ease-out),
      transform var(--dur-base) var(--ease-out);
  }

  &:hover,
  &:focus,
  &:focus-visible {
    background: var(--color-forest-950);
    color: var(--color-white);
    box-shadow:
      0 0 0 1px color-mix(in oklch, var(--color-forest-700) 44%, transparent),
      0 1.1rem 2rem color-mix(in oklch, var(--color-forest-950) 16%, transparent);
    transform: translateY(-4px);
  }

  &:active {
    scale: 0.96;
  }

  &:hover .pest-visual,
  &:focus .pest-visual,
  &:focus-visible .pest-visual {
    color: var(--color-forest-100);
    opacity: 0.3;
    filter: blur(1px);
    transform: translateY(-20px) scale(1.16);
  }

  &:hover .pest-visual img,
  &:focus .pest-visual img,
  &:focus-visible .pest-visual img {
    filter: brightness(0) invert(91%) sepia(12%) saturate(560%) hue-rotate(81deg) brightness(104%) contrast(91%);
  }

  &:hover strong,
  &:focus strong,
  &:focus-visible strong {
    color: var(--color-white);
    transform: translateY(-76px);
  }

  &:hover p,
  &:focus p,
  &:focus-visible p {
    opacity: 1;
    filter: blur(0);
    transform: translateY(0);
  }

  @media (hover: none) {
    min-height: 256px;
    align-content: start;
    justify-items: center;
    background: var(--color-forest-950);
    color: var(--color-white);

    .pest-visual {
    width: min(152px, 72%);
      color: var(--color-forest-100);
      opacity: 0.34;
      filter: none;
      transform: none;
    }

    .pest-visual img {
      filter: brightness(0) invert(91%) sepia(12%) saturate(560%) hue-rotate(81deg) brightness(104%) contrast(91%);
    }

    strong {
      color: var(--color-white);
      transform: none;
    }

    p {
      position: static;
      opacity: 1;
      filter: none;
      transform: none;
    }
  }

  @media (max-width: 520px) {
    min-height: 236px;
  }
`;

export const SectorGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(174px, 1fr));
  gap: var(--space-sm);
`;

export const SectorItem = styled.div`
  position: relative;
  min-height: 74px;
  display: flex;
  align-items: center;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  background: color-mix(in oklch, var(--color-white) 78%, var(--color-forest-050));
  color: var(--color-forest-950);
  padding: var(--space-md) var(--space-md) var(--space-md) var(--space-xl);
  font-weight: 850;

  &::before {
    content: "";
    position: absolute;
    left: var(--space-md);
    width: 0.42rem;
    height: 0.42rem;
    background: var(--color-forest-700);
  }
`;

export const ContactPanel = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 0.85fr) minmax(300px, 1fr);
  gap: clamp(var(--space-lg), 4vw, var(--space-2xl));
  align-items: start;

  @media (max-width: 900px) {
    grid-template-columns: minmax(0, 1fr);
  }
`;

export const ContactText = styled.div`
  color: var(--color-white);

  ${SectionEyebrow} {
    color: var(--color-amber-200);
  }

  h2 {
    margin: 0;
    color: var(--color-white);
    font-family: var(--font-display);
    font-size: var(--text-2xl);
    line-height: 1.04;
    text-wrap: balance;
  }

  p {
    max-width: 62ch;
    margin: var(--space-md) 0 0;
    color: color-mix(in oklch, var(--color-white) 78%, var(--color-forest-100));
    font-size: var(--text-lg);
    line-height: 1.55;
  }
`;

export const ContactList = styled.ul`
  display: grid;
  gap: var(--space-md);
  padding: 0;
  margin: var(--space-xl) 0 0;
  list-style: none;

  li {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    gap: var(--space-sm);
    align-items: start;
    color: color-mix(in oklch, var(--color-white) 84%, var(--color-forest-100));
    line-height: 1.35;
  }

  svg {
    color: var(--color-amber-200);
  }
`;

export const ContactCard = styled.div`
  min-width: 0;
`;

export const FormPanel = styled.form<{ $compact?: boolean }>`
  min-width: 0;
  display: grid;
  border: 1px solid color-mix(in oklch, var(--color-forest-950) 16%, var(--color-border));
  border-radius: var(--radius-lg);
  background: var(--color-surface);
  box-shadow: ${({ $compact }) => ($compact ? "none" : "var(--shadow-panel)")};
  overflow: hidden;
`;

export const FormHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-md);
  background: var(--color-forest-950);
  color: var(--color-white);
  padding: var(--space-md) var(--space-lg);

  span {
    color: var(--color-amber-200);
    font-size: var(--text-xs);
    font-weight: 900;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  strong {
    font-size: var(--text-sm);
    line-height: 1.1;
  }

  @media (max-width: 380px) {
    align-items: flex-start;
    flex-direction: column;
    gap: var(--space-xs);
  }
`;

export const FormBody = styled.div`
  display: grid;
  gap: var(--space-md);
  padding: clamp(var(--space-lg), 3vw, var(--space-xl));

  .MuiFormLabel-root,
  .MuiInputBase-input,
  .MuiFormHelperText-root {
    font-family: var(--font-body);
  }

  .MuiInputLabel-root {
    color: var(--color-muted);
  }

  .MuiOutlinedInput-root {
    min-height: 52px;
    border-radius: var(--radius-md);
    background: var(--color-paper);
  }

  .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline {
    border-color: var(--color-forest-700);
    border-width: 1px;
  }

  .MuiOutlinedInput-root.Mui-focused {
    outline: 2px solid var(--color-focus);
    outline-offset: 1px;
  }

  .MuiFormHelperText-root {
    margin-left: 0;
    font-weight: 700;
  }
`;

export const StatusMessage = styled.p<{ $tone: "success" | "error" }>`
  margin: 0;
  border: 1px solid ${({ $tone }) => ($tone === "success" ? "var(--color-forest-700)" : "var(--color-alert-600)")};
  background: ${({ $tone }) => ($tone === "success" ? "var(--color-forest-050)" : "var(--color-alert-100)")};
  color: ${({ $tone }) => ($tone === "success" ? "var(--color-forest-950)" : "var(--color-alert-700)")};
  padding: var(--space-sm) var(--space-md);
  font-weight: 850;
  line-height: 1.35;
`;

export const Footer = styled.footer`
  border-top: 1px solid color-mix(in oklch, var(--color-white) 18%, var(--color-forest-950));
  background: var(--color-forest-950);
  color: var(--color-white);
  padding: var(--space-xl) 0;

  ${BrandWord},
  ${BrandSub} {
    color: var(--color-white);
  }
`;

export const FooterInner = styled(Container)`
  && {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-md);
    color: color-mix(in oklch, var(--color-white) 78%, var(--color-forest-100));
  }
`;
