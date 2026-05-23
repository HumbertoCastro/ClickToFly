import { cn } from "../lib/utils";

type SectionIntroProps = {
  title: string;
  description: string;
  align?: "left" | "center";
  className?: string;
};

export function SectionIntro({
  title,
  description,
  align = "left",
  className,
}: SectionIntroProps) {
  return (
    <div
      className={cn(
        "flex max-w-3xl flex-col gap-4",
        align === "center" && "mx-auto text-center",
        className,
      )}
    >
      <h2 className="text-3xl font-semibold leading-tight tracking-normal text-foreground sm:text-4xl">
        {title}
      </h2>
      <p className="text-base leading-7 text-muted-foreground sm:text-lg">
        {description}
      </p>
    </div>
  );
}
