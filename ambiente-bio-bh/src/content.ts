export const assetUrl = (path: string) =>
  `${import.meta.env.BASE_URL}${path.replace(/^\/+/, "")}`;

export const whatsappUrl =
  "https://api.whatsapp.com/send?phone=5531987930625&text=Ol%C3%A1%2C%20vim%20pela%20landing%20page%20da%20Ambiente%20Bio%20BH%20e%20gostaria%20de%20agendar%20uma%20visita.";

export const phonePrimary = "(31) 3344-6600";
export const phoneSecondary = "(31) 3296-8966";
export const email = "bh@orkin.com.br";
export const address = "Rua Halley, 155, Santa Lucia, Belo Horizonte - MG";

export const services = [
  {
    title: "Controle residencial",
    body: "Diagnóstico em casas e apartamentos, com orientação para reduzir abrigo, acesso e alimento das pragas.",
    tag: "Casa protegida",
  },
  {
    title: "Controle comercial",
    body: "Planos para alimentos, saúde, hotelaria, varejo, escritório, educação e indústria.",
    tag: "Operação segura",
  },
  {
    title: "MIP, Avaliar, Implantar e Monitorar",
    body: "Programa de manejo integrado para tratar a causa, acompanhar sinais e prevenir retorno.",
    tag: "Método técnico",
  },
  {
    title: "Anóxia para acervos",
    body: "Alternativa atóxica para bibliotecas, museus, igrejas, arquivos e galerias com risco de cupins e brocas.",
    tag: "Acervo preservado",
  },
  {
    title: "VitalClean",
    body: "Sanitização e desinfecção profissional para superfícies de uso comercial e institucional.",
    tag: "Ambiente higienizado",
  },
];

export const riskPlans = [
  {
    eyebrow: "Risco operacional",
    title: "Cozinha, estoque e areas tecnicas sem pontos cegos.",
    body: "A vistoria percorre rodapes, equipamentos, ralos, frestas e pontos de calor para encontrar acesso, abrigo e alimento antes que a praga apareca no salao.",
    detail: "Plano indicado para restaurantes, cozinhas industriais, hotelaria e alimentos e bebidas.",
    image: assetUrl("/assets/plano-risco-cozinha-inspecao.png"),
    imagePosition: "55% 50%",
    alt: "Tecnico Orkin inspecionando equipamento de cozinha profissional.",
  },
  {
    eyebrow: "Leitura tecnica",
    title: "Checklist claro para transformar visita em plano de acao.",
    body: "Cada inspecao registra areas avaliadas, armadilhas, pontos criticos, condicoes estruturais, higiene, armazenamento e residuos. O responsavel entende o que foi visto e o que precisa mudar.",
    detail: "Relatorio objetivo para acompanhar evolucao, recorrencia e prioridade de correcao.",
    image: assetUrl("/assets/plano-risco-checklist.png"),
    imagePosition: "52% 50%",
    alt: "Tablet com checklist de inspecao Ambiente Orkin em cozinha profissional.",
  },
  {
    eyebrow: "Comunicacao direta",
    title: "O plano e explicado para quem decide no local.",
    body: "A equipe adapta a linguagem para residencia, condominio ou empresa, alinhando risco, prazo, cuidado com pessoas e rotina do ambiente atendido.",
    detail: "Menos improviso no dia da aplicacao e mais previsibilidade para o cliente.",
    image: assetUrl("/assets/plano-risco-visita.png"),
    imagePosition: "50% 45%",
    alt: "Tecnico Orkin cumprimentando cliente durante visita tecnica.",
  },
  {
    eyebrow: "Protecao residencial",
    title: "Casa protegida com prevencao, nao so resposta emergencial.",
    body: "Em residencias, o plano combina orientacao de acesso, abrigo e alimento com intervencoes proporcionais ao risco, preservando rotina, criancas, pets e areas de convivencia.",
    detail: "Ideal para quintais, caixas, ralos, frestas, areas umidas e pontos de entrada.",
    image: assetUrl("/assets/plano-risco-residencial.png"),
    imagePosition: "50% 42%",
    alt: "Profissional Orkin em area residencial externa.",
  },
  {
    eyebrow: "Monitoramento",
    title: "Evidencia no ponto certo para decidir o proximo passo.",
    body: "Armadilhas, capturas e sinais sao lidos como indicadores do plano. A equipe ajusta a estrategia conforme atividade, acesso e reincidencia observada.",
    detail: "Acompanhamento util para baratas, roedores e outras pragas de alta recorrencia.",
    image: assetUrl("/assets/plano-risco-monitoramento.png"),
    imagePosition: "49% 50%",
    alt: "Tecnico coletando inseto proximo a armadilha de monitoramento.",
  },
] as const;

