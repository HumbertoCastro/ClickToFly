import { useMemo, useState } from "react";
import {
  BadgeCheck,
  BadgePercent,
  Clock3,
  ExternalLink,
  PackageCheck,
  Store,
} from "lucide-react";
import type {
  AmazonBookFormat,
  AmazonCatalogItem,
  AmazonCurrentOffer,
} from "../amazonTypes";
import { isAmazonUrl } from "../lib/amazonCatalog";
import { useAmazonExpiryClock } from "../lib/useAmazonExpiryClock";
import { AmazonDisclosure } from "./AmazonDisclosure";

interface OfferEditionView {
  asin: string;
  format: AmazonBookFormat;
  label: string;
  detailPageUrl: string;
  offer?: AmazonCurrentOffer | null;
}

export interface AmazonOfferPanelProps {
  item: AmazonCatalogItem;
  defaultAsin?: string;
  compact?: boolean;
  className?: string;
}

function isFreshOffer(
  offer: AmazonCurrentOffer | null | undefined,
  now: number = Date.now(),
): offer is AmazonCurrentOffer {
  if (!offer?.expiresAt) return false;
  const expiration = new Date(offer.expiresAt).getTime();
  return Number.isFinite(expiration) && expiration > now;
}

function formatTimestamp(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "agora";
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function availabilityLabel(value: string): string {
  const labels: Record<string, string> = {
    IN_STOCK: "Em estoque",
    LIMITED_AVAILABILITY: "Estoque limitado",
    OUT_OF_STOCK: "Fora de estoque",
    UNAVAILABLE: "Indisponível",
  };
  return labels[value.toUpperCase()] ?? value;
}

export function AmazonOfferPanel({
  item,
  defaultAsin,
  compact = false,
  className = "",
}: AmazonOfferPanelProps) {
  const editions = useMemo<OfferEditionView[]>(() => {
    if (item.editions.length > 0) {
      return item.editions.map((edition) => ({
        asin: edition.asin,
        format: edition.format,
        label: edition.label,
        detailPageUrl: edition.detailPageUrl,
        offer: edition.offer,
      }));
    }

    return [
      {
        asin: item.asin,
        format: "unknown",
        label: "Edição disponível",
        detailPageUrl: item.detailPageUrl,
        offer: item.offer,
      },
    ];
  }, [item]);
  const initialAsin =
    editions.find((edition) => edition.asin === defaultAsin)?.asin ??
    editions.find((edition) => isFreshOffer(edition.offer))?.asin ??
    editions[0]?.asin ??
    item.asin;
  const [selectedAsin, setSelectedAsin] = useState(initialAsin);
  const effectiveSelectedAsin = editions.some(
    (edition) => edition.asin === selectedAsin,
  )
    ? selectedAsin
    : initialAsin;

  const selectedEdition =
    editions.find((edition) => edition.asin === effectiveSelectedAsin) ??
    editions[0];
  const candidateOffer =
    selectedEdition?.offer ??
    (effectiveSelectedAsin === item.asin ? item.offer : null);
  const freshnessNow = useAmazonExpiryClock([candidateOffer?.expiresAt]);
  const offer = isFreshOffer(candidateOffer, freshnessNow)
    ? candidateOffer
    : null;
  const detailPageUrl =
    selectedEdition?.detailPageUrl || item.detailPageUrl || "";
  const hasAmazonLink = isAmazonUrl(detailPageUrl);
  const classes = [
    "amazon-offer-panel",
    compact ? "amazon-offer-panel--compact" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <aside className={classes} aria-label={`Comprar ${item.title} na Amazon`}>
      <div className="amazon-offer-panel__heading">
        <div>
          <p className="eyebrow">COMPRA NA AMAZON</p>
          <h2>Escolha sua edição</h2>
        </div>
        <span className="amazon-offer-panel__seal" aria-hidden="true">
          amazon.com.br
        </span>
      </div>

      {editions.length > 1 && (
        <div
          className="amazon-offer-panel__editions"
          role="group"
          aria-label="Edições disponíveis"
        >
          {editions.map((edition) => (
            <button
              key={edition.asin}
              className={
                edition.asin === effectiveSelectedAsin ? "is-active" : ""
              }
              type="button"
              onClick={() => setSelectedAsin(edition.asin)}
              aria-pressed={edition.asin === effectiveSelectedAsin}
            >
              {edition.label}
            </button>
          ))}
        </div>
      )}

      <div className="amazon-offer-panel__price">
        <small>{offer ? "Preço atual" : "Preço na Amazon"}</small>
        <strong>{offer?.displayPrice ?? "Consulte o preço na Amazon"}</strong>
        {offer?.savingsPercentage ? (
          <span>
            <BadgePercent size={16} aria-hidden="true" />
            Economia de {Math.round(offer.savingsPercentage)}%
            {offer.savingsAmount
              ? ` (${new Intl.NumberFormat("pt-BR", {
                  style: "currency",
                  currency: offer.currency || "BRL",
                }).format(offer.savingsAmount)})`
              : ""}
          </span>
        ) : null}
      </div>

      {offer && (
        <dl className="amazon-offer-panel__facts">
          {offer.availability && (
            <div>
              <dt>
                <PackageCheck size={16} aria-hidden="true" />
                Disponibilidade
              </dt>
              <dd>{availabilityLabel(offer.availability)}</dd>
            </div>
          )}
          {offer.seller && (
            <div>
              <dt>
                <Store size={16} aria-hidden="true" />
                Vendido por
              </dt>
              <dd>{offer.seller}</dd>
            </div>
          )}
          {offer.isPrime && (
            <div>
              <dt>
                <BadgeCheck size={16} aria-hidden="true" />
                Benefício
              </dt>
              <dd>Oferta elegível ao Amazon Prime</dd>
            </div>
          )}
          {offer.promotion && (
            <div>
              <dt>
                <BadgePercent size={16} aria-hidden="true" />
                Promoção vigente
              </dt>
              <dd>{offer.promotion}</dd>
            </div>
          )}
        </dl>
      )}

      {hasAmazonLink ? (
        <a
          className="button button--primary button--large button--wide amazon-offer-panel__cta"
          href={detailPageUrl}
          target="_blank"
          rel="sponsored nofollow noopener noreferrer"
        >
          Ver oferta na Amazon
          <span className="sr-only"> (abre em nova aba)</span>
          <ExternalLink size={17} aria-hidden="true" />
        </a>
      ) : (
        <span
          className="button button--primary button--large button--wide amazon-offer-panel__cta is-disabled"
          aria-disabled="true"
        >
          Link indisponível
        </span>
      )}

      <p className="amazon-offer-panel__checkout">
        Você será direcionado à Amazon para finalizar pagamento, entrega e
        atendimento.
      </p>

      {offer && (
        <p className="amazon-offer-panel__updated">
          <Clock3 size={14} aria-hidden="true" />
          Consultado em {formatTimestamp(offer.fetchedAt)}
        </p>
      )}

      <AmazonDisclosure compact />
    </aside>
  );
}
