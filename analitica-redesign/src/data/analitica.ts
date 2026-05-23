import type { LucideIcon } from "lucide-react";
import {
  Award,
  Beaker,
  Boxes,
  ClipboardCheck,
  Factory,
  FileCheck2,
  Filter,
  FlaskConical,
  Gauge,
  MapPinned,
  Microscope,
  PackageCheck,
  Scale,
  ShieldCheck,
  Truck,
  Users,
} from "lucide-react";
import { assetPath } from "../lib/navigation";

export const contact = {
  phone: "(31) 3481-2155",
  phoneHref: "tel:+553134812155",
  whatsapp: "(31) 99185-0284",
  email: "vendas@analiticalabor.com.br",
  emailHref: "mailto:vendas@analiticalabor.com.br",
  qualityEmail: "qualidade@analiticalabor.com.br",
  qualityEmailHref: "mailto:qualidade@analiticalabor.com.br",
  address: "Rua Couto Magalhães, 426 - Bairro Paraíso - Belo Horizonte/MG",
  mapsHref:
    "https://www.google.com/maps/search/?api=1&query=Rua%20Couto%20Magalhaes%20426%20Paraiso%20Belo%20Horizonte%20MG",
  mapsEmbedSrc:
    "https://www.google.com/maps?q=Rua%20Couto%20Magalhaes%20426%20Paraiso%20Belo%20Horizonte%20MG&output=embed",
  instagram: "https://www.instagram.com/analiticalabor/",
  linkedin:
    "https://www.linkedin.com/company/anal%C3%ADtica-equipamentos-e-suprimentos-para-an%C3%A1lise-laboratoriais/",
};

export const navItems = [
  { label: "Quem somos", href: "/quem-somos" },
  { label: "Produtos", href: "/produtos" },
  { label: "Controlados", href: "/produtos-quimicos-controlados" },
  { label: "Fique por dentro", href: "/fique-por-dentro" },
  { label: "Contato", href: "/contato" },
  { label: "Orçamento", href: "/orcamento" },
];

export const heroStats = [
  { value: "1989", label: "fundação da Analítica" },
  { value: "ISO 9001:2015", label: "ABNT Certificadora - OCS 005" },
  { value: "Brasil", label: "atendimento em território nacional" },
];

export const heroCarouselItems = [
  {
    title: "Reagentes e suprimentos",
    description: "Material para laboratório químico e microbiológico.",
    image: assetPath("/assets/site-laboratorio-hero.png"),
  },
  {
    title: "Thermo/Oxoid",
    description: "Meios de cultura e microbiologia manual.",
    image: assetPath("/assets/site-produto-meios-cultura.jpg"),
  },
  {
    title: "Produtos controlados",
    description: "Controle documental para PF, Exército e Polícia Civil.",
    image: assetPath("/assets/site-controlados.jpg"),
  },
  {
    title: "Specsol",
    description: "Reagentes e padrões para laboratório.",
    image: assetPath("/assets/site-produto-specsol.jpg"),
  },
  {
    title: "Axygen",
    description: "Plásticos de alta qualidade para rotinas laboratoriais.",
    image: assetPath("/assets/site-produto-axygen.jpg"),
  },
  {
    title: "Hydranal",
    description: "Produtos químicos para Karl Fischer.",
    image: assetPath("/assets/site-produto-hydranal.png"),
  },
];

export type Solution = {
  title: string;
  description: string;
  details: string;
  image: string;
  icon: LucideIcon;
};

