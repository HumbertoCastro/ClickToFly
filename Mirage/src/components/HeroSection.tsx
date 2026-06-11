import { ArrowUpRight } from "@phosphor-icons/react";
import type { CSSProperties } from "react";
import styled, { keyframes } from "styled-components";
import heroEyewear from "../assets/mirage-hero-2-5d-translucent.png";
import { whatsAppHref } from "../data";
import { palette, radii, shadows } from "../theme";

const titleArrival = keyframes`
  from {
    opacity: 0.78;
    transform: translate(-50%, -50%) translateY(18px);
  }

  to {
    opacity: 1;
    transform: translate(-50%, -50%) translateY(0);
  }
`;

const eyewearArrival = keyframes`
  from {
    opacity: 0.9;
    transform: translateY(34px) scale(0.965);
    filter: drop-shadow(0 16px 18px rgba(6, 16, 68, 0.12));
  }

  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
`;

const copyArrival = keyframes`
  from {
    opacity: 0.82;
    transform: translateX(-50%) translateY(16px);
  }

  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
`;

const Hero = styled.section`
  position: relative;
  isolation: isolate;
  min-height: min(880px, calc(100svh - 42px));
  overflow: hidden;
  display: grid;
  align-items: center;
  padding: 78px 0 clamp(24px, 4vw, 42px);
  background:
    linear-gradient(140deg, ${palette.paper} 0%, ${palette.paper} 34%, ${palette.champagneSoft} 52%, ${palette.coolMist} 100%),
    linear-gradient(180deg, ${palette.paper}, ${palette.paper});
  scroll-margin-top: 82px;

  &::before {
    content: "";
    position: absolute;
    inset: 74px 0 auto;
    height: 1px;
    background: linear-gradient(90deg, transparent, ${palette.champagne}, transparent);
    opacity: 0.75;
    pointer-events: none;
  }

  @media (max-width: 720px) {
    min-height: min(820px, calc(100svh - 34px));
    padding: 72px 0 18px;
  }
`;

const HeroInner = styled.div`
  width: min(100% - 28px, 1280px);
  margin: 0 auto;
`;

const Stage = styled.div`
  position: relative;
  display: grid;
  min-height: clamp(600px, 72svh, 740px);
  place-items: center;
  padding: 0;

  @media (max-width: 720px) {
    min-height: clamp(650px, 78svh, 740px);
  }
`;

const BackdropTitle = styled.h1`
  position: absolute;
  z-index: 1;
  inset: 44% auto auto 50%;
  width: min(calc(100vw - 32px), 1280px);
  margin: 0;
  transform: translate(-50%, -50%);
  color: ${palette.navy};
  text-align: center;
  text-transform: uppercase;
  pointer-events: none;
  animation: ${titleArrival} 760ms cubic-bezier(0.16, 1, 0.3, 1) both;

  @media (max-width: 720px) {
    top: 35%;
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const SmallLine = styled.span`
  position: relative;
  display: block;
  margin-bottom: clamp(-20px, -1.6vw, -10px);
  transform: translateY(clamp(-54px, -4.4vw, -30px));
  color: ${palette.ink};
  font-size: clamp(0.88rem, 1.65vw, 1.18rem);
  font-weight: 900;
  letter-spacing: 0.18em;

  @media (max-width: 720px) {
    margin-bottom: -6px;
    transform: translateY(-24px);
  }

  @media (max-width: 520px) {
    transform: translateY(-18px);
  }
`;

const BigLine = styled.span`
  display: block;
  max-width: 100%;
  font-family: "Archivo", ui-sans-serif, system-ui, sans-serif;
  font-size: clamp(4rem, 13vw, 11.8rem);
  font-weight: 900;
  letter-spacing: -0.035em;
  line-height: 0.82;
  text-wrap: nowrap;

  &:last-child {
    font-size: clamp(3.8rem, 11.2vw, 9.6rem);
    font-weight: 800;
    text-transform: none;
  }

  @media (max-width: 620px) {
    font-size: clamp(2.08rem, 8.8vw, 2.76rem);
    line-height: 0.9;

    &:last-child {
      font-size: clamp(2.08rem, 8.7vw, 2.7rem);
    }
  }
`;

const EyewearLayer = styled.div`
  position: relative;
  z-index: 3;
  width: min(920px, 82vw);
  margin-top: clamp(-42px, -4vw, -18px);
  justify-self: center;
  filter: drop-shadow(0 40px 42px rgba(6, 16, 68, 0.22))
    drop-shadow(0 10px 12px rgba(182, 144, 74, 0.12));
  pointer-events: none;
  animation: ${eyewearArrival} 820ms cubic-bezier(0.16, 1, 0.3, 1) 90ms both;
  transition: opacity 160ms ease;
  will-change: transform;

  body[data-eyewear-bridge-active="true"] & {
    animation: none;
    opacity: 0;
  }

  @media (max-width: 720px) {
    width: min(460px, 96vw);
    margin-top: -52px;
    transform: translateX(0);
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
    transform: none;
  }
