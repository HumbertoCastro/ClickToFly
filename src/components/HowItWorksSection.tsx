import type { CSSProperties } from 'react';
import { useEffect, useRef, useState } from 'react';
import { clickAdvantages } from '../data';
import { ScrollPlaneScene } from './ScrollPlaneScene';

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

type WhySectionStyle = CSSProperties & {
  '--why-progress': string;
  '--why-steps': number;
};

export function HowItWorksSection() {
  const sectionRef = useRef<HTMLElement | null>(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [scrollProgress, setScrollProgress] = useState(0);
  const activeAdvantage = clickAdvantages[activeIndex];
  const sectionStyle: WhySectionStyle = {
    '--why-progress': scrollProgress.toFixed(4),
    '--why-steps': clickAdvantages.length,
    minHeight: `${(clickAdvantages.length + 1) * 100}svh`,
  };

  useEffect(() => {
    const section = sectionRef.current;
    let frame = 0;

    if (!section) {
      return undefined;
    }

    const update = () => {
      frame = 0;

      const rect = section.getBoundingClientRect();
      const scrollable = Math.max(1, rect.height - window.innerHeight);
      const progress = clamp(-rect.top / scrollable, 0, 1);
      const nextIndex = clamp(
        Math.round(progress * (clickAdvantages.length - 1)),
        0,
        clickAdvantages.length - 1,
      );

      setScrollProgress(progress);
      setActiveIndex(nextIndex);
    };

    const requestUpdate = () => {
      if (!frame) {
        frame = window.requestAnimationFrame(update);
      }
    };

    update();
    window.addEventListener('scroll', requestUpdate, { passive: true });
    window.addEventListener('resize', requestUpdate);

    return () => {
      window.removeEventListener('scroll', requestUpdate);
      window.removeEventListener('resize', requestUpdate);

      if (frame) {
        window.cancelAnimationFrame(frame);
      }
    };
  }, []);

  const scrollToStep = (index: number) => {
    const section = sectionRef.current;

    if (!section) {
      return;
    }

    const sectionTop = window.scrollY + section.getBoundingClientRect().top;
    const scrollable = Math.max(1, section.offsetHeight - window.innerHeight);
    const target = sectionTop + scrollable * (index / Math.max(1, clickAdvantages.length - 1));

    window.scrollTo({ behavior: 'smooth', top: target });
  };

  return (
    <section ref={sectionRef} className="why-section" id="como-funciona" style={sectionStyle}>
      <div className="why-sticky-stage">
        <ScrollPlaneScene activeIndex={activeIndex} progress={scrollProgress} />
        <div className="container why-stage-grid">
          <div className="why-copy-pane reveal">
            <span className="why-kicker">Como funciona</span>
            <h2>POR QUE DECOLAR JUNTO DA CLICK?</h2>
            <p>
              Enquanto você rola a tela, veja como a Click combina tecnologia, curadoria e
              atendimento humano para transformar uma promoção em uma decisão clara de viagem.
            </p>
            <div className="why-progress-nav" aria-label="Motivos para decolar com a Click">
              {clickAdvantages.map((advantage, index) => (
                <button
                  className={index === activeIndex ? 'is-active' : ''}
                  key={advantage.title}
                  type="button"
                  aria-label={`Ir para ${advantage.title}`}
                  aria-current={index === activeIndex ? 'step' : undefined}
                  onClick={() => scrollToStep(index)}
                >
                  <span>{String(index + 1).padStart(2, '0')}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="why-reason-stack" aria-live="polite">
            {clickAdvantages.map((advantage, index) => {
              const isActive = activeIndex === index;
              const offset = index - activeIndex;

              return (
                <article
                  className={`why-scroll-card ${isActive ? 'is-active' : ''}`}
                  key={advantage.title}
                  aria-hidden={!isActive}
                  style={{ '--stack-offset': offset } as CSSProperties & { '--stack-offset': number }}
                >
                  <span className="why-step-label">motivo {String(index + 1).padStart(2, '0')}</span>
                  <span className="why-step-icon">{advantage.icon}</span>
                  <h3>{advantage.title}</h3>
                  <p>{advantage.description}</p>
                  <div className="why-step-footer">
                    <span>{String(index + 1).padStart(2, '0')}</span>
                    <em>{String(clickAdvantages.length).padStart(2, '0')}</em>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="why-current-title" aria-hidden="true">
            {activeAdvantage.title}
          </div>
        </div>
      </div>
    </section>
  );
}
