import { lazy, Suspense, useEffect } from "react";
import {
  HashRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";
import { AppShell } from "./components/AppShell";
import { Logo } from "./components/Logo";
import { useApp } from "./context/AppContext";
import { loadBookDetailPage } from "./lib/routeLoaders";

const BookDetailPage = lazy(() =>
  loadBookDetailPage().then((module) => ({
    default: module.BookDetailPage,
  })),
);
const BookFormPage = lazy(() =>
  import("./pages/BookFormPage").then((module) => ({
    default: module.BookFormPage,
  })),
);
const DashboardPage = lazy(() =>
  import("./pages/DashboardPage").then((module) => ({
    default: module.DashboardPage,
  })),
);
const SharedLibraryPage = lazy(() =>
  import("./pages/SharedLibraryPage").then((module) => ({
    default: module.SharedLibraryPage,
  })),
);
const LibraryPage = lazy(() =>
  import("./pages/LibraryPage").then((module) => ({
    default: module.LibraryPage,
  })),
);
const LoginPage = lazy(() =>
  import("./pages/LoginPage").then((module) => ({
    default: module.LoginPage,
  })),
);
const ProfilePickerPage = lazy(() =>
  import("./pages/ProfilePickerPage").then((module) => ({
    default: module.ProfilePickerPage,
  })),
);
const StorefrontLayout = lazy(() =>
  import("./routes/AmazonRoutes").then((module) => ({
    default: module.StorefrontLayout,
  })),
);
const BookstoreRoute = lazy(() =>
  import("./routes/AmazonRoutes").then((module) => ({
    default: module.BookstoreRoute,
  })),
);
const StoreBookDetailRoute = lazy(() =>
  import("./routes/AmazonRoutes").then((module) => ({
    default: module.StoreBookDetailRoute,
  })),
);
const OffersRoute = lazy(() =>
  import("./routes/AmazonRoutes").then((module) => ({
    default: module.OffersRoute,
  })),
);
const PrivacyPage = lazy(() =>
  import("./pages/LegalPages").then((module) => ({
    default: module.PrivacyPage,
  })),
);
const TermsPage = lazy(() =>
  import("./pages/LegalPages").then((module) => ({
    default: module.TermsPage,
  })),
);
function LoadingScreen() {
  return (
    <div className="loading-screen">
      <Logo />
      <span className="loading-screen__line" />
      <p>Abrindo sua biblioteca…</p>
    </div>
  );
}

function routeTitle(pathname: string): string {
  if (pathname === "/livraria") return "Livraria — Entre Capítulos";
  if (pathname.startsWith("/livraria/")) {
    return "Detalhes do livro — Entre Capítulos";
  }
  if (pathname === "/ofertas") return "Ofertas da sua lista — Entre Capítulos";
  if (pathname === "/privacidade") {
    return "Política de privacidade — Entre Capítulos";
  }
  if (pathname === "/termos") return "Termos de uso — Entre Capítulos";
  if (pathname === "/library") return "Minha estante — Entre Capítulos";
  if (pathname === "/biblioteca") return "Biblioteca — Entre Capítulos";
  if (pathname === "/profiles") return "Escolher perfil — Entre Capítulos";
  if (pathname === "/login") return "Entrar — Entre Capítulos";
  if (pathname.startsWith("/books/")) return "Livro — Entre Capítulos";
  return "Entre Capítulos";
}

function RouteChangeManager() {
  const location = useLocation();
  const title = routeTitle(location.pathname);

  useEffect(() => {
    document.title = title;
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });

    const root = document.getElementById("root") ?? document.body;
    const focusHeading = () => {
      const heading = root.querySelector<HTMLElement>("main h1");
      if (!heading) return false;
      heading.setAttribute("tabindex", "-1");
      heading.focus({ preventScroll: true });
      return true;
    };
    if (focusHeading()) return;

    const observer = new MutationObserver(() => {
      if (focusHeading()) observer.disconnect();
    });
    observer.observe(root, { childList: true, subtree: true });
    const timeout = window.setTimeout(() => observer.disconnect(), 3_000);
    return () => {
      observer.disconnect();
      window.clearTimeout(timeout);
    };
  }, [location.pathname, title]);

  return (
    <span className="sr-only" aria-live="polite" aria-atomic="true">
      {title}
    </span>
  );
}

function ProtectedRoute() {
  const { authenticated, loading } = useApp();
  const location = useLocation();
  if (loading) return <LoadingScreen />;
  if (!authenticated) {
    const returnTo = `${location.pathname}${location.search}`;
    return (
      <Navigate
        to={`/login?returnTo=${encodeURIComponent(returnTo)}`}
        replace
      />
    );
  }
  return <Outlet />;
}

function LibraryRoute() {
  const { activeProfileId } = useApp();
  const location = useLocation();
  if (!activeProfileId) {
    const returnTo = `${location.pathname}${location.search}`;
    return (
      <Navigate
        to={`/profiles?returnTo=${encodeURIComponent(returnTo)}`}
        replace
      />
    );
  }
  return <Outlet />;
}

function ShellRoute() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
}

function BookFormRoute() {
  const location = useLocation();
  return <BookFormPage key={location.search} />;
}

function NotFoundPage() {
  return (
    <div className="page not-found">
      <p className="eyebrow">PÁGINA FORA DO ÍNDICE</p>
      <h1>Este capítulo não existe.</h1>
      <p>Volte à estante para continuar sua leitura.</p>
      <a className="button button--primary" href="#/">
        Ir para o início
      </a>
    </div>
  );
}

export default function App() {
  return (
    <HashRouter>
      <RouteChangeManager />
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<StorefrontLayout />}>
            <Route path="/livraria" element={<BookstoreRoute />} />
            <Route
              path="/livraria/:asin"
              element={<StoreBookDetailRoute />}
            />
            <Route path="/privacidade" element={<PrivacyPage />} />
            <Route path="/termos" element={<TermsPage />} />
          </Route>
          <Route element={<ProtectedRoute />}>
            <Route path="/profiles" element={<ProfilePickerPage />} />
            <Route element={<ShellRoute />}>
              <Route path="/biblioteca" element={<SharedLibraryPage />} />
              <Route
                path="/house"
                element={<Navigate to="/biblioteca" replace />}
              />
              <Route element={<LibraryRoute />}>
                <Route index element={<DashboardPage />} />
                <Route path="/library" element={<LibraryPage />} />
                <Route path="/ofertas" element={<OffersRoute />} />
                <Route path="/books/new" element={<BookFormRoute />} />
                <Route path="/books/:entryId" element={<BookDetailPage />} />
                <Route
                  path="/books/:entryId/edit"
                  element={<BookFormRoute />}
                />
              </Route>
            </Route>
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </HashRouter>
  );
}
