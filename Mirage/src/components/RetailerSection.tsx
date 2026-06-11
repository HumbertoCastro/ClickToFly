import { ArrowUpRight } from "@phosphor-icons/react";
import type { CSSProperties } from "react";
import styled from "styled-components";
import heroEyewear from "../assets/mirage-hero-2-5d-translucent.png";
import { retailerBenefits, whatsAppHref } from "../data";
import { layout, palette, radii, shadows } from "../theme";
import { Reveal } from "./Reveal";

const Section = styled.section`
  padding: clamp(72px, 11vw, 136px) 0;
  background:
    linear-gradient(180deg, ${palette.paper} 0%, ${palette.coolMist} 48%, ${palette.champagneSoft} 100%);
  scroll-margin-top: 82px;
`;

const Inner = styled.div`
  width: min(100% - 32px, ${layout.max});
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(0, 0.94fr) minmax(0, 1.06fr);
  gap: clamp(32px, 6vw, 76px);
  align-items: center;

  @media (max-width: 920px) {
    grid-template-columns: 1fr;
  }
`;

const Copy = styled.div`
  h2 {
    max-width: 600px;
    margin: 0;
    color: ${palette.ink};
    font-size: clamp(2.45rem, 5vw, 5.4rem);
    font-weight: 800;
    letter-spacing: -0.035em;
    line-height: 0.92;
  }

  p {
    max-width: 540px;
    margin: 22px 0 0;
    color: ${palette.muted};
    font-size: 1.04rem;
    line-height: 1.62;
  }
`;

const Benefits = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  column-gap: 22px;
  row-gap: 4px;
  margin-top: 32px;

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`;

const Benefit = styled.article`
  display: grid;
  grid-template-columns: 32px minmax(0, 1fr);
  column-gap: 14px;
  border-top: 1px solid ${palette.line};
  padding: 17px 0 15px;

  svg {
    color: ${palette.bronze};
    grid-row: span 2;
    margin-top: 2px;
  }

  h3 {
    margin: 0;
    color: ${palette.ink};
    font-size: 1rem;
    line-height: 1.18;
  }

  p {
    grid-column: 2;
    margin: 8px 0 0;
    color: ${palette.muted};
    font-size: 0.9rem;
    line-height: 1.45;
  }
`;

const Media = styled.figure`
  position: relative;
  margin: 0;
  min-height: 560px;
  border-radius: ${radii.lg};
  overflow: hidden;
  display: grid;
  align-items: center;
  background:
    radial-gradient(circle at 22% 24%, rgba(239, 216, 159, 0.5), transparent 30%),
    radial-gradient(circle at 78% 70%, rgba(139, 205, 217, 0.42), transparent 34%),
    linear-gradient(145deg, ${palette.paper} 0%, ${palette.champagneSoft} 48%, ${palette.coolMist} 100%);
  box-shadow: ${shadows.lift};

  &::before {
    content: "";
    position: absolute;
    inset: 14px;
    border: 1px solid rgba(6, 16, 68, 0.08);
    border-radius: calc(${radii.lg} - 7px);
    pointer-events: none;
  }

  &::after {
    content: "";
    position: absolute;
    left: 10%;
    right: 10%;
    bottom: 30%;
    height: 22px;
    border-radius: 999px;
    background: rgba(6, 16, 68, 0.16);
    filter: blur(20px);
    opacity: 0.5;
    pointer-events: none;
  }

  &:hover [data-eyewear-drop-target] img {
    transform: translateY(-4px) scale(1.018);
  }

  @media (max-width: 920px) {
    min-height: 420px;
  }

  @media (max-width: 520px) {
    min-height: 340px;
  }
