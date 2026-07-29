import { AlertTriangle, Mail } from "lucide-react";
import { getSupportEmail } from "../lib/publicConfig";

export function DeploymentConfigurationError() {
  const supportEmail = getSupportEmail();

  return (
    <main className="deployment-error">
      <div className="deployment-error__card">
        <div className="logo" aria-label="Entre Capítulos">
          <span className="logo__mark" aria-hidden="true">
            <span>EC</span>
          </span>
          <span className="logo__type">
            <strong>Entre</strong>
            <em>Capítulos</em>
          </span>
        </div>
        <span className="deployment-error__icon" aria-hidden="true">
          <AlertTriangle size={24} />
        </span>
        <p className="eyebrow">CONFIGURAÇÃO INCOMPLETA</p>
        <h1>Esta versão ainda não está pronta para receber seus dados.</h1>
        <p>
          A conexão segura com a biblioteca não foi configurada. O acesso foi
          interrompido para evitar que informações sejam salvas apenas neste
          dispositivo.
        </p>
        <a className="button button--primary" href={`mailto:${supportEmail}`}>
          <Mail size={17} aria-hidden="true" />
          Falar com o suporte
        </a>
      </div>
    </main>
  );
}
