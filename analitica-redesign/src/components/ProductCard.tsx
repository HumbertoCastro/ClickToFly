import { ExternalLink, MessageCircle } from "lucide-react";

import type { Product } from "../data/analitica";
import { whatsappHref } from "../lib/contact";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card";

type ProductCardProps = {
  product: Product;
  index?: number;
};

export function ProductCard({ product, index = 0 }: ProductCardProps) {
  return (
    <Card
      className="commerce-card flex min-h-full flex-col overflow-hidden bg-white"
      style={{ animationDelay: `${Math.min(index, 18) * 55}ms` }}
    >
      <div className="flex h-52 items-center justify-center border-b border-border bg-white p-4">
        <img
          className="max-h-36 w-full scale-110 object-contain"
          src={product.image}
          alt={product.name}
        />
      </div>
      <CardHeader>
        <Badge className="w-fit" variant="accent">
          {product.category}
        </Badge>
        <CardTitle>{product.name}</CardTitle>
        <CardDescription>{product.description}</CardDescription>
      </CardHeader>
      <CardContent className="mt-auto">
        <a
          className="inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"
          href={`https://www.analiticalabor.com.br${product.sourcePath}`}
          target="_blank"
          rel="noreferrer"
        >
          Conteúdo original
          <ExternalLink className="size-4" aria-hidden="true" />
        </a>
      </CardContent>
      <CardFooter>
        <Button asChild className="w-full transition-transform active:scale-[0.96]" variant="whatsapp">
          <a href={whatsappHref(product.message)} target="_blank" rel="noreferrer">
            <MessageCircle data-icon="inline-start" />
            Solicitar via WhatsApp
          </a>
        </Button>
      </CardFooter>
    </Card>
  );
}
