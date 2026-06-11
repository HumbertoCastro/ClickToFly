import type { CSSProperties } from "react";
import styled from "styled-components";
import { layout, palette, radii } from "../theme";
import { BrandMark } from "./BrandMark";
import { Reveal } from "./Reveal";

const Section = styled.section`
  padding: clamp(70px, 10vw, 126px) 0;
  background:
    linear-gradient(135deg, ${palette.navyDeep} 0%, ${palette.navy} 66%, #0b2b72 100%);
  color: ${palette.paper};
  scroll-margin-top: 82px;
`;

const Inner = styled.div`
  width: min(100% - 32px, ${layout.max});
  margin: 0 auto;
  display: grid;
  grid-template-columns: minmax(0, 0.72fr) minmax(0, 1fr);
  gap: clamp(36px, 7vw, 92px);
  align-items: center;

  @media (max-width: 820px) {
    grid-template-columns: 1fr;
  }
`;

const BrandPanel = styled.div`
  min-height: 330px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: ${radii.lg};
  background:
    linear-gradient(180deg, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0.02)),
    rgba(255, 255, 255, 0.035);
  padding: 30px;
`;

const Copy = styled.div`
  h2 {
    margin: 0;
    color: ${palette.paper};
    font-family: "Archivo", ui-sans-serif, system-ui, sans-serif;
    font-size: clamp(3rem, 6vw, 6.2rem);
    font-weight: 800;
    letter-spacing: -0.04em;
    line-height: 0.94;
  }

  p {
    max-width: 650px;
    margin: 24px 0 0;
    color: rgba(255, 255, 255, 0.76);
    font-size: clamp(1.15rem, 2vw, 1.48rem);
    line-height: 1.5;
  }
`;

const Facts = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
  margin-top: 34px;

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`;

const Fact = styled.div`
  border-top: 1px solid rgba(255, 255, 255, 0.2);
  padding-top: 15px;

  strong {
    display: block;
    color: ${palette.goldSoft};
    font-size: 1.1rem;
  }

  span {
    display: block;
    margin-top: 4px;
    color: rgba(255, 255, 255, 0.66);
    font-size: 0.9rem;
    line-height: 1.35;
  }
`;

export function AboutSection() {
  return (
    <Section id="sobre" aria-labelledby="about-title">
      <Inner>
        <Reveal>
          <BrandPanel>
            <BrandMark dark />
          </BrandPanel>
        </Reveal>
        <Reveal delay={0.18}>
          <Copy>
            <h2 id="about-title">Quem somos</h2>
            <p>
              A Mirage é uma empresa de óculos solares com mais de 25 anos de mercado,
              dedicada a produtos exclusivos, alta qualidade e atendimento comercial próximo.
            </p>
            <Facts>
              <Fact className="reveal" style={{ "--reveal-delay": "0.12s" } as CSSProperties}>
                <strong>1994</strong>
                <span>Origem da marca no segmento de eyewear.</span>
              </Fact>
              <Fact className="reveal" style={{ "--reveal-delay": "0.28s" } as CSSProperties}>
                <strong>Brasil</strong>
                <span>Representantes para atendimento regional.</span>
              </Fact>
              <Fact className="reveal" style={{ "--reveal-delay": "0.44s" } as CSSProperties}>
                <strong>Parceiras</strong>
                <span>Summerfix Eyewear e Bask Eyewear.</span>
              </Fact>
            </Facts>
          </Copy>
        </Reveal>
      </Inner>
    </Section>
  );
}
