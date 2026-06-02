import { toAssetUrl } from "@/lib/routing";

export type BookPillar = {
  id: string;
  title: string;
  promise: string;
  description: string;
};

export type VideoAsset = {
  id: string;
  title: string;
  description: string;
  src: string;
  poster: string;
};

export type OfferData = {
  title: string;
  subtitle: string;
  originalPrice: string;
  price: string;
  installments: string;
  guarantee: string;
  access: string;
  checkoutUrl: string;
};

export type RouteMeta = {
  path: string;
  title: string;
  description: string;
};

export type SocialLink = {
  label: string;
  href: string;
};

export const offer: OfferData = {
  title: "LifeForce 360º | Código do Guerreiro DGΔD",
  subtitle:
    "Um ecossistema prático para organizar saúde, família, finanças, trabalho, espiritualidade e tempo através do Delta Positivo.",
  originalPrice: "R$ 197,00",
  price: "R$ 59,90",
  installments: "Acesso imediato ao pacote completo",
  guarantee: "Garantia incondicional de 7 dias",
  access: "Pagamento seguro com acesso imediato",
  checkoutUrl: "https://pay.hotmart.com/Q104186091H?off=684mmg8i&hotfeature=51",
};

export const navItems = [
  { label: "Método", href: "/#metodo" },
  { label: "Livros", href: "/#livros" },
  { label: "Oferta", href: "/#oferta" },
  { label: "Criador", href: "/criador" },
  { label: "Sobre", href: "/sobre" },
];

export const socialLinks: SocialLink[] = [
  { label: "Instagram", href: "https://www.instagram.com/lifeforce360oficial/" },
  { label: "TikTok", href: "https://www.tiktok.com/@lifeforce.360?_r=1&_t=ZS-968ITQytLiG" },
  { label: "WhatsApp", href: "https://wa.me/5511999739131" },
];

export const mediaAssets = {
  heroDesktop: toAssetUrl("/assets/generated/dgad-hero-premium-desktop.webp"),
  heroMobile: toAssetUrl("/assets/generated/dgad-hero-premium-mobile.webp"),
  productBundle: toAssetUrl("/assets/generated/dgad-product-bundle-v2.webp"),
  finalCta: toAssetUrl("/assets/generated/dgad-final-cta-v2.webp"),
  ebookCover: toAssetUrl("/assets/optimized/dgad-book-cover-carousel.webp"),
  productFallback: toAssetUrl("/assets/optimized/dgad-capas.webp"),
  deltaMark: toAssetUrl("/assets/optimized/dgad-delta-warrior.webp"),
  creator: {
    portrait: toAssetUrl("/assets/paulo-matos.webp"),
    casual: toAssetUrl("/assets/paulo-casual.webp"),
    family: toAssetUrl("/assets/paulo-family.webp"),
    video: toAssetUrl("/assets/paulo-life-force-360.mp4"),
    videoPoster: toAssetUrl("/assets/paulo-matos.webp"),
    discipline: toAssetUrl("/assets/dgad-warrior-cover.jpeg"),
    project: toAssetUrl("/assets/guerreiro-dgad.jpeg"),
  },
  benefits: {
    saude: toAssetUrl("/assets/optimized/benefit-saude.webp"),
    familia: toAssetUrl("/assets/optimized/benefit-familia.webp"),
    espiritualidade: toAssetUrl("/assets/optimized/benefit-espiritualidade.webp"),
    financas: toAssetUrl("/assets/optimized/benefit-financas.webp"),
    trabalho: toAssetUrl("/assets/optimized/benefit-trabalho.webp"),
    rotina: toAssetUrl("/assets/optimized/benefit-rotina.webp"),
    disciplina: toAssetUrl("/assets/optimized/benefit-disciplina.webp"),
  },
} as const;

