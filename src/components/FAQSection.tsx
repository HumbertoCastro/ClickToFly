import { ChevronDown } from 'lucide-react';
import { faqItems } from '../data';
import { SectionHeader } from './SectionHeader';

export function FAQSection() {
  return (
    <section className="faq-section section-pad">
      <div className="container narrow-container">
        <SectionHeader eyebrow="FAQ" title="Duvidas frequentes antes de entrar no grupo" />
        <div className="faq-list">
          {faqItems.map((item, index) => (
            <details className="faq-item reveal" key={item.question} open={index === 0}>
              <summary>
                {item.question}
                <ChevronDown />
              </summary>
              <p>{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