export const solutions: Solution[] = [
  {
    title: "Reagentes P.A. e HPLC",
    description: "Reagentes P.A. Merck e QM, solventes HPLC, padrões e soluções prontas.",
    details: "Baseado nas linhas Merck, Química Moderna e Specsol apresentadas no portfólio.",
    image: assetPath("/assets/site-produto-specsol.jpg"),
    icon: FlaskConical,
  },
  {
    title: "Microbiologia Thermo/Oxoid",
    description: "Meios de cultura, cepas, Quanti-Cult, Culti-Loops e RapiD System.",
    details: "A Thermo/Oxoid atende rotinas clínicas, farmacêuticas, alimentícias e ambientais.",
    image: assetPath("/assets/site-produto-meios-cultura.jpg"),
    icon: Microscope,
  },
  {
    title: "Vidrarias e volumetria",
    description: "Vidrarias PYREX e vidrarias volumétricas com certificação 17025.",
    details: "Conteúdo incorporado da página Quem somos e da linha Pyrex.",
    image: assetPath("/assets/marca-pyrex.png"),
    icon: Beaker,
  },
  {
    title: "Filtração e preparo de amostras",
    description: "Filtros de seringa, membranas PVDF, celulose regenerada, PTFE e nylon.",
    details: "Linhas GVS citadas no portfólio institucional da Analítica.",
    image: assetPath("/assets/produto-filtros-seringa.jpg"),
    icon: Filter,
  },
  {
    title: "Produtos químicos controlados",
    description: "Substâncias controladas por Polícia Federal, Exército e Polícia Civil.",
    details: "Venda consultiva com rigor no repasse a terceiros habilitados.",
    image: assetPath("/assets/site-controlados.jpg"),
    icon: ShieldCheck,
  },
  {
    title: "Mineração e siderurgia",
    description: "Reagentes, ácidos especiais, padrões AAS, ICP e Titrisol.",
    details: "Segmento destacado na home original da Analítica.",
    image: assetPath("/assets/site-blog-siderurgia.png"),
    icon: Factory,
  },
];

export type Product = {
  name: string;
  category: string;
  description: string;
  image: string;
  message: string;
  sourcePath: string;
};

