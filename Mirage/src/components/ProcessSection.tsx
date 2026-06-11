import type { CSSProperties } from "react";
import styled from "styled-components";
import { processSteps } from "../data";
import { layout, palette, radii } from "../theme";
import { Reveal } from "./Reveal";

const Section = styled.section`
  padding: clamp(74px, 10vw, 128px) 0;
  background: ${palette.porcelain};
  scroll-margin-top: 82px;
`;

const Inner = styled.div`
  width: min(100% - 32px, ${layout.max});
  margin: 0 auto;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  gap: 28px;
  align-items: end;
  margin-bottom: clamp(30px, 5vw, 54px);

  h2 {
    max-width: 620px;
    margin: 0;
    color: ${palette.ink};
    font-size: clamp(2.4rem, 5vw, 5.3rem);
    font-weight: 800;
    letter-spacing: -0.035em;
    line-height: 0.94;
  }

  p {
    max-width: 360px;
    margin: 0;
    color: ${palette.muted};
    line-height: 1.58;
  }

  @media (max-width: 780px) {
    display: grid;
  }
`;

const Steps = styled.div`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  border: 1px solid ${palette.line};
  border-radius: ${radii.lg};
  overflow: hidden;
  background: ${palette.paper};

  @media (max-width: 920px) {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 560px) {
    grid-template-columns: 1fr;
  }
`;

const Step = styled.article`
  min-height: 300px;
  display: grid;
  align-content: space-between;
  border-right: 1px solid ${palette.line};
  padding: 24px;

  &:last-child {
    border-right: 0;
  }

  @media (max-width: 920px) {
    border-bottom: 1px solid ${palette.line};

    &:nth-child(2n) {
      border-right: 0;
    }

    &:nth-last-child(-n + 2) {
      border-bottom: 0;
    }
  }

  @media (max-width: 560px) {
    min-height: 240px;
    border-right: 0;

    &:nth-last-child(-n + 2) {
      border-bottom: 1px solid ${palette.line};
    }

    &:last-child {
      border-bottom: 0;
    }
  }
`;

const Number = styled.span`
  color: ${palette.gold};
  font-family: "Archivo", ui-sans-serif, system-ui, sans-serif;
  font-size: 3.2rem;
  font-weight: 800;
  line-height: 0.8;
`;

const StepBody = styled.div`
  svg {
    color: ${palette.navy};
    margin-bottom: 20px;
  }

  h3 {
    margin: 0;
    color: ${palette.ink};
    font-size: 1.18rem;
    letter-spacing: -0.02em;
    line-height: 1.08;
  }

  p {
    margin: 12px 0 0;
    color: ${palette.muted};
    font-size: 0.94rem;
    line-height: 1.5;
  }
`;

export function ProcessSection() {
  return (
    <Section id="como-funciona" aria-labelledby="process-title">
      <Inner>
        <Reveal>
          <Header>
            <h2 id="process-title">Do primeiro contato à reposição.</h2>
            <p>
              Um fluxo direto para conversar com a Mirage, entender condições e montar uma
              seleção de óculos para a sua loja.
            </p>
          </Header>
        </Reveal>

        <Steps>
          {processSteps.map((step, index) => (
            <Step
              key={step.title}
              className="reveal"
              style={{ "--reveal-delay": `${0.12 + index * 0.16}s` } as CSSProperties}
            >
              <Number>{String(index + 1).padStart(2, "0")}</Number>
              <StepBody>
                <step.icon size={30} weight="duotone" aria-hidden="true" />
                <h3>{step.title}</h3>
                <p>{step.text}</p>
              </StepBody>
            </Step>
          ))}
        </Steps>
      </Inner>
    </Section>
  );
}
