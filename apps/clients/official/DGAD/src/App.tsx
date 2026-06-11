import { useEffect, useMemo } from "react";
import { EmberField } from "@/components/EmberField";
import { TimedOfferModal } from "@/components/landing/TimedOfferModal";
import { LogoIntro } from "@/components/LogoIntro";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { routeMeta } from "@/data/site";
import { getRoutePath, toAppHref } from "@/lib/routing";
import { AboutPage } from "@/pages/AboutPage";
import { CodigoCompletoPage } from "@/pages/CodigoCompletoPage";
import { CreatorPage } from "@/pages/CreatorPage";
import { HomePage } from "@/pages/HomePage";
import { LegalPage } from "@/pages/LegalPage";
import { NotFoundPage } from "@/pages/NotFoundPage";

const routes = {
  "/": <HomePage />,
  "/codigo-completo": <CodigoCompletoPage />,
  "/sobre": <AboutPage />,
  "/criador": <CreatorPage />,
  "/politica-de-privacidade": <LegalPage kind="privacy" />,
  "/pagamento-e-reembolso": <LegalPage kind="refund" />,
} as const;

function normalizePath(pathname: string) {
  return getRoutePath(pathname);
}

export default function App() {
  const currentPath = normalizePath(window.location.pathname);
  const page = routes[currentPath as keyof typeof routes] ?? <NotFoundPage />;
  const meta = useMemo(
    () => routeMeta.find((item) => item.path === currentPath) ?? routeMeta[0],
    [currentPath],
  );

  useEffect(() => {
    const isLegacyRefundPath =
      getRoutePath(window.location.pathname) === "/pagamento-e-reembolso" &&
      window.location.pathname.includes("pagamente");

    if (isLegacyRefundPath) {
      window.history.replaceState(null, "", toAppHref("/pagamento-e-reembolso"));
    }
  }, []);

  useEffect(() => {
    document.title = meta.title;
    const description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (description) {
      description.content = meta.description;
    }
  }, [meta]);

  useEffect(() => {
    if (!window.location.hash) {
      return;
    }

    let targetId = window.location.hash.slice(1);
    try {
      targetId = decodeURIComponent(targetId);
    } catch {
      targetId = window.location.hash.slice(1);
    }
    const scrollToHash = () => {
      document.getElementById(targetId)?.scrollIntoView();
    };

    const frameId = window.requestAnimationFrame(scrollToHash);
    const timeoutId = window.setTimeout(scrollToHash, 160);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.clearTimeout(timeoutId);
    };
  }, [currentPath]);

  return (
    <div className="min-h-dvh bg-background text-foreground">
      <a href="#main-content" className="skip-link">
        Pular para conteúdo
      </a>
      <LogoIntro />
      <EmberField />
      <SiteHeader currentPath={currentPath} />
      <main id="main-content">{page}</main>
      <SiteFooter />
      <TimedOfferModal enabled={currentPath === "/"} />
    </div>
  );
}