export const featuredProducts: Product[] = [
  {
    name: "Thermo/Oxoid",
    category: "Microbiologia",
    description:
      "Meios de cultura, Culti-Loops, Quanti-Cult Plus, discos para TSA/AST e identificação RapiD.",
    image: assetPath("/assets/marca-thermo.png"),
    message: "Olá, equipe Analítica. Gostaria de cotar produtos Thermo/Oxoid.",
    sourcePath: "/produto/thermo-scientific/",
  },
  {
    name: "Merck",
    category: "Reagentes e HPLC",
    description:
      "Reagentes P.A., solventes LiChrosolv, colunas, filtros, membranas e padrões para análises.",
    image: assetPath("/assets/marca-merck.png"),
    message: "Olá, equipe Analítica. Gostaria de cotar produtos Merck.",
    sourcePath: "/produto/merck/",
  },
  {
    name: "Química Moderna",
    category: "Reagentes P.A.",
    description: "Linha de reagentes P.A. e papéis de filtro para rotinas de laboratório.",
    image: assetPath("/assets/marca-qm.png"),
    message: "Olá, equipe Analítica. Gostaria de cotar produtos Química Moderna.",
    sourcePath: "/produto/quimica-moderna/",
  },
  {
    name: "Pyrex",
    category: "Vidraria",
    description:
      "Vidrarias PYREX e volumetria com possibilidade de certificado de calibração 17025.",
    image: assetPath("/assets/marca-pyrex.png"),
    message: "Olá, equipe Analítica. Gostaria de cotar vidrarias Pyrex.",
    sourcePath: "/produto/pyrex/",
  },
  {
    name: "Corning",
    category: "Plástico e laboratório",
    description:
      "Produtos para laboratório das marcas Corning e Axygen, incluindo placas, ponteiras e microtubos.",
    image: assetPath("/assets/marca-corning.png"),
    message: "Olá, equipe Analítica. Gostaria de cotar produtos Corning.",
    sourcePath: "/produto/corning/",
  },
  {
    name: "Axygen",
    category: "Plásticos",
    description:
      "Ponteiras, microtubos, microtubos para PCR, placas e microplacas para PCR.",
    image: assetPath("/assets/marca-axygen.png"),
    message: "Olá, equipe Analítica. Gostaria de cotar produtos Axygen.",
    sourcePath: "/produto/axygen/",
  },
  {
    name: "HTL",
    category: "Micropipetas",
    description: "Micropipetas e instrumentos para rotina laboratorial.",
    image: assetPath("/assets/marca-htl.png"),
    message: "Olá, equipe Analítica. Gostaria de cotar produtos HTL.",
    sourcePath: "/produto/htl/",
  },
  {
    name: "Incoterm",
    category: "Medição",
    description:
      "Termômetros, termo-higrômetros, densímetros, data loggers, pHmetros e multímetros.",
    image: assetPath("/assets/marca-incoterm.png"),
    message: "Olá, equipe Analítica. Gostaria de cotar produtos Incoterm.",
    sourcePath: "/produto/incoterm/",
  },
  {
    name: "J. Prolab",
    category: "Consumíveis",
    description: "Consumíveis, porcelanas, papéis filtrantes, placas de petri e acessórios.",
    image: assetPath("/assets/marca-jprolab.png"),
    message: "Olá, equipe Analítica. Gostaria de cotar produtos J. Prolab.",
    sourcePath: "/produto/j-prolab/",
  },
  {
    name: "Specsol",
    category: "Padrões",
    description:
      "Reagentes, padrões AAS, padrões ICP, MRC, soluções de pH, condutividade e turbidez.",
    image: assetPath("/assets/marca-specsol.png"),
    message: "Olá, equipe Analítica. Gostaria de cotar produtos Specsol.",
    sourcePath: "/produto/specsol/",
  },
  {
    name: "Metalic",
    category: "Laboratório",
    description: "Linha de produtos e acessórios para rotinas laboratoriais.",
    image: assetPath("/assets/marca-metalic.png"),
    message: "Olá, equipe Analítica. Gostaria de cotar produtos Metalic.",
    sourcePath: "/produto/metalic/",
  },
  {
    name: "Nasco",
    category: "Amostragem",
    description: "Produtos para coleta, amostragem e aplicações laboratoriais.",
    image: assetPath("/assets/marca-nasco.png"),
    message: "Olá, equipe Analítica. Gostaria de cotar produtos Nasco.",
    sourcePath: "/produto/nasco/",
  },
  {
    name: "RapiD System",
    category: "Identificação microbiana",
    description: "Identificação por provas bioquímicas com leitura de resultado em 4 horas.",
    image: assetPath("/assets/marca-thermo-rapid.jpg"),
    message: "Olá, equipe Analítica. Gostaria de cotar RapiD System.",
    sourcePath: "/produto/thermo-scientific-rapid/",
  },
  {
    name: "Permution",
    category: "Tratamento de água",
    description: "Produtos para tratamento de água e aplicações relacionadas.",
    image: assetPath("/assets/marca-permution.png"),
    message: "Olá, equipe Analítica. Gostaria de cotar produtos Permution.",
    sourcePath: "/produto/permution/",
  },
  {
    name: "Chiarotti",
    category: "Laboratório",
    description: "Produtos e acessórios laboratoriais para rotinas técnicas.",
    image: assetPath("/assets/marca-chiarotti.png"),
    message: "Olá, equipe Analítica. Gostaria de cotar produtos Chiarotti.",
    sourcePath: "/produto/chiarotti/",
  },
  {
    name: "Culti-Loops",
    category: "Cepas ATCC",
    description:
      "Loops bacteriológicos descartáveis, prontos para uso, com microrganismos viáveis.",
    image: assetPath("/assets/marca-thermo-culti.jpg"),
    message: "Olá, equipe Analítica. Gostaria de cotar Culti-Loops.",
    sourcePath: "/produto/thermo-scientific-2/",
  },
  {
    name: "Ohaus",
    category: "Balanças",
    description: "Balanças e equipamentos para medição em laboratório.",
    image: assetPath("/assets/marca-ohaus.png"),
    message: "Olá, equipe Analítica. Gostaria de cotar balanças Ohaus.",
    sourcePath: "/produto/balancas-ohaus/",
  },
  {
    name: "Hydranal",
    category: "Karl Fischer",
    description:
      "Reagentes, padrões e solventes para determinação do teor de água em amostras.",
    image: assetPath("/assets/marca-thermo.png"),
    message: "Olá, equipe Analítica. Gostaria de cotar produtos Hydranal.",
    sourcePath: "/produto/hydranal/",
  },
  {
    name: "Quanti-Cult Plus",
    category: "Cepas ATCC",
    description:
      "Microrganismos viáveis derivados de culturas ATCC autênticas, prontos para reidratar.",
    image: assetPath("/assets/marca-thermo-quanti.jpg"),
    message: "Olá, equipe Analítica. Gostaria de cotar Quanti-Cult Plus.",
    sourcePath: "/produto/thermo-scientific-quanti-cult/",
  },
];

export type ProductDetailSection = {
  title: string;
  body: string;
  image?: string;
};

export type ProductDetail = {
  intro: string;
  heroImage: string;
  highlights: string[];
  sections: ProductDetailSection[];
};

