import { useCallback, useEffect, useState } from "react";

import { BrandStrip } from "./components/BrandStrip";
import { ComplianceSection } from "./components/ComplianceSection";
import { ContactSection } from "./components/ContactSection";
import {
  AboutPage,
  ContactPage,
  ControlledProductsPage,
  InsightsPage,
  QuotePage,
} from "./components/ContentPages";
import { CredentialsSection } from "./components/CredentialsSection";
import { FloatingWhatsApp } from "./components/FloatingWhatsApp";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";
import { HeroSection } from "./components/HeroSection";
import { ProductCatalogPage } from "./components/ProductCatalogPage";
import { ProductsSection } from "./components/ProductsSection";
import { SolutionsSection } from "./components/SolutionsSection";
import { getAppPathname, withBasePath, type NavigateHandler } from "./lib/navigation";

type AppRoute =
  | "home"
  | "about"
  | "products"
  | "controlled"
  | "insights"
  | "contact"
  | "quote";

function getCurrentLocation() {
  return `${getAppPathname()}${window.location.hash}`;
}

function normalizePathname(pathname: string) {
  return pathname.replace(/\/$/, "") || "/";
}

function getRoute(pathname: string): AppRoute {
  const normalized = normalizePathname(pathname);

  if (normalized === "/produtos") return "products";
  if (normalized === "/quem-somos") return "about";
  if (normalized === "/produtos-quimicos-controlados" || normalized === "/produtos-controlados") {
    return "controlled";
  }
  if (normalized === "/fique-por-dentro" || normalized === "/category/fique-por-dentro") {
    return "insights";
  }
  if (normalized === "/contato") return "contact";
  if (normalized === "/orcamento") return "quote";

  return "home";
}

function App() {
  const [location, setLocation] = useState(getCurrentLocation);
  const route = getRoute(getAppPathname());

  useEffect(() => {
    const handlePopState = () => setLocation(getCurrentLocation());
    window.addEventListener("popstate", handlePopState);

    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  useEffect(() => {
    const hash = window.location.hash;

    if (route === "home" && hash) {
      window.requestAnimationFrame(() => {
        document.querySelector(hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
      return;
    }

    window.requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: "smooth" }));
  }, [location, route]);

  const handleNavigate = useCallback<NavigateHandler>((href, event) => {
    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.altKey ||
      event.ctrlKey ||
      event.shiftKey
    ) {
      return;
    }

    const nextUrl = new URL(withBasePath(href), window.location.origin);

    if (nextUrl.origin !== window.location.origin) {
      return;
    }

    event.preventDefault();

    const nextLocation = `${getAppPathname(nextUrl.pathname)}${nextUrl.hash}`;
    if (nextLocation !== getCurrentLocation()) {
      window.history.pushState({}, "", `${nextUrl.pathname}${nextUrl.hash}`);
      setLocation(nextLocation);
      return;
    }

    if (nextUrl.hash) {
      document.querySelector(nextUrl.hash)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  return (
    <>
      {route !== "home" && <Header onNavigate={handleNavigate} />}
      {route === "products" && <ProductCatalogPage onNavigate={handleNavigate} />}
      {route === "about" && <AboutPage onNavigate={handleNavigate} />}
      {route === "controlled" && <ControlledProductsPage onNavigate={handleNavigate} />}
      {route === "insights" && <InsightsPage onNavigate={handleNavigate} />}
      {route === "contact" && <ContactPage />}
      {route === "quote" && <QuotePage onNavigate={handleNavigate} />}
      {route === "home" && (
        <main key="home" className="page-shell">
          <HeroSection onNavigate={handleNavigate} />
          <BrandStrip />
          <SolutionsSection />
          <ProductsSection onNavigate={handleNavigate} />
          <ComplianceSection onNavigate={handleNavigate} />
          <CredentialsSection onNavigate={handleNavigate} />
          <ContactSection />
        </main>
      )}
      <Footer onNavigate={handleNavigate} />
      <FloatingWhatsApp />
    </>
  );
}

export default App;
