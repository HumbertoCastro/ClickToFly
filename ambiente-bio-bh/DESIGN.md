# Design — Ambiente Orkin

## Direção

A interface traduz para a Ambiente Orkin os princípios estruturais observados na Raven Health: abertura editorial de alto impacto, prova institucional logo após a proposta, capítulos alternados de conteúdo, bloco escuro de método, exploração guiada, FAQ, conversão em painel dividido e rodapé com chamada final ampla.

A referência orienta hierarquia e ritmo; identidade, textos, cores, fotografia, marca e serviços continuam integralmente Orkin.

O resultado usa uma linguagem **verde editorial premium**: papel quente para leitura, verde-claro para transições, verde-floresta para autoridade e vermelho concentrado nas ações. Linhas finas, tipografia grande, assimetria e respiro substituem mosaicos genéricos de cards.

## Sistema visual

- Títulos: `Archivo`, peso 600.
- Corpo e interface: `Source Sans 3`, pesos 400 e 600.
- Container: até `1240px`, com gutters fluidos.
- Cores: a fonte de verdade é `tokens.css`.
- Raios: discretos; painéis principais podem usar `18–30px`.
- Sombras: somente para separar painéis de conversão e destaques do fundo.
- Gradientes: apenas luz ambiente verde de baixo contraste.
- Textura: grão monocromático com opacidade próxima de `2.6%`.

O único símbolo de marca exibido é o losango autêntico de `favicon.png`. O link recebe o nome acessível “Ambiente Orkin — início”; a imagem é decorativa e usa `alt=""`.

## Arquitetura implementada

1. Header claro e sticky, com navegação ativa, telefone, CTA e menu mobile.
2. Hero verde `#top`, com copy em cinco colunas e profissional Orkin recortada em sete.
3. Faixa de credenciais e sinais `#sinais`.
4. Capítulos alternados residencial/empresarial em `#servicos`.
5. Spotlight escuro para Anóxia e VitalClean.
6. Leitura visual do ambiente com pontos Sinais, Acessos e Condições.
7. Matriz escura do método A.I.M. em `#metodo`.
8. Grade editorial de segmentos em `#setores`.
9. Explorador interativo de ocorrências em `#ocorrencias`.
10. FAQ em `#duvidas`.
11. Painel dividido de contato e formulário em `#contato` e `#agendar-contato`.
12. Rodapé amplo com CTA final, navegação, canais e política.

As novas seções existem para reduzir dúvidas antes do contato. Não há depoimentos, logos de clientes, métricas, casos ou garantias fabricadas.

## Hero

O Hero aprovado permanece como protagonista:

- Fundo verde-floresta estático.
- H1 “Diagnóstico técnico. Controle responsável.”
- CTA e telefone visíveis acima da dobra em desktop.
- Profissional uniformizada recortada, ancorada na base e sem moldura.
- `fetchpriority="high"` e dimensões intrínsecas.
- Em telas abaixo de `900px`, copy e ações aparecem antes da figura.

O cutout é derivado de fotografia existente; pessoa, uniforme e logos não foram gerados ou redesenhados.

## Conteúdo visual

As imagens `residencial-inspecao-*`, `comercial-inspecao-*`, `hero-inspecao-*` e os seis WebPs de ocorrências são ilustrações editoriais sintéticas. Elas:

- não representam clientes, visitas ou equipe real;
- não funcionam como prova de resultado;
- não podem receber legendas que sugiram um caso real;
- usam `alt` descritivo e dimensões intrínsecas;
- evitam horror, animais mortos, químicos expostos e práticas inseguras.

## Componentes e estados

### Navegação

- Desktop: cinco âncoras editoriais e CTA.
- Até `980px`: botão “Abrir menu” com `aria-controls` e `aria-expanded`.
- O menu fecha após navegação, `Escape` ou retorno ao desktop.
- A seção corrente usa `aria-current="location"`.

### Soluções e método

- Soluções alternam mídia e texto, com listas curtas de características.
- Anóxia/VitalClean aparecem em um único spotlight, não como promessas isoladas.
- A.I.M. usa lista ordenada em três colunas; no mobile, vira sequência vertical.

### Explorador de ocorrências

- Seis botões permanecem sempre no DOM.
- O botão selecionado usa `aria-pressed="true"`.
- O painel destacado atualiza imagem, resumo e sinais relacionados.
- A copy informa que a exploração não substitui avaliação no local.

### FAQ

- Usa `details` e `summary` nativos.
- Todas as perguntas continuam acessíveis quando uma resposta é aberta.
- O estado aberto não depende apenas de cor.

### Formulário

Campos obrigatórios:

1. Tipo de local.
2. Breve descrição do que está acontecendo.

Preferências opcionais:

3. Dia.
4. Período.

O envio apenas prepara uma mensagem editável no WhatsApp. A interface e a mensagem deixam explícito que uma preferência não confirma visita.

## Movimento

Reveals usam `IntersectionObserver` como melhoria progressiva:

- entrada entre `380–640ms`;
- stagger de `80ms`;
- easing `cubic-bezier(.22, 1, .36, 1)`;
- elementos chegam à posição final por opacidade e deslocamento curto;
- conteúdo nasce visível sem JavaScript;
- conteúdo condicional do explorador não depende do observer.

Com `prefers-reduced-motion: reduce`, todo deslocamento, zoom de hover e scroll suave são neutralizados.

## Responsividade e acessibilidade

Breakpoints estruturais principais: `640px`, `760px`, `900px` e `980px`.

- Zero overflow horizontal entre `320px` e `1440px`.
- Alvos interativos de pelo menos `44px`.
- Um único `h1`.
- `main` recebe `tabIndex={-1}` para o skip link.
- Foco visível em links, botões e campos.
- Labels e erros associados aos controles.
- Imagens decorativas usam `alt=""`; imagens informativas recebem descrição objetiva.
- A política informa que abre em nova aba.
- Links e assets continuam compatíveis com `/projetos/orkin/`.