`;

const EyewearDock = styled.div`
  position: relative;
  z-index: 1;
  width: min(112%, 680px);
  aspect-ratio: 1689 / 931;
  justify-self: center;
  margin: clamp(-16px, -2vw, -8px) 0 clamp(58px, 8vw, 88px);
  filter: drop-shadow(0 34px 32px rgba(6, 16, 68, 0.2))
    drop-shadow(0 9px 12px rgba(182, 144, 74, 0.12));

  @media (max-width: 920px) {
    width: min(104%, 600px);
    margin-top: -8px;
  }

  @media (max-width: 520px) {
    width: 112%;
    margin: -18px -6% 78px;
  }
`;

const EyewearImage = styled.img`
  display: block;
  width: 100%;
  height: auto;
  opacity: 1;
  transition:
    opacity 160ms ease,
    transform 520ms cubic-bezier(0.16, 1, 0.3, 1);
  will-change: transform, opacity;

  body[data-eyewear-bridge-active="true"] & {
    opacity: 0;
  }

  @media (prefers-reduced-motion: reduce) {
    transition: none;
  }
`;

const MediaLabel = styled.figcaption`
  position: absolute;
  left: 18px;
  right: 18px;
  bottom: 18px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  border: 1px solid rgba(255, 255, 255, 0.22);
  border-radius: ${radii.md};
  background: rgba(6, 16, 68, 0.72);
  color: ${palette.paper};
  padding: 16px;
  backdrop-filter: blur(14px);

  span {
    color: ${palette.goldSoft};
    font-size: 0.78rem;
    font-weight: 800;
    letter-spacing: 0.16em;
    text-transform: uppercase;
  }

  strong {
    display: block;
    margin-top: 5px;
    font-size: 1.08rem;
  }

  @media (max-width: 520px) {
    align-items: flex-start;
    flex-direction: column;
  }
`;

const Cta = styled.a`
  display: inline-flex;
  min-height: 46px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border-radius: ${radii.pill};
  background: ${palette.paper};
  color: ${palette.navy};
  font-size: 0.88rem;
  font-weight: 900;
  padding: 0 16px;
  text-decoration: none;
  white-space: nowrap;
  transition:
    background 180ms ease,
    transform 180ms ease;

  &:hover,
  &:focus-visible {
    background: ${palette.goldSoft};
    transform: translateY(-1px);
    outline: none;
  }
`;

export function RetailerSection() {
  return (
    <Section id="consignacao" aria-labelledby="retailer-title">
      <Inner>
        <Reveal>
          <Copy>
            <h2 id="retailer-title">Consignação pensada para loja física.</h2>
            <p>
              A Mirage combina produto de alto apelo visual com uma operação comercial simples
              para quem quer testar modelos, valorizar vitrine e comprar com mais segurança.
            </p>
            <Benefits>
              {retailerBenefits.map((benefit, index) => (
                <Benefit
                  key={benefit.title}
                  className="reveal"
                  style={{ "--reveal-delay": `${0.12 + index * 0.16}s` } as CSSProperties}
                >
                  <benefit.icon size={27} weight="duotone" aria-hidden="true" />
                  <h3>{benefit.title}</h3>
                  <p>{benefit.text}</p>
                </Benefit>
              ))}
            </Benefits>
          </Copy>
        </Reveal>

        <Reveal delay={0.18}>
          <Media>
            <EyewearDock data-eyewear-drop-target aria-label="Óculos Mirage em destaque para vitrine de loja">
              <EyewearImage
                src={heroEyewear}
              alt="Óculos Mirage expostos em vitrine minimalista de loja"
                width={1689}
                height={931}
                loading="lazy"
                decoding="async"
                draggable="false"
              />
            </EyewearDock>
            <MediaLabel>
              <div>
                <span>Disponível para consignação</span>
                <strong>Seleção comercial para sua vitrine.</strong>
              </div>
              <Cta href={whatsAppHref} target="_blank" rel="noopener noreferrer">
                Consultar
                <ArrowUpRight size={16} weight="bold" />
              </Cta>
            </MediaLabel>
          </Media>
        </Reveal>
      </Inner>
    </Section>
  );
}
