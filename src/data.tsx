import {
  BadgeCheck,
  BellRing,
  CalendarCheck,
  CircleDollarSign,
  Globe2,
  Handshake,
  HeartHandshake,
  LockKeyhole,
  MapPinned,
  MessageCircle,
  Plane,
  Search,
  ShieldCheck,
  Sparkles,
  TicketPercent,
  UsersRound,
} from 'lucide-react';
import type { Deal, Destination, IconCard, NavItem } from './types';

export const whatsappNumber = '5531975863351';
export const whatsappMessage =
  'Ola, Click To Fly! Quero receber promocoes e planejar minha proxima viagem.';

export const navItems: NavItem[] = [
  { label: 'Inicio', href: '#inicio' },
  { label: 'Promocoes', href: '#promocoes' },
  { label: 'Como funciona', href: '#como-funciona' },
  { label: 'Orcamento', href: '#orcamento' },
  { label: 'Contato', href: '#contato' },
];

export const stats = [
  { value: '+500', label: 'viajantes impactados', icon: <UsersRound /> },
  { value: '+R$ 300 mil', label: 'em economia estimada', icon: <CircleDollarSign /> },
  { value: 'Diario', label: 'ofertas monitoradas', icon: <Search /> },
  { value: 'Humano', label: 'atendimento personalizado', icon: <Handshake /> },
];

export const steps: IconCard[] = [
  {
    icon: <Search />,
    title: 'Monitoramos',
    description: 'Acompanhamos tarifas, datas e oportunidades com alto potencial de economia.',
  },
  {
    icon: <BadgeCheck />,
    title: 'Selecionamos',
    description: 'Filtramos apenas promocoes relevantes, com bom custo-beneficio.',
  },
  {
    icon: <MessageCircle />,
    title: 'Divulgamos',
    description: 'Enviamos oportunidades selecionadas no grupo de WhatsApp.',
  },
  {
    icon: <CalendarCheck />,
    title: 'Planejamos',
    description: 'Quando voce decide viajar, ajudamos no orcamento personalizado.',
  },
];

export const deals: Deal[] = [
  {
    origin: 'Sao Paulo',
    destination: 'Paris',
    foundPrice: 'R$ 2.890',
    averagePrice: 'R$ 4.300',
    savings: 'R$ 1.410',
    period: 'Outubro a Novembro',
    status: 'Oferta encontrada',
    image:
      'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=900&q=85',
    imageAlt: 'Torre Eiffel em Paris ao entardecer',
  },
  {
    origin: 'Rio de Janeiro',
    destination: 'Lisboa',
    foundPrice: 'R$ 3.120',
    averagePrice: 'R$ 4.800',
    savings: 'R$ 1.680',
    period: 'Marco a Maio',
    status: 'Oferta encontrada',
    image:
      'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&w=900&q=85',
    imageAlt: 'Vista colorida de Lisboa em Portugal',
  },
  {
    origin: 'Belo Horizonte',
    destination: 'Cancun',
    foundPrice: 'R$ 2.750',
    averagePrice: 'R$ 4.100',
    savings: 'R$ 1.350',
    period: 'Baixa temporada',
    status: 'Oferta encontrada',
    image:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=85',
    imageAlt: 'Praia tropical com mar azul claro',
  },
];

export const destinations: Destination[] = [
  {
    name: 'Paris',
    description: 'Romance, cultura e gastronomia',
    badge: 'Europa classica',
    image:
      'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=85',
    imageAlt: 'Torre Eiffel em Paris com ceu iluminado',
    featured: true,
  },
  {
    name: 'Cancun',
    description: 'Praias, resorts e Caribe',
    badge: 'Caribe',
    image:
      'https://images.unsplash.com/photo-1510097467424-192d713fd8b2?auto=format&fit=crop&w=900&q=85',
    imageAlt: 'Praia caribenha com agua cristalina',
  },
  {
    name: 'Lisboa',
    description: 'Historia, conexao e otimo custo-beneficio',
    badge: 'Portugal',
    image:
      'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&w=900&q=85',
    imageAlt: 'Ruas e predios coloridos em Lisboa',
  },
  {
    name: 'Bariloche',
    description: 'Frio, montanhas e experiencias unicas',
    badge: 'Patagonia',
    image:
      'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=85',
    imageAlt: 'Paisagem de montanhas e lago',
  },
  {
    name: 'Fernando de Noronha',
    description: 'Natureza, praia e exclusividade',
    badge: 'Brasil premium',
    image:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=900&q=85',
    imageAlt: 'Praia de mar azul com areia clara',
  },
];

export const whatsappBenefits = [
  { icon: <BellRing />, text: 'Ofertas enviadas rapidamente' },
  { icon: <TicketPercent />, text: 'Curadoria de promocoes relevantes' },
  { icon: <Globe2 />, text: 'Oportunidades nacionais e internacionais' },
  { icon: <Sparkles />, text: 'Acesso simples e gratuito' },
  { icon: <ShieldCheck />, text: 'Sem spam, apenas oportunidades selecionadas' },
];

export const trustCards: IconCard[] = [
  {
    icon: <HeartHandshake />,
    title: 'Atendimento humano',
    description: 'Voce conversa com pessoas reais durante o planejamento.',
  },
  {
    icon: <LockKeyhole />,
    title: 'Transparencia',
    description: 'As condicoes sao explicadas com clareza antes da contratacao.',
  },
  {
    icon: <BadgeCheck />,
    title: 'Curadoria especializada',
    description: 'As oportunidades sao avaliadas antes de serem divulgadas.',
  },
  {
    icon: <MapPinned />,
    title: 'Planejamento personalizado',
    description: 'A equipe considera datas, destino, orcamento e preferencias.',
  },
];

export const testimonials = [
  {
    quote:
      'Consegui fechar uma viagem internacional pagando bem menos do que eu tinha visto sozinha.',
    name: 'Mariana S.',
    detail: 'Viagem para Portugal',
  },
  {
    quote:
      'Gostei da clareza nas regras e da rapidez para comparar datas proximas antes de decidir.',
    name: 'Rafael M.',
    detail: 'Ferias em familia',
  },
  {
    quote:
      'O grupo e objetivo. Quando apareceu uma promocao boa, a equipe transformou a ideia em orcamento.',
    name: 'Camila S.',
    detail: 'Pacote com hospedagem',
  },
];

export const faqItems = [
  {
    question: 'O grupo de WhatsApp e gratuito?',
    answer:
      'Sim. O grupo e gratuito e serve para acompanhar oportunidades selecionadas antes de planejar sua proxima viagem.',
  },
  {
    question: 'As promocoes tem disponibilidade garantida?',
    answer:
      'Nao. Tarifas promocionais mudam rapido. Os exemplos mostram ofertas ja encontradas, sem promessa de disponibilidade atual.',
  },
  {
    question: 'A Click To Fly tambem monta orcamento personalizado?',
    answer:
      'Sim. Pelo formulario de pre-planejamento, a equipe coleta origem, destino, datas, perfil dos viajantes e servicos desejados para buscar boas opcoes.',
  },
  {
    question: 'Voces ajudam com hospedagem e seguro viagem?',
    answer:
      'Pode. O formulario permite sinalizar hospedagem, transporte, passeios e seguro viagem para um atendimento mais completo.',
  },
  {
    question: 'Como entro em contato com a equipe?',
    answer:
      'Voce pode entrar pelo grupo de promocoes, chamar no WhatsApp pelo botao da pagina ou enviar o pre-planejamento de viagem pelo formulario.',
  },
];
