import { Star } from 'lucide-react';
import { testimonials } from '../data';
import { SectionHeader } from './SectionHeader';

export function TestimonialsSection() {
  return (
    <section className="section-pad testimonials-section">
      <div className="container">
        <SectionHeader
          eyebrow="Depoimentos"
          title="Quem viaja com oportunidade, volta recomendando"
        />
        <div className="testimonial-grid">
          {testimonials.map((testimonial) => (
            <article className="testimonial-card reveal" key={testimonial.name}>
              <div className="stars" aria-label="Avaliação 5 estrelas">
                {Array.from({ length: 5 }).map((_, index) => (
                  <Star key={index} />
                ))}
              </div>
              <p>"{testimonial.quote}"</p>
              <strong>{testimonial.name}</strong>
              <span>{testimonial.detail}</span>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
