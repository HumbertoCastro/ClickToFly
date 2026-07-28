import { useState } from "react";
import type { Book } from "../types";

interface BookCoverProps {
  book: Book | Omit<Book, "id" | "createdAt">;
  size?: "small" | "medium" | "large";
}

export function BookCover({ book, size = "medium" }: BookCoverProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const titleInitial = book.title.trim().charAt(0).toUpperCase() || "L";

  return (
    <div className={`book-cover book-cover--${size}`}>
      {book.coverUrl && !imageFailed ? (
        <img
          src={book.coverUrl}
          alt={`Capa de ${book.title}`}
          loading="lazy"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <div className="book-cover__fallback" aria-label={`Capa de ${book.title}`}>
          <span className="book-cover__chapter">ENTRE CAPÍTULOS</span>
          <span className="book-cover__initial" aria-hidden="true">
            {titleInitial}
          </span>
          <span className="book-cover__title">{book.title}</span>
          <span className="book-cover__author">{book.authors[0]}</span>
        </div>
      )}
    </div>
  );
}
