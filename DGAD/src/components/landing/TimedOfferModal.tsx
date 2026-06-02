import { useEffect, useRef, useState } from "react";
import { ArrowRight, ShieldCheck, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { mediaAssets, offer } from "@/data/site";

type TimedOfferModalProps = {
  enabled?: boolean;
};

export function TimedOfferModal({ enabled = true }: TimedOfferModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [wasDismissed, setWasDismissed] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!enabled || wasDismissed) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setIsOpen(true);
    }, 6000);

    return () => window.clearTimeout(timer);
  }, [enabled, wasDismissed]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setWasDismissed(true);
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  if (!enabled || !isOpen) {
    return null;
  }

  const closeModal = () => {
    setWasDismissed(true);
    setIsOpen(false);
  };

  return (
    <div className="timed-offer-modal" role="presentation" onMouseDown={closeModal}>
      <section
        className="timed-offer-modal__panel"
        role="dialog"
        aria-modal="true"
        aria-labelledby="timed-offer-title"
        aria-describedby="timed-offer-description"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <button
          ref={closeButtonRef}
          type="button"
          className="timed-offer-modal__close"
          aria-label="Fechar oferta"
          onClick={closeModal}
        >
          <X aria-hidden="true" />
        </button>

        <div className="timed-offer-modal__media" aria-hidden="true">
          <img src={mediaAssets.productBundle} alt="" />
        </div>

        <div className="timed-offer-modal__content">
          <p className="section-kicker">Promoção única</p>
          <h2 id="timed-offer-title">Pacote completo DGAD por tempo limitado.</h2>
          <p id="timed-offer-description">
            Acesse agora os 7 e-books do LifeForce 360º com pagamento seguro pela Hotmart e liberação imediata.
          </p>

          <div className="timed-offer-modal__price" aria-label={`Preço promocional ${offer.price}`}>
            <span>{offer.originalPrice}</span>
            <strong>{offer.price}</strong>
            <small>{offer.guarantee}</small>
          </div>

          <Button asChild size="lg" className="cta-button h-12 px-5 active:scale-[0.96]">
            <a href={offer.checkoutUrl} target="_blank" rel="noreferrer">
              <ShieldCheck data-icon="inline-start" />
              Comprar na Hotmart
              <ArrowRight data-icon="inline-end" />
            </a>
          </Button>
        </div>
      </section>
    </div>
  );
}
