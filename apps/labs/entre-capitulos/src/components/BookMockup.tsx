import {
  useLayoutEffect,
  useRef,
  type CSSProperties,
} from "react";
import type { Book } from "../types";
import { BookCover } from "./BookCover";

type BookLike = Book | Omit<Book, "id" | "createdAt">;

interface BookMockupProps {
  book: BookLike;
  className?: string;
  opening?: boolean;
}

const projection = {
  horizontalScale: 1.038095238,
  topSlope: 0.00317460317,
  verticalScale: 1,
  perspective: 0.0380952381,
} as const;

function projectionMatrix(width: number, height: number) {
  const safeWidth = Math.max(width, 1);
  const topSlope = (height / safeWidth) * projection.topSlope;
  const perspective = projection.perspective / safeWidth;

  return `matrix3d(${projection.horizontalScale}, ${topSlope}, 0, ${perspective}, 0, ${projection.verticalScale}, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)`;
}

export function BookMockup({
  book,
  className = "",
  opening = false,
}: BookMockupProps) {
  const projectionRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const element = projectionRef.current;
    if (!element) return;

    const updateProjection = () => {
      const { width, height } = element.getBoundingClientRect();
      element.style.setProperty(
        "--book-cover-projection",
        projectionMatrix(width, height),
      );
    };

    updateProjection();

    const observer = new ResizeObserver(updateProjection);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const classes = [
    "book-mockup",
    opening ? "book-mockup--opening" : "",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div
      className={classes}
      data-testid="perspective-book-cover"
      style={
        {
          "--book-cover-projection": "none",
        } as CSSProperties
      }
    >
      <div className="book-mockup__shell-viewport" aria-hidden="true">
        <img
          className="book-mockup__shell"
          src={`${import.meta.env.BASE_URL}textures/book-mold.png`}
          alt=""
          draggable={false}
        />
      </div>

      <div className="book-mockup__print-area" ref={projectionRef}>
        <div className="book-mockup__projection">
          <div className="book-mockup__page-plane" aria-hidden="true" />
          <div className="book-mockup__cover-leaf">
            <BookCover book={book} />
          </div>
        </div>
      </div>
    </div>
  );
}
