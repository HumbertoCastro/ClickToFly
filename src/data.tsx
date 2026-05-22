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
  'Olá, Click To Fly! Quero receber promoções e planejar minha próxima viagem.';

export const navItems: NavItem[] = [
  { label: 'Início', href: '/#inicio' },
  { label: 'Destinos', href: '/#destinos' },
  { label: 'Promoções', href: '/#promocoes' },
  { label: 'Como funciona', href: '/#como-funciona' },
  { label: 'Orçamento', href: '/orcamento' },
  { label: 'Contato', href: '/#contato' },
];

export const stats = [
  { value: '+500', label: 'viajantes impactados', icon: <UsersRound /> },
  { value: '+R$ 300 mil', label: 'em economia estimada', icon: <CircleDollarSign /> },
  { value: 'Diário', label: 'ofertas monitoradas', icon: <Search /> },
  { value: 'Humano', label: 'atendimento personalizado', icon: <Handshake /> },
];

export const steps: IconCard[] = [
  {
    icon: <Search />,
    title: 'Rastreamos tarifas',
    description: 'Acompanhamos rotas, datas e oportunidades com alto potencial de economia.',
  },
  {
    icon: <BadgeCheck />,
    title: 'Filtramos oportunidades',
    description: 'Avaliamos regras, janela de compra e custo-benefício antes de divulgar.',
  },
  {
    icon: <MessageCircle />,
    title: 'Avisamos rápido',
    description: 'Enviamos oportunidades selecionadas no grupo de WhatsApp quando o timing importa.',
  },
  {
    icon: <CalendarCheck />,
    title: 'Montamos o pacote',
    description: 'Quando você decide viajar, transformamos a oportunidade em um plano personalizado.',
  },
];

export const clickAdvantages: IconCard[] = [
  {
    icon: <Search />,
    title: 'Monitoramento de tarifas',
    description: 'Acompanhamos rotas, datas e janelas de compra para encontrar oportunidades com bom custo-benefício.',
  },
  {
    icon: <BadgeCheck />,
    title: 'Curadoria antes do envio',
    description: 'Cada promoção passa por uma leitura de regras, disponibilidade e clareza antes de chegar até você.',
  },
  {
    icon: <MessageCircle />,
    title: 'Alerta rápido no WhatsApp',
    description: 'Quando uma oportunidade vale atenção, o grupo recebe um aviso objetivo para você decidir no timing certo.',
  },
  {
    icon: <CalendarCheck />,
    title: 'Pacote sob medida',
    description: 'Depois da promoção, a equipe pode montar uma cotação considerando datas, perfil e serviços adicionais.',
  },
  {
    icon: <HeartHandshake />,
    title: 'Atendimento humano',
    description: 'Você conversa com pessoas reais para tirar dúvidas e transformar interesse em decisão segura.',
  },
  {
    icon: <ShieldCheck />,
    title: 'Decisão transparente',
    description: 'As condições importantes ficam claras antes da contratação, sem promessa de disponibilidade permanente.',
  },
];

export const deals: Deal[] = [
  {
    origin: 'São Paulo',
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
    period: 'Março a Maio',
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
      'https://images.unsplash.com/photo-1510097467424-192d713fd8b2?auto=format&fit=crop&w=900&q=85',
    imageAlt: 'Praia caribenha com água cristalina',
  },
];

export const destinations: Destination[] = [
  {
    name: 'Paris',
    description: 'Romance, cultura e gastronomia',
    badge: 'Europa clássica',
    image:
      'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&w=1200&q=85',
    imageAlt: 'Torre Eiffel em Paris com céu iluminado',
    featured: true,
  },
  {
    name: 'Cancun',
    description: 'Praias, resorts e Caribe',
    badge: 'Caribe',
    image:
      'https://images.unsplash.com/photo-1510097467424-192d713fd8b2?auto=format&fit=crop&w=900&q=85',
    imageAlt: 'Praia caribenha com água cristalina',
  },
  {
    name: 'Lisboa',
    description: 'História, conexão e ótimo custo-benefício',
    badge: 'Portugal',
    image:
      'https://images.unsplash.com/photo-1555881400-74d7acaacd8b?auto=format&fit=crop&w=900&q=85',
    imageAlt: 'Ruas e prédios coloridos em Lisboa',
  },
  {
    name: 'Bariloche',
    description: 'Frio, montanhas e experiências únicas',
    badge: 'Patagonia',
    image:
      'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=900&q=85',
    imageAlt: 'Montanhas nevadas ao entardecer',
  },
  {
    name: 'Fernando de Noronha',
    description: 'Natureza, praia e exclusividade',
    badge: 'Brasil premium',
    image:
      'https://images.unsplash.com/photo-1516306580123-e6e52b1b7b5f?auto=format&fit=crop&w=900&q=85',
    imageAlt: 'Litoral brasileiro com mar azul e montanhas',
  },
];

export const whatsappBenefits = [
  { icon: <BellRing />, text: 'Ofertas enviadas rapidamente' },
  { icon: <TicketPercent />, text: 'Curadoria de promoções relevantes' },
  { icon: <Globe2 />, text: 'Oportunidades nacionais e internacionais' },
  { icon: <Sparkles />, text: 'Acesso simples e gratuito' },
  { icon: <ShieldCheck />, text: 'Sem spam, apenas oportunidades selecionadas' },
];

export const trustCards: IconCard[] = [
  {
    icon: <HeartHandshake />,
    title: 'Atendimento humano',
    description: 'Você conversa com pessoas reais durante o planejamento.',
  },
  {
    icon: <LockKeyhole />,
    title: 'Transparência',
    description: 'As condições são explicadas com clareza antes da contratação.',
  },
  {
    icon: <BadgeCheck />,
    title: 'Curadoria especializada',
    description: 'As oportunidades são avaliadas antes de serem divulgadas.',
  },
  {
    icon: <MapPinned />,
    title: 'Planejamento personalizado',
    description: 'A equipe considera datas, destino, orçamento e preferências.',
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
      'Gostei da clareza nas regras e da rapidez para comparar datas próximas antes de decidir.',
    name: 'Rafael M.',
    detail: 'Férias em família',
  },
  {
    quote:
      'O grupo é objetivo. Quando apareceu uma promoção boa, a equipe transformou a ideia em orçamento.',
    name: 'Camila S.',
    detail: 'Pacote com hospedagem',
  },
];

export const faqItems = [
  {
    question: 'O grupo de WhatsApp é gratuito?',
    answer:
      'Sim. O grupo é gratuito e serve para acompanhar oportunidades selecionadas antes de planejar sua próxima viagem.',
  },
  {
    question: 'As promoções têm disponibilidade garantida?',
    answer:
      'Não. Tarifas promocionais mudam rápido. Os exemplos mostram ofertas já encontradas, sem promessa de disponibilidade atual.',
  },
  {
    question: 'A Click To Fly também monta orçamento personalizado?',
    answer:
      'Sim. Pelo formulário de pré-planejamento, a equipe coleta origem, destino, datas, perfil dos viajantes e serviços desejados para buscar boas opções.',
  },
  {
    question: 'Vocês ajudam com hospedagem e seguro viagem?',
    answer:
      'Pode. O formulário permite sinalizar hospedagem, transporte, passeios e seguro viagem para um atendimento mais completo.',
  },
  {
    question: 'Como entro em contato com a equipe?',
    answer:
      'Você pode entrar pelo grupo de promoções, chamar no WhatsApp pelo botão da página ou enviar o pré-planejamento de viagem pelo formulário.',
  },
];
