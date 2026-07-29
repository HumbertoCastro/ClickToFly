# Ambiente Orkin — Design System Master

**Projeto:** site institucional Ambiente Orkin

**Direção:** verde editorial premium

**Base pública:** `/projetos/orkin/`

## 1. Tokens

`tokens.css` é a fonte de verdade.

| Token | Valor | Papel |
| --- | --- | --- |
| `--paper` | `#F6F4EC` | Leitura e respiro |
| `--paper-deep` | `#EBE8DC` | Seções editoriais |
| `--mint-soft` | `#EDF3EA` | Transições e painéis claros |
| `--ink` | `#1E1E1C` | Texto principal |
| `--ink-soft` | `#4B4B47` | Texto secundário |
| `--forest` | `#06351A` | Superfícies institucionais |
| `--forest-deep` | `#032612` | Hero, método e footer |
| `--green` | `#066020` | Estado ativo |
| `--red` | `#CD0102` | Ação principal |
| `--red-soft` | `#FF7778` | Microdestaque sobre verde |

Tipografia:

- Display: `Archivo`, peso 600.
- Corpo/UI: `Source Sans 3`, pesos 400 e 600.
- H1/H2: entrelinha `0.92–0.98`, tracking negativo e largura controlada.
- Corpo: entrelinha `1.55–1.7`.

## 2. Princípios

1. A referência Raven orienta composição e hierarquia, não identidade.
2. A página alterna papel, verde-claro e verde-escuro para criar ritmo.
3. Títulos grandes, bordas finas e respiro têm prioridade sobre cards elevados.
4. Assimetria deve ser intencional e nunca gerar overflow.
5. Vermelho permanece concentrado em CTA, marcador e foco de ação.
6. Conteúdo técnico não vira promessa absoluta.
7. Imagem sintética nunca é apresentada como visita, cliente ou prova.

## 3. Grade

- Container máximo: `1240px`.
- Desktop: 12 colunas.
- Tablet: 8 colunas.
- Mobile: 4 colunas.
- Gutters: `clamp(16px, 2.5vw, 36px)`.
- Espaçamento de seção: `clamp(76px, 9vw, 144px)`.

Breakpoints usados: `540`, `620`, `640`, `680`, `720`, `760`, `840`, `900` e `980px`. Os pontos adicionais são ajustes locais; `640`, `900` e `980px` governam as mudanças estruturais.

## 4. Contrato da página

IDs únicos obrigatórios:

- `#top`
- `#sinais`
- `#servicos`
- `#metodo`
- `#setores`
- `#ocorrencias`
- `#duvidas`
- `#contato`
- `#agendar-contato`

Sequência:

1. Header sticky claro.
2. Hero e credenciais.
3. Sinais.
4. Soluções em capítulos alternados.
5. Serviços especializados.
6. Inspeção anotada.
7. Matriz A.I.M.
8. Segmentos atendidos.
9. Explorador de ocorrências.
10. FAQ.
11. Contato/formulário.
12. Footer com CTA final.

## 5. Componentes

### Header

- Losango autêntico de `favicon.png`.
- Cinco links editoriais.
- Telefone e CTA.
- Estado compacto por `data-header-compact`.
- Até `980px`, menu acessível com `aria-expanded`.

### Hero

- Grade desktop `5/7`.
- Profissional Orkin sem moldura, ancorada na base.
- CTA acima da dobra em `1280 × 720` e `1440 × 900`.
- Copy e ações antes da figura no mobile.

### Capítulos de solução

- Mídia/texto alternados.
- Número, eyebrow, título, corpo, três pontos e link.
- Zoom máximo sutil e removido com reduced motion.

### Inspeção

- Cena editorial ampla com três anotações.
- Desktop: marcadores sobre a cena.
- Mobile: marcadores em lista abaixo da imagem.

### Método A.I.M.

- Lista ordenada de três etapas.
- Matriz horizontal no desktop e vertical no mobile.
- A ordem permanece compreensível sem motion.

### Segmentos

- Cinco itens em grade `2 + 3` no desktop.
- Duas colunas no tablet, uma no mobile.

### Ocorrências

- Painel destacado mais seis seletores.
- Seleção usa `aria-pressed`.
- Thumbnail decorativa no seletor; imagem informativa no painel.
- Nenhum texto equivale a diagnóstico.

### FAQ

- `details/summary` nativos.
- Indicador “+” decorativo.
- Resposta não remove as demais perguntas do fluxo.

### Contato

- Painel dividido claro/escuro.
- Dois campos obrigatórios e duas preferências opcionais.
- Mensagem de WhatsApp explicita que preferência não confirma visita.

### Footer

- CTA editorial amplo.
- Marca, descrição, navegação e contato.
- Meta final com política de privacidade e indicação de nova aba.

## 6. Marca e imagens

- Somente `favicon.png` funciona como logo visível.
- O cutout do Hero preserva pixels da pessoa, uniforme e marca.
- Assets de cenas editoriais e pragas são sintéticos e não comprovam fatos.
- Todos os raster informativos usam `width`, `height`, WebP e `alt` objetivo.
- Não gerar logos, clientes, uniformes ou selos.

## 7. Interação e movimento

- Reveals entram uma única vez por `IntersectionObserver`.
- Conteúdo é visível por padrão e só é ocultado após `.motion-ready`.
- Duração: `380–640ms`.
- Stagger: `80ms`.
- Hover: `180–240ms`.
- Easing: `cubic-bezier(.22, 1, .36, 1)`.
- Nenhuma animação controla estado de negócio.
- `prefers-reduced-motion` remove deslocamento, smooth scroll e zoom.

## 8. Acessibilidade

- Contraste WCAG AA.
- Alvo mínimo de `44 × 44px`.
- Um `h1`.
- `main[tabindex="-1"]` para o skip link.
- Foco de `3px` em todos os controles.
- Rótulos visíveis e erros associados por `aria-describedby`.
- Navegação atual por `aria-current="location"`.
- Menu por `aria-controls`/`aria-expanded`.
- Seletor de ocorrência por `aria-label`/`aria-pressed`.
- Status do formulário por `aria-live`.
- Zero dependência de cor, hover ou motion.

## 9. Claims permitidos

- Desde 1980.
- Integração à Orkin desde 2014.
- Coordenação por biólogos.
- Belo Horizonte.
- A.I.M.
- Anóxia para acervos como tratamento atóxico.
- VitalClean como sanitização profissional.

Proibido sem nova evidência: depoimentos, métricas, certificações, clientes, garantias, disponibilidade imediata/24h, afirmação absoluta de segurança e cobertura geográfica adicional.

## 10. Gate de entrega

- `npm run build`
- `npm run test:e2e`
- `git diff --check`
- QA visual em desktop, tablet e mobile
- Teste do menu, explorador, FAQ e WhatsApp
- Inspeção de console e `pageerror`
- Verificação de imagens e overflow entre `320px` e `1440px`
