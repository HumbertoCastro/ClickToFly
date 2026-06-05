import { OfferPanel } from "@/components/OfferPanel";
import { Reveal } from "@/components/Reveal";
import { mediaAssets } from "@/data/site";

export function LandingOfferSection() {
  return (
    <section className="lf-section offer-section" id="oferta" aria-labelledby="offer-title">
      <div className="offer-section__art motion-scale">
        <img src={mediaAssets.productBundle} alt="Capas dos materiais digitais DGΔD LifeForce 360º" />
      </div>
      <Reveal className="offer-section__copy">
        <p className="section-kicker">Oferta oficial</p>
        <h2 id="offer-title">Entre no ecossistema LifeForce 360º hoje.</h2>
        <OfferPanel emphasis="hero" />
      </Reveal>
    </section>
  );
}
