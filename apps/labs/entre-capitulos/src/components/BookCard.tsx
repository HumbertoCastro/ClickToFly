import { ArrowUpRight } from "lucide-react";
import { Link } from "react-router-dom";
import type { JoinedEntry } from "../types";
import { BookMockup } from "./BookMockup";
import { ProfileAvatar } from "./ProfileAvatar";
import { RatingDisplay } from "./RatingDisplay";
import { StatusBadge } from "./StatusBadge";

export function BookCard({
  item,
  showProfile = false,
}: {
  item: JoinedEntry;
  showProfile?: boolean;
}) {
  return (
    <article className="book-card">
      <Link className="book-card__cover-link" to={`/books/${item.entry.id}`}>
        <BookMockup book={item.book} />
        <span className="book-card__open" aria-hidden="true">
          <ArrowUpRight size={18} />
        </span>
      </Link>
      <div className="book-card__body">
        <div className="book-card__meta-row">
          <StatusBadge status={item.entry.status} />
          <RatingDisplay value={item.averageRating} compact />
        </div>
        <Link className="book-card__title" to={`/books/${item.entry.id}`}>
          {item.book.title}
        </Link>
        <p className="book-card__author">{item.book.authors.join(", ")}</p>
        {showProfile && (
          <div className="profile-byline">
            <ProfileAvatar
              profile={item.profile}
              className="profile-byline__avatar"
              decorative
            />
            Na estante de {item.profile.name}
          </div>
        )}
      </div>
    </article>
  );
}
