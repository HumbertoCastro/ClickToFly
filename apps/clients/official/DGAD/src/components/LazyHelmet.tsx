import { lazy, Suspense } from "react";

const SpartanHelmet = lazy(() =>
  import("./SpartanHelmet").then((module) => ({ default: module.SpartanHelmet })),
);

export function LazyHelmet() {
  return (
    <Suspense
      fallback={
        <div className="helmet-fallback" aria-hidden="true">
          <span />
        </div>
      }
    >
      <SpartanHelmet />
    </Suspense>
  );
}
