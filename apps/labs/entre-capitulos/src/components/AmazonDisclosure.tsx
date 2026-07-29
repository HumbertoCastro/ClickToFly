import { Info } from "lucide-react";

export interface AmazonDisclosureProps {
  compact?: boolean;
  className?: string;
}

export function AmazonDisclosure({
  compact = false,
  className = "",
}: AmazonDisclosureProps) {
  const classes = [
    "amazon-disclosure",
    compact ? "amazon-disclosure--compact" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <aside className={classes} aria-label="Informações sobre preços e afiliados">
      <Info size={compact ? 15 : 17} aria-hidden="true" />
      <div>
        <span className="amazon-disclosure__label">Publicidade</span>
        <strong>Como associado da Amazon, eu ganho com compras qualificadas.</strong>
        {!compact && (
          <p>
            Preços e disponibilidade são informados pela Amazon.com.br e podem
            mudar a qualquer momento. A condição válida é sempre a exibida na
            Amazon ao concluir a compra.
          </p>
        )}
      </div>
    </aside>
  );
}