export const productDetails: Record<string, ProductDetail> = {
  "Thermo/Oxoid": {
    intro:
      "Linha de microbiologia manual com meios de cultura desidratados, cepas, discos para teste de suscetibilidade antimicrobiana, sistemas de atmosfera modificada e identificação microbiana.",
    heroImage: assetPath("/assets/site-produto-meios-cultura.jpg"),
    highlights: ["Meios de cultura", "Culti-Loops", "Quanti-Cult Plus", "RapiD System"],
    sections: [
      {
        title: "Meios de cultura desidratados",
        body: "A página original apresenta a Thermo/Oxoid como referência para meios de cultura e microbiologia manual, atendendo diferentes rotinas laboratoriais.",
        image: assetPath("/assets/site-produto-meios-cultura.jpg"),
      },
      {
        title: "Cepas, Culti-Loops e Quanti-Cult Plus",
        body: "Culti-Loops e Quanti-Cult Plus aparecem como soluções prontas para uso, derivadas de culturas ATCC autênticas e voltadas a rotinas de controle microbiológico.",
        image: assetPath("/assets/marca-thermo-culti.jpg"),
      },
      {
        title: "Discos e identificação RapiD",
        body: "O portfólio inclui discos para teste de suscetibilidade antimicrobiana, sistemas de geração de atmosfera modificada e identificação microbiana por RapiD System.",
        image: assetPath("/assets/site-produto-rapid.jpg"),
      },
    ],
  },
  Merck: {
    intro:
      "A Analítica se apresenta como distribuidora Merck, com reagentes P.A., solventes HPLC, filtros, membranas, colunas, kits para análise de água e itens de biologia molecular.",
    heroImage: assetPath("/assets/produto-kit-agua.jpg"),
    highlights: ["Reagentes P.A.", "Solventes HPLC", "Kits de análise", "Biologia molecular"],
    sections: [
      {
        title: "Reagentes, solventes e padrões",
        body: "A linha Merck no site original aparece vinculada a reagentes P.A., solventes LiChrosolv, padrões concentrados Titrisol e soluções para análises laboratoriais.",
        image: assetPath("/assets/produto-titrisol.png"),
      },
      {
        title: "Filtração, colunas e água",
        body: "O portfólio também cita filtros, membranas, colunas cromatográficas e kits para análise de água com aplicação visual e fotométrica.",
        image: assetPath("/assets/produto-colunas.png"),
      },
      {
        title: "Biologia molecular",
        body: "A página institucional relaciona a marca Merck a reagentes, kits e soluções para extração, amplificação e análise.",
        image: assetPath("/assets/produto-biologia-molecular.png"),
      },
    ],
  },
  "Química Moderna": {
    intro:
      "Linha de reagentes P.A. e papéis de filtro voltada a rotinas de laboratório químico.",
    heroImage: assetPath("/assets/marca-qm.png"),
    highlights: ["Reagentes P.A.", "Papéis de filtro", "Rotina química"],
    sections: [
      {
        title: "Reagentes para rotina analítica",
        body: "O portfólio original cita a Química Moderna entre as marcas de reagentes P.A. trabalhadas pela Analítica.",
      },
      {
        title: "Suprimentos complementares",
        body: "Papéis de filtro e itens de apoio compõem a frente de compras laboratoriais dessa linha.",
      },
    ],
  },
  Pyrex: {
    intro:
      "Vidrarias PYREX e vidrarias volumétricas com certificação 17025, conforme portfólio institucional da Analítica.",
    heroImage: assetPath("/assets/marca-pyrex.png"),
    highlights: ["Vidrarias", "Volumetria", "Certificação 17025"],
    sections: [
      {
        title: "Vidrarias para laboratório",
        body: "A marca Pyrex aparece no site original como parte das linhas de vidrarias trabalhadas pela Analítica.",
      },
      {
        title: "Volumetria certificada",
        body: "A página Quem somos cita vidrarias volumétricas com certificação 17025 como parte do portfólio.",
      },
    ],
  },
  Corning: {
    intro:
      "Produtos para laboratório das marcas Corning e Axygen, com foco em consumíveis plásticos.",
    heroImage: assetPath("/assets/site-blog-corning.png"),
    highlights: ["Plásticos", "Placas", "Consumíveis"],
    sections: [
      {
        title: "Produtos para aplicações laboratoriais",
        body: "O conteúdo Fique por dentro apresenta a Corning como fabricante de uma variedade de produtos para aplicações laboratoriais.",
        image: assetPath("/assets/site-blog-corning.png"),
      },
      {
        title: "Integração com Axygen",
        body: "No portfólio institucional, Corning e Axygen aparecem juntas na linha de plásticos para laboratório.",
      },
    ],
  },
  Axygen: {
    intro:
      "Linha de plástico com ponteiras, microtubos, microtubos para PCR, placas e microplacas para PCR.",
    heroImage: assetPath("/assets/site-produto-axygen.jpg"),
    highlights: ["Ponteiras", "Microtubos", "PCR", "Microplacas"],
    sections: [
      {
        title: "Linha de plástico",
        body: "A página original da Axygen destaca a linha de plástico para laboratório.",
        image: assetPath("/assets/site-produto-axygen.jpg"),
      },
      {
        title: "Consumíveis para PCR",
        body: "Entre os itens citados estão ponteiras, microtubos, microtubos para PCR, placas e microplacas para PCR.",
        image: assetPath("/assets/produto-biologia-molecular.png"),
      },
    ],
  },
  HTL: {
    intro: "Micropipetas e instrumentos para rotina laboratorial.",
    heroImage: assetPath("/assets/marca-htl.png"),
    highlights: ["Micropipetas", "Rotina laboratorial", "Precisão"],
    sections: [
      {
        title: "Instrumentos de pipetagem",
        body: "A linha HTL aparece no portfólio da Analítica associada a micropipetas e instrumentos para laboratório.",
      },
    ],
  },
  Incoterm: {
    intro:
      "Termômetros, termo-higrômetros, densímetros, data loggers, pHmetros e multímetros para medição em laboratório.",
    heroImage: assetPath("/assets/site-produto-incoterm.png"),
    highlights: ["Termômetros", "pHmetros", "Data loggers", "Densímetros"],
    sections: [
      {
        title: "Produtos de medição",
        body: "A página original reúne instrumentos analógicos e digitais como termômetros, termo-higrômetros, densímetros, data loggers, pHmetros e multímetros.",
        image: assetPath("/assets/site-produto-incoterm.png"),
      },
    ],
  },
  "J. Prolab": {
    intro:
      "Consumíveis, porcelanas, papéis filtrantes, placas de petri e acessórios laboratoriais.",
    heroImage: assetPath("/assets/marca-jprolab.png"),
    highlights: ["Porcelanas", "Papéis filtrantes", "Placas de petri"],
    sections: [
      {
        title: "Acessórios e consumíveis",
        body: "A linha J. Prolab aparece no portfólio institucional associada a porcelanas, papéis filtrantes, placas de petri e acessórios.",
      },
    ],
  },
  Specsol: {
    intro:
      "Reagentes e padrões para laboratório, incluindo padrões AAS, padrões ICP, MRC e soluções de pH, condutividade e turbidez.",
    heroImage: assetPath("/assets/site-produto-specsol.jpg"),
    highlights: ["Padrões AAS", "Padrões ICP", "MRC", "pH e condutividade"],
    sections: [
      {
        title: "Reagentes e padrões",
        body: "A página original da Specsol apresenta reagentes e padrões para laboratório.",
        image: assetPath("/assets/site-produto-specsol.jpg"),
      },
      {
        title: "Soluções e materiais de referência",
        body: "O portfólio cita padrões AAS, padrões ICP, MRC, soluções de pH, condutividade, turbidez e outros padrões analíticos.",
      },
    ],
  },
  Metalic: {
    intro: "Linha de produtos e acessórios para rotinas laboratoriais.",
    heroImage: assetPath("/assets/marca-metalic.png"),
    highlights: ["Laboratório", "Acessórios", "Rotina técnica"],
    sections: [
      {
        title: "Produtos laboratoriais",
        body: "A marca Metalic integra a vitrine de produtos da Analítica para atendimento comercial consultivo.",
      },
    ],
  },
  Nasco: {
    intro: "Produtos para coleta, amostragem e aplicações laboratoriais.",
    heroImage: assetPath("/assets/marca-nasco.png"),
    highlights: ["Coleta", "Amostragem", "Aplicações laboratoriais"],
    sections: [
      {
        title: "Amostragem e coleta",
        body: "A marca Nasco faz parte da área de produtos da Analítica e entra no fluxo de cotação técnica.",
      },
    ],
  },
  "RapiD System": {
    intro:
      "Sistema de identificação microbiana por provas bioquímicas com leitura de resultado em 4 horas.",
    heroImage: assetPath("/assets/site-produto-rapid.jpg"),
    highlights: ["Identificação microbiana", "Provas bioquímicas", "Resultado em 4 horas"],
    sections: [
      {
        title: "Identificação microbiana",
        body: "A página Thermo/Oxoid apresenta o RapiD System como solução de identificação microbiana por provas bioquímicas.",
        image: assetPath("/assets/site-produto-rapid.jpg"),
      },
    ],
  },
  Permution: {
    intro: "Produtos para tratamento de água e aplicações relacionadas.",
    heroImage: assetPath("/assets/site-produto-permution.jpg"),
    highlights: ["Tratamento de água", "Aplicações industriais", "Linha técnica"],
    sections: [
      {
        title: "Tratamento de água",
        body: "A página original da Permution apresenta produtos para tratamento de água.",
        image: assetPath("/assets/site-produto-permution.jpg"),
      },
    ],
  },
  Chiarotti: {
    intro: "Produtos e acessórios laboratoriais para rotinas técnicas.",
    heroImage: assetPath("/assets/marca-chiarotti.png"),
    highlights: ["Acessórios", "Rotina técnica", "Laboratório"],
    sections: [
      {
        title: "Linha Chiarotti",
        body: "A Chiarotti integra a vitrine de marcas e produtos da Analítica.",
      },
    ],
  },
  "Culti-Loops": {
    intro:
      "Loops bacteriológicos descartáveis, prontos para uso, com microrganismos viáveis derivados de culturas ATCC.",
    heroImage: assetPath("/assets/marca-thermo-culti.jpg"),
    highlights: ["Cepas ATCC", "Pronto para uso", "Controle microbiológico"],
    sections: [
      {
        title: "Cepas Culti-Loops",
        body: "A página Thermo/Oxoid apresenta Culti-Loops como loops bacteriológicos descartáveis e prontos para uso.",
        image: assetPath("/assets/marca-thermo-culti.jpg"),
      },
    ],
  },
  Ohaus: {
    intro: "Balanças e equipamentos para medição em laboratório.",
    heroImage: assetPath("/assets/marca-ohaus.png"),
    highlights: ["Balanças", "Medição", "Laboratório"],
    sections: [
      {
        title: "Balanças Ohaus",
        body: "A Ohaus aparece no portfólio de produtos da Analítica como linha de balanças.",
      },
    ],
  },
  Hydranal: {
    intro:
      "Produtos químicos para Karl Fischer, incluindo reagentes, padrões e solventes para determinação do teor de água.",
    heroImage: assetPath("/assets/site-produto-hydranal.png"),
    highlights: ["Karl Fischer", "Reagentes", "Padrões", "Solventes"],
    sections: [
      {
        title: "Produtos químicos para Karl Fischer",
        body: "A página original da Hydranal apresenta produtos químicos para Karl Fischer.",
        image: assetPath("/assets/site-produto-hydranal.png"),
      },
      {
        title: "Determinação do teor de água",
        body: "A linha reúne reagentes, padrões e solventes para determinação do teor de água em amostras.",
      },
    ],
  },
  "Quanti-Cult Plus": {
    intro:
      "Microrganismos viáveis derivados de culturas ATCC autênticas, prontos para reidratar.",
    heroImage: assetPath("/assets/marca-thermo-quanti.jpg"),
    highlights: ["Cepas ATCC", "Pronto para reidratar", "Controle microbiológico"],
    sections: [
      {
        title: "Quanti-Cult Plus",
        body: "A página Thermo/Oxoid apresenta Quanti-Cult Plus como microrganismos viáveis derivados de culturas ATCC autênticas.",
        image: assetPath("/assets/marca-thermo-quanti.jpg"),
      },
    ],
  },
};

