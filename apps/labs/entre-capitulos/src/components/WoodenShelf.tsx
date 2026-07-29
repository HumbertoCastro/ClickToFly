import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { useNavigate } from "react-router-dom";
import { loadBookDetailPage } from "../lib/routeLoaders";
import { groupShelfEntries } from "../lib/shelf";
import type { JoinedEntry } from "../types";
import { ShelfBook } from "./ShelfBook";

const BOOK_OPEN_DURATION_MS = 560;

function prefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function WoodenShelf({ entries }: { entries: JoinedEntry[] }) {
  const navigate = useNavigate();
  const modules = useMemo(() => groupShelfEntries(entries), [entries]);
  const [openingEntryId, setOpeningEntryId] = useState<string | null>(null);
  const openingEntryRef = useRef<string | null>(null);
  const animationTimerRef = useRef<number | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;

    return () => {
      mountedRef.current = false;
      if (animationTimerRef.current !== null) {
        window.clearTimeout(animationTimerRef.current);
      }
    };
  }, []);

  const preloadDetails = useCallback(() => {
    void loadBookDetailPage().catch(() => undefined);
  }, []);

  const commitNavigation = useCallback(
    (entryId: string) => {
      const updateRoute = () => {
        flushSync(() => {
          navigate(`/books/${entryId}`, {
            state: { shelfTransitionEntryId: entryId },
          });
        });
        window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      };

      if (
        !prefersReducedMotion() &&
        typeof document.startViewTransition === "function"
      ) {
        document.startViewTransition(updateRoute);
        return;
      }

      updateRoute();
    },
    [navigate],
  );

  const openBook = useCallback(
    async (item: JoinedEntry) => {
      const entryId = item.entry.id;
      if (openingEntryRef.current) return;

      if (prefersReducedMotion()) {
        preloadDetails();
        commitNavigation(entryId);
        return;
      }

      openingEntryRef.current = entryId;
      setOpeningEntryId(entryId);

      await Promise.all([
        loadBookDetailPage().catch(() => undefined),
        new Promise<void>((resolve) => {
          animationTimerRef.current = window.setTimeout(
            resolve,
            BOOK_OPEN_DURATION_MS,
          );
        }),
      ]);

      if (!mountedRef.current) return;
      commitNavigation(entryId);
    },
    [commitNavigation, preloadDetails],
  );

  return (
    <div
      className={`wooden-shelf-stack${openingEntryId ? " wooden-shelf-stack--opening" : ""}`}
      data-testid="wooden-shelf-stack"
    >
      {modules.map((moduleEntries, moduleIndex) => (
        <section
          className="wooden-shelf"
          aria-label={`Módulo ${moduleIndex + 1} da estante`}
          data-testid="wooden-shelf-module"
          key={moduleEntries[0].entry.id}
        >
          <div className="wooden-shelf__inner">
            <div className="wooden-shelf__books">
              {moduleEntries.map((item, index) => (
                <ShelfBook
                  item={item}
                  index={index}
                  key={item.entry.id}
                  opening={openingEntryId === item.entry.id}
                  onOpen={openBook}
                  onPreload={preloadDetails}
                />
              ))}
            </div>
          </div>
        </section>
      ))}
    </div>
  );
}
