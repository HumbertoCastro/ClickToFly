import { ArrowUpRight, PhoneCall } from "@phosphor-icons/react";
import type { CSSProperties } from "react";
import styled from "styled-components";
import ctaImage from "../assets/mirage-cta-vitrine-display.jpg";
import { whatsAppHref } from "../data";
import { layout, palette, radii, shadows } from "../theme";
import { Reveal } from "./Reveal";

const Section = styled.section`
  padding: clamp(66px, 9vw, 116px) 0;
  background: ${palette.paper};
`;

const Panel = styled.div`
  width: min(100% - 32px, ${layout.max});
  min-height: 520px;
  margin: 0 auto;
  display: grid;
  align-items: center;
  border-radius: ${radii.lg};
  overflow: hidden;
  background:
    linear-gradient(90deg, rgba(2, 7, 37, 0.97) 0%, rgba(6, 16, 68, 0.9) 38%, oklch(0.29 0.07 214 / 0.56) 70%, rgba(2, 7, 37, 0.22) 100%),
    url(${ctaImage}) center / cover no-repeat;
  color: ${palette.paper};
  box-shadow: ${shadows.navy};

  @media (max-width: 680px) {
    min-height: 620px;
    background:
      linear-gradient(180deg, rgba(2, 7, 37, 0.98) 0%, rgba(2, 7, 37, 0.84) 55%, rgba(2, 7, 37, 0.34) 100%),
      url(${ctaImage}) 68% bottom / cover no-repeat;
  }
`;

const Content = styled.div`
  width: min(100% - 34px, 620px);
  padding: clamp(30px, 5vw, 64px);

  h2 {
    margin: 0;
    font-size: clamp(2.7rem, 6vw, 6rem);
    font-weight: 800;
    letter-spacing: -0.035em;
    line-height: 0.9;
  }

  p {
    max-width: 520px;
    margin: 24px 0 0;
    color: rgba(255, 255, 255, 0.76);
    font-size: 1.05rem;
    line-height: 1.58;
  }
`;

const Actions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  margin-top: 30px;
`;

const CtaButton = styled.a`
  display: inline-flex;
  min-height: 56px;
  align-items: center;
  justify-content: center;
  gap: 10px;
  border-radius: ${radii.pill};
  background: ${palette.paper};
  color: ${palette.navy};
  font-size: 0.98rem;
  font-weight: 900;
  padding: 0 24px;
  text-decoration: none;
  transition:
    transform 180ms ease,
    background 180ms ease;

  &:hover,
  &:focus-visible {
    background: linear-gradient(135deg, ${palette.goldSoft}, ${palette.champagne});
    transform: translateY(-2px);
    outline: none;
  }

  &:focus-visible {
    box-shadow: 0 0 0 4px rgba(239, 216, 159, 0.26);
  }
`;

const Phone = styled.a`
  display: inline-flex;
  min-height: 56px;
  align-items: center;
  gap: 10px;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: ${radii.pill};
  color: ${palette.paper};
  font-size: 0.98rem;
  font-weight: 800;
  padding: 0 20px;
  text-decoration: none;

  &:hover,
  &:focus-visible {
    border-color: rgba(255, 255, 255, 0.42);
    background: oklch(1 0 0 / 0.06);
    outline: none;
  }

  &:focus-visible {
    box-shadow: 0 0 0 4px rgba(239, 216, 159, 0.2);
  }
`;

export function FinalCtaSection() {
  return (
    <Section aria-labelledby="final-cta-title">
      <Panel>
        <Reveal>
          <Content>
            <h2 id="final-cta-title">Vamos montar sua vitrine Mirage?</h2>
            <p>
              Fale com a equipe comercial e receba orientação sobre consignação, modelos
              disponíveis e atendimento por representante.
            </p>
            <Actions className="reveal" style={{ "--reveal-delay": "0.22s" } as CSSProperties}>
              <CtaButton href={whatsAppHref} target="_blank" rel="noopener noreferrer">
                Chamar no WhatsApp
                <ArrowUpRight size={18} weight="bold" />
              </CtaButton>
              <Phone href="tel:+5531971140018">
                <PhoneCall size={18} weight="bold" />
                (31) 97114-0018
              </Phone>
            </Actions>
          </Content>
        </Reveal>
      </Panel>
    </Section>
  );
}