export const trustCards = [
  {
    title: "Entrega em toda a Grande BH",
    description: "A Analítica realiza entregas em toda Belo Horizonte.",
    icon: Truck,
  },
  {
    title: "Procedência técnica",
    description: "Portfólio com marcas reconhecidas e produtos certificados.",
    icon: FileCheck2,
  },
  {
    title: "Linhas de venda livre e controladas",
    description: "Atendimento para produtos comuns e sujeitos a controle.",
    icon: PackageCheck,
  },
  {
    title: "Equipe qualificada",
    description: "Equipe dedicada a oferecer soluções avançadas para laboratórios.",
    icon: Users,
  },
];

export const partnerLogos = featuredProducts.map((product) => ({
  name: product.name,
  image: product.image,
}));

export const complianceItems = [
  "Produtos químicos controlados por Polícia Federal, Exército e Polícia Civil exigem validação de finalidade, documentação e habilitação.",
  "A Analítica trata o assunto com rigoroso controle no repasse a terceiros habilitados e transparência nas informações.",
  "Mapas de controle, concentração, densidade, natureza da operação e guias de tráfego devem ser conferidos com cuidado.",
];

export const commercialFlow = [
  {
    title: "Informe a demanda",
    description: "Produto, marca, grau, quantidade, finalidade e urgência da compra.",
    icon: ClipboardCheck,
  },
  {
    title: "Validação técnica",
    description: "A equipe confirma especificações, equivalências e requisitos de controle.",
    icon: Microscope,
  },
  {
    title: "Cotação consultiva",
    description: "O retorno acontece por WhatsApp, telefone ou e-mail comercial.",
    icon: Factory,
  },
  {
    title: "Separação e envio",
    description: "Produtos disponíveis seguem para faturamento e logística combinada.",
    icon: Boxes,
  },
];

