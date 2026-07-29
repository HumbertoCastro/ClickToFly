import { ExternalLink, Mail } from "lucide-react";
import { getSupportEmail } from "../lib/publicConfig";

const LAST_UPDATED = "29 de julho de 2026";

function LegalContact() {
  const supportEmail = getSupportEmail();

  return (
    <section>
      <h2>Contato e solicitações</h2>
      <p>
        Para dúvidas, correções ou solicitações relacionadas aos seus dados,
        escreva para{" "}
        <a href={`mailto:${supportEmail}`}>
          <Mail size={16} aria-hidden="true" />
          {supportEmail}
        </a>
        .
      </p>
    </section>
  );
}

export function PrivacyPage() {
  return (
    <article className="legal-page">
      <header>
        <p className="eyebrow">ENTRE CAPÍTULOS · TRANSPARÊNCIA</p>
        <h1>Política de privacidade</h1>
        <p className="legal-page__updated">
          Última atualização: {LAST_UPDATED}.
        </p>
        <p>
          Esta política explica quais dados o Entre Capítulos usa para manter a
          estante compartilhada e a Livraria em funcionamento.
        </p>
      </header>

      <section>
        <h2>Dados usados pelo produto</h2>
        <p>
          A área privada trata dados de autenticação, perfis da casa, livros,
          status de leitura, avaliações e preferências inseridas por você. Esses
          dados são armazenados no Supabase e usados apenas para oferecer as
          funções da biblioteca.
        </p>
      </section>

      <section>
        <h2>Catálogo aberto e lojas externas</h2>
        <p>
          O Open Library fornece dados bibliográficos, capas e relações entre
          obras e edições. Quando você escolhe procurar uma edição em uma loja,
          deixa o Entre Capítulos e passa a seguir as políticas daquele site.
          Não consultamos preços, estoque, pagamento ou entrega.
        </p>
        <a
          href="https://openlibrary.org/developers"
          target="_blank"
          rel="noopener noreferrer"
        >
          Conhecer o Open Library
          <ExternalLink size={15} aria-hidden="true" />
        </a>
      </section>

      <section>
        <h2>Retenção e segurança</h2>
        <p>
          Mantemos os dados da estante enquanto eles forem necessários ao uso
          do produto. Respostas do catálogo aberto permanecem em cache por
          períodos limitados para reduzir chamadas externas. Não armazenamos
          dados de pagamento, estoque, preço ou entrega.
        </p>
      </section>

      <LegalContact />
    </article>
  );
}

export function TermsPage() {
  return (
    <article className="legal-page">
      <header>
        <p className="eyebrow">ENTRE CAPÍTULOS · CONDIÇÕES DE USO</p>
        <h1>Termos de uso</h1>
        <p className="legal-page__updated">
          Última atualização: {LAST_UPDATED}.
        </p>
        <p>
          Ao usar o Entre Capítulos, você concorda com estas condições para a
          estante compartilhada e a Livraria.
        </p>
      </header>

      <section>
        <h2>Estante e perfis</h2>
        <p>
          Você é responsável pelas informações cadastradas e pelo uso dos
          perfis da casa. Não use o serviço para inserir conteúdo ilegal,
          ofensivo ou que viole direitos de terceiros.
        </p>
      </section>

      <section>
        <h2>Onde encontrar uma edição</h2>
        <p>
          O Entre Capítulos não vende livros, compara preços, confirma estoque,
          processa pagamentos, entrega ou presta suporte aos produtos. Os botões
          de busca apenas abrem Amazon, Estante Virtual ou Mercado Livre com o
          ISBN, título ou autor da edição selecionada.
        </p>
        <p>
          Alguns títulos curados podem conter links diretos de associado. Esses
          links são identificados como publicidade e preservados sem
          encurtamento ou alteração.
        </p>
      </section>

      <section>
        <h2>Disponibilidade</h2>
        <p>
          O produto está em pré-produção e pode passar por ajustes ou
          interrupções. Metadados públicos podem conter lacunas ou duplicatas;
          a curadoria da casa pode corrigir agrupamentos e cadastrar edições
          manualmente.
        </p>
      </section>

      <LegalContact />
    </article>
  );
}