`;

const EyewearImage = styled.img`
  display: block;
  width: 100%;
  height: auto;
`;

const Copy = styled.div`
  position: absolute;
  z-index: 4;
  inset: auto auto clamp(10px, 2vw, 24px) 50%;
  width: min(100%, 640px);
  transform: translateX(-50%);
  display: grid;
  justify-items: center;
  text-align: center;
  animation: ${copyArrival} 620ms cubic-bezier(0.16, 1, 0.3, 1) 220ms both;

  @media (max-width: 720px) {
    bottom: 12px;
    left: 0;
    right: auto;
    width: 100%;
    padding: 0 4px;
    transform: none;
    animation: none;
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

const Text = styled.p`
  width: min(100%, 58ch);
  max-width: 590px;
  margin: 0;
  color: ${palette.muted};
  font-size: clamp(1rem, 1.55vw, 1.13rem);
  font-weight: 600;
  line-height: 1.48;

  @media (max-width: 520px) {
    width: min(100%, 31ch);
    font-size: 1rem;
  }
`;

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 12px;
  margin-top: 20px;

  @media (max-width: 520px) {
    width: 100%;
    display: grid;
  }
`;

const PrimaryButton = styled.a`
  display: inline-flex;
  min-height: 54px;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border: 1px solid ${palette.navy};
  border-radius: ${radii.pill};
  background: ${palette.navy};
  color: ${palette.paper};
  font-size: 0.96rem;
  font-weight: 900;
  padding: 0 24px;
  text-decoration: none;
  box-shadow: ${shadows.soft};
  transition:
    transform 180ms ease,
    background 180ms ease,
    box-shadow 180ms ease;

  &:hover,
  &:focus-visible {
    background: linear-gradient(135deg, ${palette.navyDeep}, ${palette.tealDeep});
    transform: translateY(-2px) scale(1.015);
    box-shadow: 0 8px 14px rgba(6, 16, 68, 0.16);
    outline: none;
  }

  &:active {
    transform: translateY(0) scale(0.985);
  }

  &:focus-visible {
    box-shadow: 0 8px 14px rgba(6, 16, 68, 0.16), 0 0 0 4px rgba(143, 104, 31, 0.24);
  }

  svg {
    flex: 0 0 auto;
  }

  @media (max-width: 520px) {
    width: 100%;
  }
`;

const SecondaryButton = styled.a`
  display: inline-flex;
  min-height: 54px;
  align-items: center;
  justify-content: center;
  border: 1px solid ${palette.lineStrong};
  border-radius: ${radii.pill};
  background: ${palette.paper};
  color: ${palette.navy};
  font-size: 0.96rem;
  font-weight: 900;
  padding: 0 22px;
  text-decoration: none;
  transition:
    border-color 180ms ease,
    background 180ms ease,
    transform 180ms ease;

  &:hover,
  &:focus-visible {
    border-color: ${palette.gold};
    background: ${palette.champagneSoft};
    transform: translateY(-2px);
    outline: none;
  }

  &:active {
    transform: translateY(0) scale(0.985);
  }

  &:focus-visible {
    box-shadow: 0 0 0 4px rgba(143, 104, 31, 0.22);
  }

  @media (max-width: 520px) {
    width: 100%;
  }
`;

export function HeroSection() {
  return (
    <Hero id="inicio" aria-labelledby="hero-title">
      <HeroInner>
        <Stage>
          <BackdropTitle id="hero-title">
            <SmallLine>Peças que</SmallLine>
            <BigLine>valorizam</BigLine>
            <BigLine>sua vitrine</BigLine>
          </BackdropTitle>

          <EyewearLayer data-eyewear-start aria-hidden="true">
            <EyewearImage
              src={heroEyewear}
              alt=""
              width={1689}
              height={931}
              loading="eager"
              decoding="async"
              draggable="false"
            />
          </EyewearLayer>

          <Copy>
            <Text className="reveal" style={{ "--reveal-delay": "0.2s" } as CSSProperties}>
              Desde 1994, óculos consignados para lojistas e óticas com representantes
              atendendo em todo o Brasil.
            </Text>
            <Actions className="reveal" style={{ "--reveal-delay": "0.38s" } as CSSProperties}>
              <PrimaryButton href={whatsAppHref} target="_blank" rel="noopener noreferrer">
                Falar pelo WhatsApp
                <ArrowUpRight size={18} weight="bold" />
              </PrimaryButton>
              <SecondaryButton href="#consignacao">Ver consignação</SecondaryButton>
            </Actions>
          </Copy>
        </Stage>
      </HeroInner>
    </Hero>
  );
}
