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

const BookDetailPage = lazy(() =>
  import("./pages/BookDetailPage").then((module) => ({
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
function LoadingScreen() {
  return (
    <div className="loading-screen">
      <Logo />
      <span className="loading-screen__line" />
      <p>Abrindo sua biblioteca…</p>
    </div>
  );
}

function ScrollToTop() {
  const location = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [location.pathname]);
  return null;
}

function ProtectedRoute() {
  const { authenticated, loading } = useApp();
  if (loading) return <LoadingScreen />;
  if (!authenticated) return <Navigate to="/login" replace />;
  return <Outlet />;
}

function LibraryRoute() {
  const { activeProfileId } = useApp();
  if (!activeProfileId) return <Navigate to="/profiles" replace />;
  return <Outlet />;
}

function ShellRoute() {
  return (
    <AppShell>
      <Outlet />
    </AppShell>
  );
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
      <ScrollToTop />
      <Suspense fallback={<LoadingScreen />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
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
                <Route path="/books/new" element={<BookFormPage />} />
                <Route path="/books/:entryId" element={<BookDetailPage />} />
                <Route path="/books/:entryId/edit" element={<BookFormPage />} />
              </Route>
            </Route>
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Suspense>
    </HashRouter>
  );
}