export const aboutHighlights = [
  {
    title: "Fundada em 1989",
    description:
      "A Analítica LTDA nasceu com a missão de comercializar reagentes analíticos e suprimentos para laboratórios.",
    icon: Award,
  },
  {
    title: "Nova fase de gestão",
    description:
      "A empresa mantém sua história e incorpora tecnologia para simplificar operações diárias dos laboratórios.",
    icon: Gauge,
  },
  {
    title: "Atuação nacional",
    description:
      "Atende setores em todo o território nacional com portfólio de venda livre e produtos controlados.",
    icon: MapPinned,
  },
  {
    title: "Portfólio técnico",
    description:
      "Reagentes, plásticos, vidrarias, filtros, membranas, microbiologia, micropipetas e consumíveis.",
    icon: Scale,
  },
];

export const aboutPortfolio = [
  "Reagentes P.A. das marcas Merck e QM",
  "Reagentes para HPLC da marca Merck",
  "Plástico para laboratório das marcas Corning e Axygen",
  "Vidrarias volumétricas com certificação 17025 da marca Pyrex",
  "Filtros de seringa e membranas filtrantes GVS",
  "Microbiologia manual Thermo/Oxoid",
  "Micropipetas HTL e termômetros Incoterm",
  "Porcelanas, papéis filtrantes, placas de petri e acessórios",
];

