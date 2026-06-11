import type { Icon } from "@phosphor-icons/react";
import {
  ArrowBendUpRight,
  ChatCircleText,
  CheckCircle,
  MapPinArea,
  ShieldCheck,
  Sparkle,
  Storefront,
  Sunglasses,
  Truck,
  UsersThree,
} from "@phosphor-icons/react";

export const whatsAppNumber = "5531971140018";
export const whatsAppMessage =
  "Olá, Mirage! Tenho interesse em óculos consignados para minha loja/ótica.";
export const whatsAppHref = `https://wa.me/${whatsAppNumber}?text=${encodeURIComponent(
  whatsAppMessage,
)}`;

export type NavItem = {
  label: string;
  href: string;
};

export const navItems: NavItem[] = [
  { label: "Vitrine", href: "#vitrine" },
  { label: "Consignação", href: "#consignacao" },
  { label: "Sobre", href: "#sobre" },
  { label: "Como funciona", href: "#como-funciona" },
];

export type IconItem = {
  title: string;
  text: string;
  icon: Icon;
};

export const trustItems: IconItem[] = [
  {
    title: "Desde 1994",
    text: "História e consistência no mercado de óculos solares.",
    icon: CheckCircle,
  },
  {
    title: "Óculos consignados",
    text: "Modelos para testar giro de vitrine com baixo risco.",
    icon: ShieldCheck,
  },
  {
    title: "Todo o Brasil",
    text: "Representantes atendendo lojistas em diferentes regiões.",
    icon: MapPinArea,
  },
  {
    title: "Summerfix e Bask",
    text: "Parcerias com marcas atuais para ampliar variedade.",
    icon: Sparkle,
  },
];

export const retailerBenefits: IconItem[] = [
  {
    title: "Alto giro em loja física",
    text: "Peças com apelo visual para vitrine, balcão e compra por impulso.",
    icon: Storefront,
  },
  {
    title: "Baixo risco na entrada",
    text: "A consignação facilita a primeira compra e protege capital de estoque.",
    icon: ShieldCheck,
  },
  {
    title: "Variedade de modelos",
    text: "Linhas versáteis para diferentes públicos, tickets e ocasiões.",
    icon: Sunglasses,
  },
  {
    title: "Proteção UVA/UVB",
    text: "Produto com argumento comercial simples para venda consultiva.",
    icon: CheckCircle,
  },
];

export const productStories = [
  {
    name: "Solar havana",
    description: "Acetato âmbar, lente escura e presença de vitrine.",
  },
  {
    name: "Black retail",
    description: "Armação preta para uma seleção mais urbana e versátil.",
  },
  {
    name: "Linha leve",
    description: "Modelos atuais para compor exposição sem excesso visual.",
  },
];

export const processSteps: IconItem[] = [
  {
    title: "Contato comercial",
    text: "O lojista chama pelo WhatsApp e informa cidade, tipo de loja e volume desejado.",
    icon: ChatCircleText,
  },
  {
    title: "Representante regional",
    text: "A Mirage direciona o atendimento para apresentar condições e disponibilidade.",
    icon: UsersThree,
  },
  {
    title: "Curadoria para vitrine",
    text: "São selecionados modelos com bom potencial de giro e leitura visual clara.",
    icon: Sunglasses,
  },
  {
    title: "Consignação e reposição",
    text: "A loja acompanha a saída das peças e combina reposição conforme desempenho.",
    icon: Truck,
  },
];

export const ctaActions = [
  {
    title: "Chamar no WhatsApp",
    text: "Abrir conversa com a Mirage.",
    icon: ArrowBendUpRight,
  },
];
