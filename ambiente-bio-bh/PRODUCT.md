# Produto — Ambiente Orkin

## Objetivo

Apresentar a Ambiente Orkin com autoridade técnica, ajudar o visitante a organizar os sinais percebidos e converter uma necessidade real em uma conversa contextualizada pelo WhatsApp.

A jornada foi ampliada segundo a lógica estrutural da Raven Health, sem copiar sua identidade: a página passa de uma apresentação curta para uma narrativa completa de problema, soluções, avaliação, método, atuação, ocorrências, dúvidas e contato.

## Públicos

- Moradores e responsáveis por residências.
- Síndicos e administradores de condomínios.
- Responsáveis por empresas e comércios.
- Operações de alimentos e hospitalidade.
- Saúde, instituições, acervos e coleções.

## Promessa de experiência

Ao percorrer a página, o usuário deve:

1. Entender que a solução começa por avaliação técnica.
2. Identificar o percurso residencial ou empresarial.
3. Compreender o que é observado em uma inspeção.
4. Conhecer Avaliar, Implantar e Monitorar.
5. Ver se o seu tipo de ambiente está contemplado.
6. Explorar sinais comuns sem confundi-los com diagnóstico.
7. Resolver dúvidas antes de entrar em contato.
8. Preparar uma conversa útil no WhatsApp.

## Arquitetura de conteúdo

| Etapa | ID | Função |
| --- | --- | --- |
| Proposta e confiança | `#top`, `#sinais` | Posicionar a empresa, mostrar a profissional e credenciais aprovadas |
| Soluções | `#servicos` | Separar atendimento residencial e empresarial |
| Leitura do ambiente | — | Explicar sinais, acessos e condições |
| Método | `#metodo` | Apresentar A.I.M. em sequência |
| Atuação | `#setores` | Mostrar tipos de ambiente atendidos |
| Ocorrências | `#ocorrencias` | Explorar seis ocorrências e seus sinais comuns |
| Dúvidas | `#duvidas` | Responder objeções recorrentes |
| Conversão | `#contato`, `#agendar-contato` | Coletar contexto e abrir o WhatsApp |
| Próximo passo | footer | Reforçar CTA e canais |

## Conversão

O CTA principal aponta para um formulário curto.

Obrigatórios:

1. Tipo de local.
2. Descrição breve do que está acontecendo.

Opcionais:

3. Dia de preferência.
4. Período de preferência.

O formulário não agenda nem confirma uma visita. Ele abre uma mensagem editável no WhatsApp e inclui o aviso de que as preferências dependem de confirmação da equipe.

Telefone e e-mail permanecem alternativas visíveis. Não são solicitados nome, documento, endereço completo, cadastro ou dado sensível.

## Interações de produto

- Menu mobile acessível e fechável por `Escape`.
- Navegação com estado da seção atual.
- Explorador de ocorrências com seleção explícita por `aria-pressed`.
- FAQ nativa com `details/summary`.
- Validação de campos com erro associado e foco no primeiro problema.
- Status do envio anunciado por `aria-live`.

## Fatos e limites

Fatos usados:

- Atuação desde 1980.
- Integração à Orkin desde 2014.
- Coordenação por biólogos.
- Atendimento em Belo Horizonte.
- Método A.I.M.: Avaliar, Implantar e Monitorar.
- Anóxia para acervos como tratamento atóxico.
- VitalClean como sanitização profissional.

Não acrescentar sem evidência:

- depoimentos ou avaliações;
- logos ou nomes de clientes;
- métricas de resultado;
- certificações não documentadas;
- garantias, prazo imediato ou disponibilidade 24 horas;
- afirmações absolutas de segurança;
- cobertura geográfica além do conteúdo aprovado.

## Voz

Técnica, direta e humana. A copy explica antes de persuadir, evita alarmismo e nunca apresenta conteúdo educativo como diagnóstico.

As cenas de inspeção e imagens de ocorrências são ilustrações editoriais, não casos reais. A profissional do Hero é o único retrato de pessoa apresentado como elemento institucional Orkin.

## Critérios de qualidade

- Jornada completa compreensível sem animação.
- CTAs e contato presentes em desktop e mobile.
- Zero overflow horizontal em `320`, `375`, `390`, `414`, `768`, `1024`, `1280` e `1440px`.
- Imagens carregadas com dimensões intrínsecas.
- Nenhum erro de console ou runtime.
- Foco, teclado, reduced motion e alvos de toque verificados.
- Build e testes E2E obrigatórios antes da entrega.
