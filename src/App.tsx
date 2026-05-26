import { BudgetQuotePage } from './components/BudgetQuotePage';
import { FloatingWhatsApp } from './components/FloatingWhatsApp';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { PlaneCursor } from './components/PlaneCursor';
import { TasteLandingPage } from './components/TasteLandingPage';
import { getAppPathname } from './lib/routing';

export function App() {
  const isBudgetPage = getAppPathname() === '/orcamento';

  return (
    <>
      <PlaneCursor />
      <Header />
      {isBudgetPage ? <BudgetQuotePage /> : <TasteLandingPage />}
      <Footer />
      <FloatingWhatsApp />
    </>
  );
}
