import { solutions, trustCards } from "../data/analitica";

const solutionLayouts = [
  "lg:col-span-2",
  "lg:col-span-2",
  "lg:col-span-1",
  "lg:col-span-1",
  "lg:col-span-2",
  "lg:col-span-2",
];

export function SolutionsSection() {
  return (
    <section id="solucoes" className="section-pad bg-background">
      <div className="container flex flex-col gap-10">
        <div className="grid gap-8 lg:grid-cols-[0.72fr_1.28fr] lg:items-end">
          <div className="flex flex-col gap-5">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
              Soluções
            </p>
            <h2 className="max-w-xl text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl">
              Linhas técnicas organizadas para compra laboratorial.
            </h2>
            <p className="max-w-lg text-base leading-7 text-muted-foreground">
              A estrutura segue o portfólio original: reagentes, cromatografia, microbiologia,
              filtração, vidrarias, controlados e segmentos industriais.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {trustCards.map((card, index) => {
              const Icon = card.icon;
              return (
                <div
                  key={card.title}
                  className="page-stagger flex min-h-24 items-start gap-3 rounded-xl border border-border bg-secondary/55 p-4"
                  style={{ animationDelay: `${index * 70}ms` }}
                >
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-white text-primary shadow-line">
                    <Icon className="size-5" aria-hidden="true" />
                  </span>
                  <span>
                    <span className="block text-sm font-semibold leading-5 text-foreground">
                      {card.title}
                    </span>
                    <span className="mt-1 block text-xs leading-5 text-muted-foreground">
                      {card.description}
                    </span>
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid auto-rows-[minmax(260px,_auto)] gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {solutions.map((solution, index) => {
            const Icon = solution.icon;
            const featured = index === 0;

            return (
              <article
                key={solution.title}
                className={`solution-card page-stagger group relative overflow-hidden rounded-2xl border border-border bg-white p-5 shadow-line transition duration-300 hover:-translate-y-1 hover:border-primary/35 hover:shadow-soft ${solutionLayouts[index]}`}
                style={{ animationDelay: `${index * 80}ms` }}
              >
                <div className="relative z-10 flex h-full flex-col gap-6">
                  <div className="flex items-center justify-between gap-4">
                    <span className="flex size-12 items-center justify-center rounded-xl bg-secondary text-primary">
                      <Icon className="size-6" aria-hidden="true" />
                    </span>
                    <span className="text-xs font-semibold uppercase tracking-[0.16em] text-primary/70">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                  </div>

                  <div className={featured ? "grid gap-5 lg:grid-cols-[0.9fr_1.1fr] lg:items-end" : "flex flex-col gap-5"}>
                    <div className="flex flex-col gap-3">
                      <h3 className="text-2xl font-semibold leading-tight tracking-tight text-foreground">
                        {solution.title}
                      </h3>
                      <p className="text-sm leading-7 text-muted-foreground">
                        {solution.description}
                      </p>
                      <p className="text-xs font-medium leading-5 text-primary">{solution.details}</p>
                    </div>

                    <div className="relative min-h-36 overflow-hidden rounded-xl bg-secondary/70">
                      <img
                        className="absolute inset-0 h-full w-full object-cover opacity-40 transition duration-500 group-hover:scale-105"
                        src={solution.image}
                        alt=""
                      />
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
