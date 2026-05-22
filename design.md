# Click To Fly Design System

Hallmark stamp: macrostructure = editorial opportunity board; tone = luxo funcional; anchor hue = teal; trust posture = consultivo e humano.

## Direcao

A pagina deve parecer uma empresa seria de viagens que monitora promocoes relampago sem perder o cuidado de uma consultoria. O visual combina base off-white, tinta navy, linhas finas, fotografia editorial clara e teal usado apenas em decisoes: CTA, estado ativo, economia e foco.

## Principios

- Hero comunica em ate 5 segundos: promocoes monitoradas, atendimento humano e orcamento personalizado.
- Existem dois caminhos claros: entrar no grupo de WhatsApp para oportunidades rapidas ou preencher o orcamento para uma viagem sob medida.
- Cards viram paineis de oportunidade: dados comparaveis, economia visivel e menos decoracao generica.
- Fotografia precisa representar destino/produto de viagem, com imagens reconheciveis e consistentes.
- Motion fica em `transform` e `opacity`, com `prefers-reduced-motion` respeitado.
- Estados de hover, clique, foco e erro precisam ser completos e discretos.

## Tokens

Os tokens vivem em `src/styles/tokens.css` e usam OKLCH para papel, tinta, teal, estados, raios, sombras, espacamento e motion. Componentes devem consumir tokens, nao valores soltos.

## Estrutura Visual

1. Hero editorial com painel de alerta de tarifa e CTAs primario/secundario.
2. Destinos em galeria interativa expansivel.
3. Promocoes como tickets comparaveis.
4. Processo em timeline consultiva.
5. WhatsApp como canal rapido de oportunidades.
6. Confianca com prova de curadoria e atendimento humano.
7. Orcamento como assistente guiado.
8. Depoimentos e FAQ para reduzir objecoes.

## Aceite Visual

- Sem horizontal scroll em 320, 375, 414, 768 e desktop.
- Textos de botoes nao devem quebrar de forma desajeitada.
- CTA flutuante nao deve cobrir controles essenciais.
- Imagens carregam com `alt` adequado.
- Console sem erros relevantes e build passando.
