import { useCallback, useMemo } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import type { AmazonCatalogItem } from "../amazonTypes";
import { PublicStoreShell } from "../components/PublicStoreShell";
import {
  useApp,
  type AmazonInterestTarget,
} from "../context/AppContext";
import { isValidAsin } from "../lib/amazonCatalog";
import { BookstorePage } from "../pages/BookstorePage";
import {
  OffersPage,
  type UnlinkedWishlistBook,
  type WishlistAmazonBook,
} from "../pages/OffersPage";
import { StoreBookDetailPage } from "../pages/StoreBookDetailPage";
import type { Book, JoinedEntry } from "../types";

function amazonAsinsForBook(book: Book): string[] {
  const candidates = [
    ...(book.amazonAsins ?? []),
    book.source === "amazon" ? book.sourceId : null,
    book.isbn10,
  ];

  return [
    ...new Set(
      candidates
        .filter((value): value is string => Boolean(value))
        .map((value) => value.trim().toUpperCase())
        .filter(isValidAsin),
    ),
  ];
}

function activeProfileEntries(
  entries: JoinedEntry[],
  profileId: string | null,
): JoinedEntry[] {
  if (!profileId) return [];
  return entries.filter((item) => item.profile.id === profileId);
}

function interestTarget(search: string): AmazonInterestTarget | undefined {
  const params = new URLSearchParams(search);
  const bookId = params.get("linkBookId")?.trim() ?? "";
  const entryId = params.get("linkEntryId")?.trim() ?? "";
  return bookId && entryId ? { bookId, entryId } : undefined;
}

function targetSearch(target: AmazonInterestTarget | undefined): string {
  if (!target) return "";
  return `?${new URLSearchParams({
    linkBookId: target.bookId,
    linkEntryId: target.entryId,
  }).toString()}`;
}

export function StorefrontLayout() {
  const { authenticated, activeProfile, joinedEntries } = useApp();
  const offerCount = activeProfileEntries(
    joinedEntries,
    activeProfile?.id ?? null,
  ).filter((item) => item.entry.status === "want_to_read").length;

  return (
    <PublicStoreShell
      accountHref={
        authenticated ? (activeProfile ? "/" : "/profiles") : "/login"
      }
      accountLabel={
        activeProfile
          ? `Estante de ${activeProfile.name}`
          : authenticated
            ? "Escolher perfil"
            : "Entrar"
      }
      offerCount={offerCount}
    >
      <Outlet />
    </PublicStoreShell>
  );
}

function useWantToRead(target?: AmazonInterestTarget) {
  const {
    authenticated,
    activeProfileId,
    saveAmazonInterest,
  } = useApp();
  const navigate = useNavigate();
  const location = useLocation();

  return useCallback(
    async (item: AmazonCatalogItem) => {
      const returnTo =
        `/livraria/${encodeURIComponent(item.asin)}${targetSearch(target)}`;
      if (!authenticated) {
        navigate(`/login?returnTo=${encodeURIComponent(returnTo)}`);
        return;
      }
      if (!activeProfileId) {
        navigate(`/profiles?returnTo=${encodeURIComponent(returnTo)}`);
        return;
      }

      await saveAmazonInterest(item, target);
      if (`${location.pathname}${location.search}` !== returnTo) {
        navigate(returnTo);
      }
    },
    [
      activeProfileId,
      authenticated,
      location.pathname,
      location.search,
      navigate,
      saveAmazonInterest,
      target,
    ],
  );
}

export function BookstoreRoute() {
  const { activeProfileId, joinedEntries } = useApp();
  const location = useLocation();
  const target = interestTarget(location.search);
  const onWantToRead = useWantToRead(target);
  const profileEntries = useMemo(
    () => activeProfileEntries(joinedEntries, activeProfileId),
    [activeProfileId, joinedEntries],
  );
  const savedAsins = useMemo(
    () => [
      ...new Set(profileEntries.flatMap((item) => amazonAsinsForBook(item.book))),
    ],
    [profileEntries],
  );
  const interests = useMemo(
    () => ({
      authors: [
        ...new Set(profileEntries.flatMap((item) => item.book.authors)),
      ],
      categories: [
        ...new Set(
          profileEntries.flatMap((item) => [
            ...item.book.categories,
            ...item.entry.categories,
          ]),
        ),
      ],
    }),
    [profileEntries],
  );

  return (
    <BookstorePage
      onWantToRead={onWantToRead}
      savedAsins={savedAsins}
      interests={interests}
      detailSearch={targetSearch(target)}
    />
  );
}

export function StoreBookDetailRoute() {
  const { activeProfileId, joinedEntries } = useApp();
  const location = useLocation();
  const target = interestTarget(location.search);
  const onWantToRead = useWantToRead(target);
  const asin = location.pathname.split("/").at(-1)?.toUpperCase() ?? "";
  const isSaved = activeProfileEntries(joinedEntries, activeProfileId).some(
    (item) => amazonAsinsForBook(item.book).includes(asin),
  );

  return (
    <StoreBookDetailPage
      key={`${asin}${location.search}`}
      onWantToRead={onWantToRead}
      isSaved={isSaved}
    />
  );
}

export function OffersRoute() {
  const { activeProfileId, joinedEntries } = useApp();
  const wishlistEntries = useMemo(
    () =>
      activeProfileEntries(joinedEntries, activeProfileId).filter(
        (item) => item.entry.status === "want_to_read",
      ),
    [activeProfileId, joinedEntries],
  );
  const wishlistBooks = useMemo<WishlistAmazonBook[]>(
    () =>
      wishlistEntries.flatMap((item) => {
          const asins = amazonAsinsForBook(item.book);
          return asins.length > 0
            ? [
                {
                  bookId: item.book.id,
                  entryId: item.entry.id,
                  asins,
                  title: item.book.title,
                  authors: item.book.authors,
                },
              ]
            : [];
        }),
    [wishlistEntries],
  );
  const unlinkedBooks = useMemo<UnlinkedWishlistBook[]>(
    () =>
      wishlistEntries
        .filter((item) => amazonAsinsForBook(item.book).length === 0)
        .map((item) => ({
          bookId: item.book.id,
          entryId: item.entry.id,
          title: item.book.title,
          authors: item.book.authors,
        })),
    [wishlistEntries],
  );

  return (
    <OffersPage
      wishlistBooks={wishlistBooks}
      unlinkedBooks={unlinkedBooks}
    />
  );
}
