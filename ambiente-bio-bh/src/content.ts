export const assetUrl = (path: string) =>
  `${import.meta.env.BASE_URL}${path.replace(/^\/+/, "")}`;

export const contact = {
  phonePrimary: "(31) 3344-6600",
  phonePrimaryHref: "tel:+553133446600",
  phoneSecondary: "(31) 3296-8966",
  phoneSecondaryHref: "tel:+553132968966",
  email: "bh@orkin.com.br",
  address: "Rua Halley, 155, Santa Lúcia, Belo Horizonte — MG",
  whatsappPhone: "5531987930625",
} as const;

export const navigationItems = [
  { id: "servicos", href: "#servicos", label: "Soluções" },
  { id: "metodo", href: "#metodo", label: "Método" },
  { id: "setores", href: "#setores", label: "Atuação" },
  { id: "ocorrencias", href: "#ocorrencias", label: "Ocorrências" },
  { id: "duvidas", href: "#duvidas", label: "Dúvidas" },
] as const;

export const trustPoints = [
  {
    value: "Desde 1980",
    label: "experiência em controle de pragas",
  },
  {
    value: "Orkin desde 2014",
    label: "integração à Orkin",
  },
  {
    value: "Biólogos",
    label: "na coordenação técnica",
  },
] as const;

export const signals = [
  "Sinais recorrentes",
  "Danos em madeira",
  "Rastros ou fezes",
  "Atividade perto de ralos",
] as const;

export const solutions = [
  {
    number: "01",
    eyebrow: "Residencial",
    title: "Proteção técnica para a rotina da sua casa.",
    body: "Inspeção cuidadosa, orientação clara e tratamento proporcional ao risco, com atenção a crianças, pets e áreas de convivência.",
    imageBase: "assets/editorial/residencial-inspecao",
    alt: "Inspeção técnica cuidadosa em detalhe de uma residência.",
    features: [
      "Leitura dos sinais e pontos de acesso",
      "Orientação adequada à rotina do imóvel",
      "Acompanhamento conforme a resposta do ambiente",
    ],
  },
  {
    number: "02",
    eyebrow: "Empresas",
    title: "Controle que acompanha a sua operação.",
    body: "Planos para comércios, condomínios, alimentos, hotelaria, saúde e instituições, com monitoramento dos pontos críticos.",
    imageBase: "assets/editorial/comercial-inspecao",
    alt: "Inspeção técnica em equipamento de uma cozinha profissional.",
    features: [
      "Avaliação dos pontos críticos da operação",
      "Medidas compatíveis com o tipo de atividade",
      "Monitoramento e ajuste do plano",
    ],
  },
] as const;

export const specialties = [
  {
    title: "Anóxia para acervos",
    body: "Tratamento atóxico para peças e coleções sensíveis.",
  },
  {
    title: "VitalClean",
    body: "Sanitização profissional de superfícies e ambientes.",
  },
] as const;

export const aimProcess = [
  {
    number: "01",
    title: "Avaliar",
    body: "Identificamos sinais, acessos e condições que favorecem a ocorrência.",
  },
  {
    number: "02",
    title: "Implantar",
    body: "Aplicamos as medidas adequadas ao ambiente e à intensidade do risco.",
  },
  {
    number: "03",
    title: "Monitorar",
    body: "Acompanhamos a atividade e ajustamos o plano quando necessário.",
  },
] as const;

export const inspectionPoints = [
  {
    number: "01",
    title: "Sinais",
    body: "A atividade observada ajuda a dimensionar a necessidade.",
  },
  {
    number: "02",
    title: "Acessos",
    body: "Frestas, ralos e passagens entram na leitura do ambiente.",
  },
  {
    number: "03",
    title: "Condições",
    body: "Abrigo, umidade e rotina orientam a escolha das medidas.",
  },
] as const;

export const servedSegments = [
  {
    number: "01",
    title: "Residências e condomínios",
    body: "Casas, apartamentos, áreas comuns e espaços de convivência.",
  },
  {
    number: "02",
    title: "Empresas e comércios",
    body: "Operações que precisam conciliar controle e rotina de trabalho.",
  },
  {
    number: "03",
    title: "Alimentos e hospitalidade",
    body: "Cozinhas, restaurantes, hotéis e pontos críticos de operação.",
  },
  {
    number: "04",
    title: "Saúde e instituições",
    body: "Ambientes que exigem orientação e acompanhamento técnico.",
  },
  {
    number: "05",
    title: "Acervos e coleções",
    body: "Contextos sensíveis que podem demandar tratamento por anóxia.",
  },
] as const;

export type Pest = {
  id: string;
  title: string;
  image: string;
  alt: string;
  summary: string;
  signals: readonly string[];
};

