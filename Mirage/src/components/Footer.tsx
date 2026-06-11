import styled from "styled-components";
import { whatsAppHref } from "../data";
import { layout, palette } from "../theme";
import { BrandMark } from "./BrandMark";

const FooterShell = styled.footer`
  padding: 30px 0 92px;
  background: ${palette.paper};
  color: ${palette.ink};
`;

const Inner = styled.div`
  width: min(100% - 32px, ${layout.max});
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  gap: 26px;
  align-items: center;
  border-top: 1px solid ${palette.line};
  padding-top: 24px;

  @media (max-width: 680px) {
    align-items: flex-start;
    flex-direction: column;
  }
`;

const Meta = styled.div`
  display: grid;
  gap: 7px;
  color: ${palette.muted};
  font-size: 0.92rem;

  a {
    color: ${palette.navy};
    font-weight: 800;
    text-decoration: none;
  }
`;

export function Footer() {
  return (
    <FooterShell>
      <Inner className="reveal">
        <BrandMark compact />
        <Meta>
          <span>Mirage Eyewear. Óculos consignados desde 1994.</span>
          <a href={whatsAppHref} target="_blank" rel="noopener noreferrer">
            WhatsApp: (31) 97114-0018
          </a>
        </Meta>
      </Inner>
    </FooterShell>
  );
}
