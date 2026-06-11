import type { CSSProperties } from "react";
import styled from "styled-components";
import { trustItems } from "../data";
import { palette } from "../theme";

const Section = styled.section`
  background:
    linear-gradient(90deg, ${palette.navyDeep} 0%, ${palette.navy} 58%, ${palette.tealDeep} 100%);
  color: ${palette.paper};
`;

const Rail = styled.ul`
  width: min(100% - 32px, 1220px);
  margin: 0 auto;
  display: flex;
  align-items: stretch;
  justify-content: space-between;
  gap: clamp(20px, 4vw, 52px);
  list-style: none;
  padding: clamp(26px, 4vw, 42px) 0;

  @media (max-width: 920px) {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  @media (max-width: 540px) {
    grid-template-columns: 1fr;
    gap: 0;
    padding: 18px 0 22px;
  }
`;

const Item = styled.li`
  min-width: 0;
  flex: 1 1 0;
  display: grid;
  grid-template-columns: 30px minmax(0, 1fr);
  column-gap: 14px;
  align-content: start;
  border-top: 1px solid rgba(255, 255, 255, 0.18);
  padding-top: 18px;

  svg {
    color: ${palette.goldSoft};
    margin-top: 1px;
    filter: drop-shadow(0 0 12px oklch(0.86 0.08 86 / 0.26));
  }

  .item-title {
    display: block;
    margin: 0;
    font-size: 1.02rem;
    font-weight: 800;
    line-height: 1.1;
  }

  p {
    grid-column: 2;
    margin: 9px 0 0;
    color: rgba(255, 255, 255, 0.72);
    font-size: 0.9rem;
    line-height: 1.45;
    overflow-wrap: anywhere;
  }

  @media (max-width: 540px) {
    padding: 18px 0;

    &:first-child {
      border-top: 0;
    }
  }
`;

export function TrustBar() {
  return (
    <Section aria-label="Dados de confiança da Mirage">
      <Rail>
        {trustItems.map((item, index) => (
          <Item
            key={item.title}
            className="reveal"
            style={{ "--reveal-delay": `${index * 0.16}s` } as CSSProperties}
          >
            <item.icon size={26} weight="duotone" aria-hidden="true" />
            <strong className="item-title">{item.title}</strong>
            <p>{item.text}</p>
          </Item>
        ))}
      </Rail>
    </Section>
  );
}