export const pests = [
  {
    id: "mosquitos",
    title: "Mosquitos",
    image: assetUrl("/assets/pests/mosquitos.png"),
    alt: "Ilustracao monocromatica de mosquito",
    description:
      "Dipteros com um par de asas, pernas longas e proboscide; adultos variam de 3 a 9 mm.",
  },
  {
    id: "cupins",
    title: "Cupins",
    image: assetUrl("/assets/pests/cupins.png"),
    alt: "Ilustracao monocromatica de cupim",
    description:
      "Insetos sociais em colonias e castas; poucas especies viram pragas, mas podem atacar madeira.",
  },
  {
    id: "formigas",
    title: "Formigas",
    image: assetUrl("/assets/pests/formigas.png"),
    alt: "Ilustracao monocromatica de formiga",
    description:
      "Algumas especies picam ou mordem e podem causar dor, febre, sangramento e reacoes alergicas.",
  },
  {
    id: "roedores",
    title: "Roedores",
    image: assetUrl("/assets/pests/roedores.png"),
    alt: "Ilustracao monocromatica de roedor",
    description:
      "Mamiferos sinantropicos de habitos noturnos, alta reproducao e grande adaptacao ao ambiente urbano.",
  },
  {
    id: "baratas",
    title: "Baratas",
    image: assetUrl("/assets/pests/baratas.png"),
    alt: "Ilustracao monocromatica de barata",
    description:
      "Insetos resistentes e adaptaveis; as especies urbanas mais comuns incluem a americana e a germanica.",
  },
  {
    id: "escorpioes",
    title: "Escorpiões",
    image: assetUrl("/assets/pests/escorpioes.png"),
    alt: "Ilustracao monocromatica de escorpiao",
    description:
      "Predadores peconhentos com ferrao na cauda; acidentes exigem atencao pela frequencia e pelo risco.",
  },
  {
    id: "aranhas",
    title: "Aranhas",
    image: assetUrl("/assets/pests/aranhas.png"),
    alt: "Ilustracao monocromatica de aranha",
    description:
      "Aracnideos de oito patas, sem asas nem antenas; podem ocupar areas umidas, secas, quentes e escuras.",
  },
  {
    id: "moscas",
    title: "Moscas",
    image: assetUrl("/assets/pests/moscas.png"),
    alt: "Ilustracao monocromatica de mosca",
    description:
      "Adultas costumam ter brilho metalico e pecas bucais esponjosas; larvas usam estruturas em forma de gancho.",
  },
  {
    id: "vespas",
    title: "Vespas, abelhas e marimbondos",
    image: assetUrl("/assets/pests/vespas-abelhas-marimbondos.png"),
    alt: "Ilustracao monocromatica de vespa, abelha e marimbondo",
    description:
      "Vespas, abelhas e marimbondos podem causar dor, inchaco e reacoes graves; colonias pedem remocao segura.",
  },
] as const;

export type Pest = (typeof pests)[number];
export type PestId = Pest["id"];

export const sectors = [
  "Residências",
  "Condomínios",
  "Alimentos e bebidas",
  "Restaurantes",
  "Hotelaria",
  "Saúde",
  "Farmacêuticas",
  "Escritórios",
  "Varejo",
  "Educação",
];

export const process = [
  {
    step: "Avaliar",
    body: "O especialista inspeciona o imóvel, identifica sinais e recomenda medidas físicas ou educacionais para reduzir risco.",
  },
  {
    step: "Implantar",
    body: "A equipe aplica técnicas e ferramentas adequadas ao ambiente, tratando a ocorrência sem perder de vista a prevenção.",
  },
  {
    step: "Monitorar",
    body: "O acompanhamento registra progresso, observa novos sinais e ajusta o plano para manter o controle ativo.",
  },
];
