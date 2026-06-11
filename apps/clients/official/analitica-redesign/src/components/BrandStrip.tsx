import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, ArrowRight, ExternalLink, MessageCircle, X } from "lucide-react";

import { featuredProducts, productDetails, type Product } from "../data/analitica";
import { whatsappHref } from "../lib/contact";
import { Button } from "./ui/button";

export function BrandStrip() {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(() => {
    const productName = new URLSearchParams(window.location.search).get("produto");
    return featuredProducts.find((product) => product.name === productName) ?? null;
  });
  const [isClosing, setIsClosing] = useState(false);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const dragState = useRef({ down: false, startX: 0, scrollLeft: 0, moved: 0 });

  useEffect(() => {
    if (!selectedProduct) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeProduct();
      }
    };

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedProduct]);

  const scrollByCard = (direction: "previous" | "next") => {
    scrollerRef.current?.scrollBy({
      left: direction === "next" ? 360 : -360,
      behavior: "smooth",
    });
  };

  const openProduct = (product: Product) => {
    if (dragState.current.moved > 8) {
      return;
    }

    setIsClosing(false);
    setSelectedProduct(product);
  };

  const closeProduct = () => {
    setIsClosing(true);
    window.setTimeout(() => {
      setSelectedProduct(null);
      setIsClosing(false);
    }, 280);
  };

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    const scroller = scrollerRef.current;
    if (!scroller) {
      return;
    }

    dragState.current = {
      down: true,
      startX: event.clientX,
      scrollLeft: scroller.scrollLeft,
      moved: 0,
    };
    scroller.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const scroller = scrollerRef.current;
    if (!scroller || !dragState.current.down) {
      return;
    }

    const delta = event.clientX - dragState.current.startX;
    dragState.current.moved = Math.max(dragState.current.moved, Math.abs(delta));
    scroller.scrollLeft = dragState.current.scrollLeft - delta;
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const scroller = scrollerRef.current;
    dragState.current.down = false;
    scroller?.releasePointerCapture(event.pointerId);
  };

  const selectedDetail = selectedProduct
    ? productDetails[selectedProduct.name] ?? {
        intro: selectedProduct.description,
        heroImage: selectedProduct.image,
        highlights: [selectedProduct.category, "Cotação consultiva", "Atendimento Analítica"],
        sections: [
          {
            title: selectedProduct.name,
            body: selectedProduct.description,
            image: selectedProduct.image,
          },
        ],
      }
    : null;

  return (
    <section
      id="produtos"
      aria-label="Conheça nossos produtos"
      className="product-showcase section-pad overflow-hidden border-y border-border bg-secondary/70"
    >
      <div className="container flex flex-col gap-8">
        <div className="grid gap-5 lg:grid-cols-[0.88fr_1.12fr] lg:items-end">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              Conheça nossos produtos
            </p>
            <h2 className="mt-4 max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl">
              Portfólio técnico com páginas próprias dentro da experiência.
            </h2>
          </div>
          <div className="flex flex-col gap-4 lg:items-end">
            <p className="max-w-xl text-base leading-7 text-muted-foreground lg:text-right">
              Arraste para navegar pelas marcas e selecione um produto para abrir uma seção
              expandida com conteúdo reestruturado das páginas originais da Analítica.
            </p>
            <div className="flex gap-2">
              <Button
                aria-label="Voltar produtos"
                onClick={() => scrollByCard("previous")}
                size="icon"
                variant="outline"
              >
                <ArrowLeft data-icon="inline-start" />
              </Button>
              <Button
                aria-label="Avançar produtos"
                onClick={() => scrollByCard("next")}
                size="icon"
                variant="outline"
              >
                <ArrowRight data-icon="inline-start" />
              </Button>
            </div>
          </div>
        </div>

        <div
          ref={scrollerRef}
          className="product-carousel flex cursor-grab gap-5 overflow-x-auto pb-5 active:cursor-grabbing"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          {featuredProducts.map((product, index) => (
            <button
              key={product.name}
              className="product-logo-card group flex h-[25rem] w-[19rem] shrink-0 flex-col justify-between rounded-2xl border border-border bg-white p-5 text-left shadow-line transition duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.98]"
              onClick={() => openProduct(product)}
              style={{ animationDelay: `${index * 45}ms` }}
              type="button"
            >
              <span className="flex h-44 items-center justify-center rounded-xl bg-background p-3">
                <img
                  className="max-h-36 w-full scale-110 object-contain transition duration-300 group-hover:scale-[1.18]"
                  src={product.image}
                  alt=""
                  draggable={false}
                />
              </span>
              <span className="flex flex-col gap-3">
                <span className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                  {product.category}
                </span>
                <span className="text-xl font-semibold leading-tight text-foreground">
                  {product.name}
                </span>
                <span className="line-clamp-3 text-sm leading-6 text-muted-foreground">
                  {product.description}
                </span>
              </span>
              <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary">
                Saiba mais
                <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
              </span>
            </button>
          ))}
        </div>
      </div>

      {selectedProduct &&
        selectedDetail &&
        createPortal(
        <div
          aria-modal="true"
          className={`product-expanded fixed inset-0 z-50 overflow-y-auto bg-background ${
            isClosing ? "is-closing" : ""
          }`}
          role="dialog"
        >
          <div className="sticky top-0 z-10 border-b border-border bg-background/92 backdrop-blur">
            <div className="container flex h-20 items-center justify-between gap-4">
              <div className="flex min-w-0 items-center gap-4">
                <span className="flex h-12 w-20 shrink-0 items-center justify-center rounded-lg border border-border bg-white px-3">
                  <img className="max-h-9 w-full object-contain" src={selectedProduct.image} alt="" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                    {selectedProduct.category}
                  </p>
                  <h2 className="truncate text-lg font-semibold text-foreground">
                    {selectedProduct.name}
                  </h2>
                </div>
              </div>
              <Button aria-label="Fechar produto" onClick={closeProduct} size="icon" variant="outline">
                <X data-icon="inline-start" />
              </Button>
            </div>
          </div>

          <div className="container grid gap-8 py-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-start lg:py-12">
            <div className="product-detail-hero overflow-hidden rounded-2xl border border-border bg-white shadow-soft">
              <div className="flex min-h-[22rem] items-center justify-center bg-secondary/60 p-8">
                <img
                  className="max-h-[21rem] w-full object-contain"
                  src={selectedDetail.heroImage}
                  alt={selectedProduct.name}
                />
              </div>
              <div className="border-t border-border p-6">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">
                  Origem do conteúdo
                </p>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  Reestruturação interna da página original{" "}
                  <span className="font-semibold text-foreground">{selectedProduct.sourcePath}</span>.
                </p>
              </div>
            </div>

            <div className="flex flex-col gap-7">
              <div className="flex flex-col gap-5">
                <h1 className="max-w-3xl text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl">
                  {selectedProduct.name}
                </h1>
                <p className="max-w-3xl text-lg leading-8 text-muted-foreground">
                  {selectedDetail.intro}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {selectedDetail.highlights.map((item) => (
                  <div key={item} className="rounded-xl border border-border bg-white p-4 shadow-line">
                    <p className="text-sm font-semibold leading-5 text-foreground">{item}</p>
                  </div>
                ))}
              </div>

              <div className="grid gap-4">
                {selectedDetail.sections.map((section, index) => (
                  <article
                    key={section.title}
                    className="product-detail-section grid gap-4 rounded-2xl border border-border bg-white p-5 shadow-line sm:grid-cols-[0.72fr_1.28fr] sm:items-center"
                    style={{ animationDelay: `${index * 70}ms` }}
                  >
                    <div className="flex min-h-36 items-center justify-center rounded-xl bg-secondary/65 p-4">
                      {section.image ? (
                        <img
                          className="max-h-32 w-full object-contain"
                          src={section.image}
                          alt={section.title}
                        />
                      ) : (
                        <span className="text-4xl font-semibold text-primary/24">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                      )}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold leading-tight text-foreground">
                        {section.title}
                      </h3>
                      <p className="mt-3 text-sm leading-7 text-muted-foreground">{section.body}</p>
                    </div>
                  </article>
                ))}
              </div>

              <div className="flex flex-col gap-3 rounded-2xl bg-primary p-5 text-primary-foreground sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold text-white">Solicite uma cotação</p>
                  <p className="mt-1 text-sm leading-6 text-white/72">
                    A equipe comercial valida especificação, disponibilidade e aplicação.
                  </p>
                </div>
                <div className="flex flex-col gap-2 sm:flex-row">
                  <Button asChild className="bg-white text-primary hover:bg-white/90">
                    <a href={whatsappHref(selectedProduct.message)} target="_blank" rel="noreferrer">
                      <MessageCircle data-icon="inline-start" />
                      Cotar produto
                    </a>
                  </Button>
                  <Button
                    asChild
                    className="border-white/30 bg-transparent text-white hover:bg-white/10"
                    variant="outline"
                  >
                    <a
                      href={`https://www.analiticalabor.com.br${selectedProduct.sourcePath}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      Página original
                      <ExternalLink data-icon="inline-end" />
                    </a>
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>,
          document.body,
        )}
    </section>
  );
}