export const routeMeta: RouteMeta[] = [
  {
    path: "/",
    title: "LifeForce 360º | Código do Guerreiro DGΔD",
    description:
      "Landing page oficial do LifeForce 360º e Código do Guerreiro DGΔD: método prático para transformar disciplina em resultado real.",
  },
  {
    path: "/codigo-completo",
    title: "O Código Completo | DGAD LifeForce 360º",
    description:
      "Oferta oficial do DGAD LifeForce 360º com acesso imediato, garantia de 7 dias e checkout Hotmart.",
  },
  {
    path: "/sobre",
    title: "Sobre o DGAD | Disciplina Gera Destino",
    description:
      "Conheça a origem do DGAD, Paulo Matos e os pilares do ecossistema LifeForce 360º.",
  },
  {
    path: "/criador",
    title: "Paulo Matos | Criador do LifeForce 360º",
    description:
      "Conheça Paulo Matos, criador do DGAD e do LifeForce 360º, e assista ao vídeo sobre a origem do projeto.",
  },
  {
    path: "/politica-de-privacidade",
    title: "Política de Privacidade | DGAD",
    description: "Como o DGAD coleta, utiliza e protege dados pessoais.",
  },
  {
    path: "/pagamento-e-reembolso",
    title: "Pagamento e Reembolso | DGAD",
    description: "Informações sobre pagamento, acesso, produto digital e reembolso do DGAD.",
  },
];

export const pillars: BookPillar[] = [
  {
    id: "saude",
    title: "Saúde",
    promise: "O corpo sustenta energia, presença e execução.",
    description:
      "Energia, rotina e presença física para sustentar decisões difíceis sem depender de motivação momentânea.",
  },
  {
    id: "familia",
    title: "Família",
    promise: "Presença e prioridade antes da pressa.",
    description:
      "Organização da vida pessoal para que responsabilidade, presença e exemplo não fiquem em segundo plano.",
  },
  {
    id: "financas",
    title: "Finanças",
    promise: "Cada real vira decisão, voto e direção.",
    description:
      "Disciplina aplicada a escolhas, prioridades e gestão prática dos recursos que sustentam liberdade real.",
  },
  {
    id: "trabalho",
    title: "Trabalho",
    promise: "Competência construída por repetição.",
    description:
      "Clareza para agir com consistência, melhorar desempenho e sair do ciclo de intenção sem entrega.",
  },
  {
    id: "espiritualidade",
    title: "Espiritualidade",
    promise: "Propósito como norte das escolhas.",
    description:
      "Uma estrutura para alinhar decisões, valores e responsabilidade antes que a pressão externa decida por você.",
  },
  {
    id: "tempo",
    title: "Tempo / Agenda",
    promise: "O calendário protege o que importa.",
    description:
      "Ritmo, agenda, descanso e reposição de energia tratados como parte do sistema, não como prêmio eventual.",
  },
];

export const videos: VideoAsset[] = [
  {
    id: "prova-codigo",
    title: "Prova do Código",
    description: "Material em vídeo do projeto DGAD, preservado da página atual.",
    src: "https://bestbuy-topproducts.com/wp-content/uploads/2026/05/PROVA_CODIGO_01-3.mp4",
    poster: toAssetUrl("/assets/dgad-proof-01.jpeg"),
  },
  {
    id: "vt-03",
    title: "Disciplina aplicada",
    description: "Vídeo de apoio usado na comunicação do LifeForce 360°.",
    src: "https://bestbuy-topproducts.com/wp-content/uploads/2026/05/VT_03-3.mp4",
    poster: toAssetUrl("/assets/dgad-proof-02.jpeg"),
  },
  {
    id: "vt-04",
    title: "Decisão e rotina",
    description: "Peça audiovisual do DGAD integrada ao novo fluxo de venda.",
    src: "https://bestbuy-topproducts.com/wp-content/uploads/2026/05/VT_04-3.mp4",
    poster: toAssetUrl("/assets/dgad-proof-03.jpeg"),
  },
  {
    id: "codigo-02",
    title: "O Código Completo",
    description: "Vídeo complementar para apresentar o método ao visitante.",
    src: "https://bestbuy-topproducts.com/wp-content/uploads/2026/05/CODIGO_02-4.mp4",
    poster: toAssetUrl("/assets/guerreiro-dgad.jpeg"),
  },
];

