import { BudgetQuotePage } from './components/BudgetQuotePage';
import { DestinationsSection } from './components/DestinationsSection';
import { FAQSection } from './components/FAQSection';
import { FeaturedDealsSection } from './components/FeaturedDealsSection';
import { FloatingWhatsApp } from './components/FloatingWhatsApp';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { HowItWorksSection } from './components/HowItWorksSection';
import { PlaneCursor } from './components/PlaneCursor';
import { QuoteCtaSection } from './components/QuoteCtaSection';
import { TestimonialsSection } from './components/TestimonialsSection';
import { TrustSection } from './components/TrustSection';
import { WhatsAppGroupSection } from './components/WhatsAppGroupSection';
import { getAppPathname } from './lib/routing';

export function App() {
  const isBudgetPage = getAppPathname() === '/orcamento';

  return (
    <>
      <PlaneCursor />
      <Header />
      {isBudgetPage ? (
        <BudgetQuotePage />
      ) : (
        <main>
          <HeroSection />
          <DestinationsSection />
          <FeaturedDealsSection />
          <HowItWorksSection />
          <WhatsAppGroupSection />
          <TrustSection />
          <QuoteCtaSection />
          <TestimonialsSection />
          <FAQSection />
        </main>
      )}
      <Footer />
      <FloatingWhatsApp />
    </>
  );
}