export const insightPosts = [
  {
    title: "Produção e garantia de qualidade dos meios de cultura",
    category: "Fique por dentro",
    date: "04/11/2024",
    description: "Conteúdo técnico sobre fabricação e garantia de qualidade dos meios de cultura.",
    image: assetPath("/assets/site-blog-meios-cultura.png"),
  },
  {
    title: "Thermo/Oxoid",
    category: "Fique por dentro",
    date: "04/11/2024",
    description: "Excelência em meios de cultura e parcerias comerciais estratégicas.",
    image: assetPath("/assets/site-blog-oxoid.png"),
  },
  {
    title: "A importância do CQ na indústria siderúrgica",
    category: "Fique por dentro",
    date: "04/11/2024",
    description: "O controle de qualidade como rotina essencial na indústria siderúrgica.",
    image: assetPath("/assets/site-blog-siderurgia.png"),
  },
  {
    title: "A Corning",
    category: "Fique por dentro",
    date: "04/11/2024",
    description: "A Corning fabrica uma variedade de produtos para aplicações laboratoriais.",
    image: assetPath("/assets/site-blog-corning.png"),
  },
];

export const quoteFields = [
  "Nome",
  "Empresa",
  "E-mail",
  "Cidade",
  "CNPJ/CPF",
  "Telefone",
  "Estado",
  "Mensagem",
];
