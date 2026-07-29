import { useId, type CSSProperties, type MouseEvent } from "react";
import { Link } from "react-router-dom";
import type { JoinedEntry } from "../types";
import { BookMockup } from "./BookMockup";
import { RatingDisplay } from "./RatingDisplay";
import { StatusBadge } from "./StatusBadge";

const bookAccentByStatus = {
  want_to_read: "#657b82",
  reading: "#ba7043",
  completed: "#66725e",
  abandoned: "#925f57",
} as const;

interface ShelfBookProps {
  item: JoinedEntry;
  index: number;
  opening: boolean;
  onOpen: (item: JoinedEntry) => void;
  onPreload: () => void;
}

export function ShelfBook({
  item,
  index,
  opening,
  onOpen,
  onPreload,
}: ShelfBookProps) {
  const tooltipId = useId();
  const style = {
    "--shelf-book-accent": bookAccentByStatus[item.entry.status],
    "--shelf-book-order": index,
  } as CSSProperties;

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) {
      return;
    }

    event.preventDefault();
    onOpen(item);
  }

  return (
    <article
      className={`shelf-book${opening ? " shelf-book--opening" : ""}`}
      data-opening={opening || undefined}
      data-testid={`shelf-book-${item.entry.id}`}
      style={style}
    >
      <div className="shelf-book__tooltip" id={tooltipId} role="tooltip">
        <strong>{item.book.title}</strong>
        <div className="shelf-book__tooltip-meta">
          <StatusBadge status={item.entry.status} />
          <RatingDisplay value={item.averageRating} compact />
        </div>
      </div>

      <Link
        className="shelf-book__link"
        to={`/books/${item.entry.id}`}
        aria-label={`Abrir ${item.book.title}`}
        aria-describedby={tooltipId}
        onClick={handleClick}
        onFocus={onPreload}
        onPointerEnter={onPreload}
        onPointerDown={onPreload}
      >
        <div
          className="shelf-book__volume"
          style={
            opening
              ? { viewTransitionName: "active-shelf-book" }
              : undefined
          }
        >
          <BookMockup book={item.book} opening={opening} />
        </div>
      </Link>
    </article>
  );
}