export const pests = [
  {
    id: "baratas",
    title: "Baratas",
    image: "baratas.webp",
    alt: "Barata-americana vista de perto em uma superfície urbana.",
    summary:
      "A inspeção observa áreas úmidas, pontos de passagem e condições que mantêm a atividade.",
    signals: ["Áreas úmidas", "Frestas e ralos", "Atividade recorrente"],
  },
  {
    id: "cupins",
    title: "Cupins",
    image: "cupins.webp",
    alt: "Cupins subterrâneos em detalhe sobre uma peça de madeira.",
    summary:
      "Danos e resíduos em madeira ajudam a direcionar a avaliação da origem e da extensão do problema.",
    signals: ["Danos em madeira", "Resíduos próximos", "Portas e mobiliário"],
  },
  {
    id: "formigas",
    title: "Formigas",
    image: "formigas.webp",
    alt: "Formiga urbana preta fotografada em detalhe.",
    summary:
      "Trilhas recorrentes indicam rotas de entrada e pontos que merecem observação.",
    signals: ["Trilhas visíveis", "Frestas", "Fontes de alimento"],
  },
  {
    id: "mosquitos",
    title: "Mosquitos",
    image: "mosquitos.webp",
    alt: "Mosquito Aedes aegypti visto de perto em uma superfície neutra.",
    summary:
      "A avaliação considera água acumulada, áreas externas e pontos de reprodução no entorno.",
    signals: ["Água acumulada", "Áreas externas", "Atividade no entorno"],
  },
  {
    id: "roedores",
    title: "Roedores",
    image: "roedores.webp",
    alt: "Rato-marrom em um corredor urbano limpo.",
    summary:
      "Rastros, ruídos e acessos orientam a busca por abrigo e circulação.",
    signals: ["Rastros ou fezes", "Ruídos", "Pontos de acesso"],
  },
  {
    id: "escorpioes",
    title: "Escorpiões",
    image: "escorpioes.webp",
    alt: "Escorpião-amarelo visto de perto sobre uma superfície mineral.",
    summary:
      "Ralos, frestas e possíveis abrigos precisam ser avaliados com cuidado.",
    signals: ["Ralos", "Frestas", "Locais de abrigo"],
  },
] as const satisfies readonly Pest[];

export const faqItems = [
  {
    question: "Como começa uma avaliação?",
    answer:
      "A equipe começa entendendo o tipo de local e os sinais percebidos. Na avaliação técnica, observa acessos, condições do ambiente e intensidade da atividade antes de orientar as medidas.",
  },
  {
    question: "Vocês atendem residências e empresas?",
    answer:
      "Sim. O atendimento contempla residências, condomínios, empresas, comércios, alimentos, hotelaria, saúde, instituições e acervos, sempre considerando a rotina de cada ambiente.",
  },
  {
    question: "O que significa o método A.I.M.?",
    answer:
      "A.I.M. organiza o trabalho em três etapas: Avaliar o cenário, Implantar as medidas adequadas e Monitorar a resposta do ambiente para ajustar o plano quando necessário.",
  },
  {
    question: "O que são Anóxia e VitalClean?",
    answer:
      "Anóxia é uma opção de tratamento atóxico para peças e coleções sensíveis. VitalClean é o serviço de sanitização profissional de superfícies e ambientes.",
  },
  {
    question: "A solicitação pelo site já confirma uma visita?",
    answer:
      "Não. O formulário prepara a conversa no WhatsApp. A equipe confirma as informações, orienta os próximos passos e combina o atendimento quando necessário.",
  },
] as const;

export const placeTypes = [
  "Residência",
  "Condomínio",
  "Empresa ou comércio",
  "Alimentos e hospitalidade",
  "Acervo ou instituição",
  "Outro",
] as const;

export const preferredPeriods = [
  "Manhã",
  "Tarde",
  "Sem preferência",
] as const;

export function buildWhatsappUrl(
  placeType: string,
  problem: string,
  preferredDate = "",
  preferredPeriod = "",
) {
  const message = [
    "Olá, vim pelo site da Ambiente Orkin e gostaria de solicitar uma avaliação.",
    `Tipo de local: ${placeType}.`,
    `O que está acontecendo: ${problem.trim()}`,
  ];

  if (preferredDate) {
    const formattedDate = preferredDate.split("-").reverse().join("/");
    message.push(`Dia de preferência: ${formattedDate}.`);
  }

  if (preferredPeriod) {
    message.push(`Período de preferência: ${preferredPeriod}.`);
  }

  message.push("Sei que a preferência está sujeita à confirmação da equipe.");

  return `https://api.whatsapp.com/send?phone=${contact.whatsappPhone}&text=${encodeURIComponent(message.join("\n"))}`;
}