export const stickyChapters = [
  {
    title: "Motivação falha.",
    text: "Ela aparece, some e deixa a rotina desprotegida. O DGAD começa onde a vontade termina.",
  },
  {
    title: "Disciplina decide.",
    text: "A repetição certa cria clareza. Pequenas evoluções constantes mudam o destino ao longo do tempo.",
  },
  {
    title: "Responsabilidade comanda.",
    text: "O método organiza saúde, família, trabalho, finanças, espiritualidade, descanso e governo próprio.",
  },
  {
    title: "O código é aplicado.",
    text: "Não é mais um conteúdo motivacional. É uma estrutura prática para direção, rotina e execução.",
  },
];

export const privacySections = [
  {
    title: "1. Coleta de informações",
    body: "Podemos coletar informações fornecidas pelo próprio usuário, como nome, telefone, e-mail e mensagens enviadas por formulários, WhatsApp ou outros canais de contato. Também podemos coletar dados de navegação, como endereço IP, páginas acessadas, dispositivo utilizado e interações com anúncios, por meio de ferramentas como Pixel da Meta e cookies.",
  },
  {
    title: "2. Uso das informações",
    body: "As informações coletadas podem ser utilizadas para entrar em contato com o usuário, enviar informações sobre o produto ou serviço, melhorar a experiência no site, medir resultados de campanhas de anúncios e realizar atendimento e suporte.",
  },
  {
    title: "3. Compartilhamento de dados",
    body: "Não vendemos dados pessoais. As informações podem ser compartilhadas apenas com ferramentas necessárias para funcionamento do site, atendimento, pagamento, análise de dados e campanhas de marketing.",
  },
  {
    title: "4. Cookies e tecnologias de rastreamento",
    body: "Este site pode utilizar cookies, Pixel da Meta e outras tecnologias para entender o comportamento dos visitantes e melhorar a comunicação dos anúncios. O usuário pode configurar seu navegador para bloquear cookies, caso deseje.",
  },
  {
    title: "5. Segurança dos dados",
    body: "Adotamos medidas razoáveis para proteger as informações coletadas contra acesso não autorizado, alteração, divulgação ou destruição.",
  },
  {
    title: "6. Direitos do usuário",
    body: "De acordo com a Lei Geral de Proteção de Dados (LGPD), o usuário pode solicitar acesso, correção ou exclusão de seus dados pessoais. A LGPD regula o tratamento de dados pessoais no Brasil e protege direitos de liberdade e privacidade dos titulares.",
  },
  {
    title: "7. Contato",
    body: "Para dúvidas, solicitações ou remoção de dados, entre em contato pelo WhatsApp: +55 11 99973-9131.",
  },
  {
    title: "8. Alterações nesta política",
    body: "Esta Política de Privacidade pode ser atualizada a qualquer momento, sem aviso prévio. Última atualização: 07/05/2026.",
  },
];

export const refundSections = [
  {
    title: "1. Forma de pagamento",
    body: "Os pagamentos podem ser realizados por cartão de crédito, Pix, boleto bancário ou outros métodos disponibilizados na plataforma de checkout. Todas as transações são processadas em ambiente seguro.",
  },
  {
    title: "2. Liberação de acesso",
    body: "Após a confirmação do pagamento, o acesso ao conteúdo digital será enviado automaticamente ou disponibilizado conforme orientação informada no momento da compra. O prazo pode variar de acordo com o método de pagamento utilizado.",
  },
  {
    title: "3. Produto digital",
    body: "Ao realizar a compra, o cliente declara estar ciente de que se trata de um produto digital, sem entrega física.",
  },
  {
    title: "4. Reembolso",
    body: "Pedidos de reembolso poderão ser solicitados conforme as regras da plataforma de pagamento utilizada e legislação vigente. Caso o cliente tenha dificuldades de acesso ou qualquer problema relacionado à compra, recomendamos entrar em contato antes de solicitar cancelamentos.",
  },
  {
    title: "5. Suporte",
    body: "Em caso de dúvidas sobre pagamento, acesso ou suporte: WhatsApp: +55 11 99973-9131.",
  },
  {
    title: "6. Alterações",
    body: "Esta política pode ser alterada a qualquer momento para atualização de informações ou adequação legal. Última atualização: 07/05/2026.",
  },
];

export const contactInfo = {
  whatsapp: "+55 11 99973-9131",
  email: "LifeForce360oficial@gmail.com",
  address: "Rua Liguria, 200, Bandeirantes - Pampulha, Belo Horizonte - MG, CEP: 31340-360, Brasil",
};
