import { BudgetFormSection } from './components/BudgetFormSection';
import { DestinationsSection } from './components/DestinationsSection';
import { FAQSection } from './components/FAQSection';
import { FeaturedDealsSection } from './components/FeaturedDealsSection';
import { FloatingWhatsApp } from './components/FloatingWhatsApp';
import { Footer } from './components/Footer';
import { Header } from './components/Header';
import { HeroSection } from './components/HeroSection';
import { HowItWorksSection } from './components/HowItWorksSection';
import { PlaneCursor } from './components/PlaneCursor';
import { TestimonialsSection } from './components/TestimonialsSection';
import { TrustSection } from './components/TrustSection';
import { WhatsAppGroupSection } from './components/WhatsAppGroupSection';

export function App() {
  return (
    <>
      <PlaneCursor />
      <Header />
      <main>
        <HeroSection />
        <DestinationsSection />
        <HowItWorksSection />
        <FeaturedDealsSection />
        <WhatsAppGroupSection />
        <TrustSection />
        <TestimonialsSection />
        <BudgetFormSection />
        <FAQSection />
      </main>
      <Footer />
      <FloatingWhatsApp />
    </>
  );
}
