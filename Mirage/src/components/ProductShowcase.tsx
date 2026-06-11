import styled from "styled-components";
import clientImage from "../assets/mirage-cliente-oculos.jpg";
import ctaImage from "../assets/mirage-cta-navy.jpg";
import { productStories } from "../data";
import { layout, palette, radii } from "../theme";
import { Reveal } from "./Reveal";

const Section = styled.section`
  padding: clamp(74px, 10vw, 128px) 0;
  background:
    linear-gradient(180deg, ${palette.paper} 0%, ${palette.paper} 58%, ${palette.champagneSoft} 100%);
  scroll-margin-top: 82px;
`;

const Inner = styled.div`
  width: min(100% - 32px, ${layout.max});
  margin: 0 auto;
`;

const Header = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(260px, 0.52fr);
  gap: clamp(24px, 5vw, 68px);
  align-items: end;
  margin-bottom: clamp(30px, 5vw, 54px);

  h2 {
    margin: 0;
    color: ${palette.ink};
    font-size: clamp(2.55rem, 5.2vw, 5.7rem);
    font-weight: 800;
    letter-spacing: -0.035em;
    line-height: 0.93;
  }

  p {
    margin: 0;
    color: ${palette.muted};
    font-size: 1rem;
    line-height: 1.62;
  }

  @media (max-width: 760px) {
    grid-template-columns: 1fr;
  }
`;

const ShowcaseGrid = styled.div`
  display: grid;
  grid-template-columns: 1.25fr 0.75fr;
  gap: 14px;

  @media (max-width: 820px) {
    grid-template-columns: 1fr;
  }
`;

const FeatureFrame = styled.figure`
  margin: 0;
  min-height: 560px;
  height: clamp(540px, 48vw, 620px);
  border: 1px solid ${palette.line};
  border-radius: ${radii.lg};
  overflow: hidden;
  background: ${palette.porcelain};

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center 22%;
    display: block;
    transition: transform 560ms cubic-bezier(0.16, 1, 0.3, 1), filter 560ms cubic-bezier(0.16, 1, 0.3, 1);
  }

  &:hover img {
    transform: scale(1.025);
    filter: saturate(1.05);
  }

  @media (max-width: 620px) {
    min-height: 390px;
    height: 390px;

    img {
      height: 100%;
    }
  }
`;

const ProductList = styled.div`
  display: grid;
  gap: 14px;
`;

const ProductCard = styled.article<{ $dark?: boolean }>`
  display: grid;
  min-height: 170px;
  align-content: end;
  border: 1px solid ${(props) => (props.$dark ? "rgba(255, 255, 255, 0.14)" : palette.line)};
  border-radius: ${radii.lg};
  background:
    ${(props) =>
      props.$dark
        ? `linear-gradient(90deg, rgba(2, 7, 37, 0.78), rgba(2, 7, 37, 0.2)), url(${ctaImage}) center / cover`
        : `linear-gradient(135deg, ${palette.champagneSoft}, ${palette.paper})`};
  color: ${(props) => (props.$dark ? palette.paper : palette.ink)};
  padding: clamp(18px, 3vw, 26px);

  span {
    color: ${(props) => (props.$dark ? palette.goldSoft : palette.bronze)};
    font-size: 0.74rem;
    font-weight: 900;
    letter-spacing: 0.14em;
    text-transform: uppercase;
  }

  h3 {
    margin: 11px 0 0;
    font-size: clamp(1.35rem, 2vw, 1.8rem);
    line-height: 1;
    letter-spacing: -0.03em;
  }

  p {
    max-width: 320px;
    margin: 10px 0 0;
    color: ${(props) => (props.$dark ? "rgba(255, 255, 255, 0.72)" : palette.muted)};
    line-height: 1.45;
  }
`;

export function ProductShowcase() {
  return (
    <Section id="vitrine" aria-labelledby="showcase-title">
      <Inner>
        <Reveal>
          <Header>
            <h2 id="showcase-title">Poucos produtos. Presença certa.</h2>
            <p>
              A página não funciona como catálogo. Ela mostra o padrão visual da Mirage e
              conduz o lojista para uma conversa comercial com representante.
            </p>
          </Header>
        </Reveal>

        <ShowcaseGrid>
          <Reveal delay={0.12}>
            <FeatureFrame>
              <img
                src={clientImage}
                alt="Cliente usando óculos de sol Mirage em retrato editorial"
                width={1023}
                height={1537}
                loading="lazy"
                decoding="async"
              />
            </FeatureFrame>
          </Reveal>
          <ProductList>
            {productStories.map((product, index) => (
              <Reveal key={product.name} delay={0.2 + index * 0.16}>
                <ProductCard $dark={index === 1}>
                  <span>Estilo {String(index + 1).padStart(2, "0")}</span>
                  <h3>{product.name}</h3>
                  <p>{product.description}</p>
                </ProductCard>
              </Reveal>
            ))}
          </ProductList>
        </ShowcaseGrid>
      </Inner>
    </Section>
  );
}
