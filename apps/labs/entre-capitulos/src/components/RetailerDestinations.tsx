import { ExternalLink, MapPin, Search, Store } from "lucide-react";
import type { RetailerDestination } from "../catalogTypes";

export interface RetailerDestinationsProps {
  destinations: readonly RetailerDestination[];
  title?: string;
  compact?: boolean;
  className?: string;
}

const retailerDetails: Record<
  RetailerDestination["retailer"],
  { name: string; shortName: string }
> = {
  amazon_br: { name: "Amazon Brasil", shortName: "Amazon" },
  estante_virtual: {
    name: "Estante Virtual",
    shortName: "Estante Virtual",
  },
  mercado_livre: { name: "Mercado Livre", shortName: "Mercado Livre" },
};

const retailerOrder: RetailerDestination["retailer"][] = [
  "amazon_br",
  "estante_virtual",
  "mercado_livre",
];

function isSafeDestination(url: string) {
  try {
    return new URL(url).protocol === "https:";
  } catch {
    return false;
  }
}

export function RetailerDestinations({
  destinations,
  title = "Onde encontrar",
  compact = false,
  className = "",
}: RetailerDestinationsProps) {
  const orderedDestinations = [...destinations]
    .filter((destination) => isSafeDestination(destination.url))
    .sort(
      (left, right) =>
        retailerOrder.indexOf(left.retailer) -
        retailerOrder.indexOf(right.retailer),
    );
  const containsAffiliateLink = orderedDestinations.some(
    (destination) => destination.affiliate,
  );
  const classes = [
    "catalog-retailers",
    compact ? "catalog-retailers--compact" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <aside className={classes} aria-label={title}>
      <header className="catalog-retailers__heading">
        <span className="catalog-retailers__mark" aria-hidden="true">
          <MapPin size={18} />
        </span>
        <div>
          <p>DESTINOS EXTERNOS</p>
          <h2>{title}</h2>
        </div>
      </header>

      {orderedDestinations.length > 0 ? (
        <ul className="catalog-retailers__list">
          {orderedDestinations.map((destination) => {
            const retailer = retailerDetails[destination.retailer];
            const isDirect = destination.kind === "direct";
            const label =
              destination.label ||
              (isDirect ? "Ver esta edição na loja" : "Buscar na loja");

            return (
              <li
                key={`${destination.retailer}-${destination.editionKey ?? "work"}-${destination.url}`}
              >
                <div className="catalog-retailers__store">
                  <span aria-hidden="true">
                    {isDirect ? <Store size={17} /> : <Search size={17} />}
                  </span>
                  <div>
                    <strong>{retailer.name}</strong>
                    <small>
                      {isDirect
                        ? "Link direto cadastrado"
                        : "Busca externa por esta edição"}
                    </small>
                  </div>
                </div>
                <a
                  href={destination.url}
                  target="_blank"
                  rel={
                    destination.affiliate
                      ? "sponsored noopener noreferrer"
                      : "noopener noreferrer"
                  }
                  aria-label={`${label} em ${retailer.shortName} (abre em nova aba)`}
                >
                  {label}
                  <ExternalLink size={15} aria-hidden="true" />
                </a>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="catalog-retailers__empty">
          <Store size={20} aria-hidden="true" />
          <p>
            Ainda não há um destino de compra cadastrado para esta edição.
          </p>
        </div>
      )}

      <p className="catalog-retailers__note">
        Os links abrem a busca ou a página da loja. Preço, estoque, entrega e
        atendimento são definidos pelo site escolhido.
      </p>

      {containsAffiliateLink && (
        <p className="catalog-retailers__affiliate">
          Alguns links são afiliados e podem gerar uma comissão, sem alterar o
          valor da compra.
        </p>
      )}
    </aside>
  );
}
