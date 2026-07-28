import { BookHeart, Plus } from "lucide-react";
import { Link } from "react-router-dom";

export function EmptyState({
  title = "Esta página ainda está em branco",
  description = "Todo acervo começa com uma primeira história.",
  action = true,
}: {
  title?: string;
  description?: string;
  action?: boolean;
}) {
  return (
    <div className="empty-state">
      <span className="empty-state__icon">
        <BookHeart size={28} />
      </span>
      <p className="eyebrow">PRIMEIRA PÁGINA</p>
      <h2>{title}</h2>
      <p>{description}</p>
      {action && (
        <Link className="button button--primary" to="/books/new">
          <Plus size={18} />
          Adicionar o primeiro livro
        </Link>
      )}
    </div>
  );
}
