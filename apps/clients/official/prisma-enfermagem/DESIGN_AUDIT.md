# Prisma Enfermagem - audit de UX e direcao visual

## Base usada

- Skill `ui-ux-pro-max`: recomendou landing com storytelling, prova social, CTA recorrente, paleta cyan/verde de saude e tipografia Figtree/Noto Sans.
- Referencia principal: Klearmind Clinics, pela estrutura de hero emocional, CTA de consulta, blocos de experiencia, reviews, tratamentos e FAQ.
- Referencia secundaria: template Alternative Medicine, pela linguagem clara de saude, servicos e navegacao simples.
- Ativos fornecidos: mosaico social da Prisma e card "Quem e Layza?".

## Diagnostico

1. A marca ja tem cores fortes e reconhecimento visual nas redes, mas o formato de feed e muito denso para uma landing. A pagina precisa respirar mais e transformar posts educativos em uma jornada de cuidado.
2. O melhor gatilho de confianca e a propria Layza: 28 anos de enfermagem, atuacao docente e criadora da Prisma. Isso deve aparecer no primeiro viewport.
3. Fotos de feridas funcionam como conteudo educativo, mas nao devem dominar o hero. O primeiro contato precisa ser acolhedor, com a enfermeira centralizada.
4. O CTA mais claro para o publico local e WhatsApp. Ele aparece no hero, na navegacao, nas secoes de alerta e no formulario.
5. Claims clinicos precisam ser conservadores. A pagina fala em avaliacao, acompanhamento, orientacao e sinais de alerta, sem prometer cicatrizacao.

## Decisoes aplicadas

- Hero com retrato central da enfermeira e copy direta sobre feridas que precisam de cuidado certo.
- Paleta expandida: branco clinico, aqua, teal, verde saude, navy e creme leve para nao ficar monocromatica.
- Secoes: sinais de alerta, servicos, jornada, autoridade da Layza, educacao/prova social, FAQ e contato.
- Formulario acessivel com labels, helper text, validacao inline e estado de carregamento/sucesso.
- Animacoes apenas de entrada e hover, com `prefers-reduced-motion` respeitado.
- Tipografia Figtree para titulos e Noto Sans para leitura longa.

## Pontos para proxima rodada

- Substituir depoimentos resumidos por feedbacks reais aprovados.
- Adicionar endereco/area de atendimento se a Prisma quiser filtrar leads por regiao.
- Incluir mais fotos proprietarias em contexto de atendimento para reduzir dependencia de cards de redes sociais.
