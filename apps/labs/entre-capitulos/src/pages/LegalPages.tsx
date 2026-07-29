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
        <h2>Catálogos externos e Amazon</h2>
        <p>
          O Google Books pode fornecer metadados para cadastrar livros na
          estante. A Livraria consulta conteúdo comercial da Amazon.com.br. Ao
          abrir uma oferta, você deixa o Entre Capítulos e passa a estar sujeito
          às políticas da Amazon.
        </p>
        <a
          href="https://www.amazon.com.br/gp/help/customer/display.html?nodeId=GX7NJQ4ZB8MHFRNJ"
          target="_blank"
          rel="noopener noreferrer"
        >
          Consultar o aviso de privacidade da Amazon
          <ExternalLink size={15} aria-hidden="true" />
        </a>
      </section>

      <section>
        <h2>Retenção e segurança</h2>
        <p>
          Mantemos os dados da estante enquanto eles forem necessários ao uso
          do produto. Dados comerciais da Amazon ficam apenas pelo período
          permitido e informações vencidas não são exibidas. Não armazenamos
          dados de pagamento ou entrega.
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
        <h2>Ofertas da Amazon</h2>
        <p>
          Preços, disponibilidade, vendedor e promoções podem mudar após a
          consulta. O Entre Capítulos não vende, processa pagamentos, entrega ou
          presta suporte aos produtos. A compra é concluída diretamente na
          Amazon.com.br, conforme as condições apresentadas por ela.
        </p>
        <p>
          Alguns links de produto são links de associado. O endereço afiliado
          recebido da Amazon é preservado, sem encurtamento ou alteração.
        </p>
      </section>

      <section>
        <h2>Disponibilidade</h2>
        <p>
          O produto está em pré-produção e pode passar por ajustes ou
          interrupções. Não oferecemos histórico de preços, garantia de desconto
          nem alertas automáticos nesta versão.
        </p>
      </section>

      <LegalContact />
    </article>
  );
}
