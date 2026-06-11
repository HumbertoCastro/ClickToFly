import { WhatsappLogo } from "@phosphor-icons/react";
import styled, { keyframes } from "styled-components";
import { whatsAppHref } from "../data";
import { palette, radii } from "../theme";

const float = keyframes`
  0%, 100% {
    transform: translateY(0);
  }

  50% {
    transform: translateY(-5px);
  }
`;

const Link = styled.a`
  position: fixed;
  right: clamp(16px, 3vw, 28px);
  bottom: clamp(16px, 3vw, 28px);
  z-index: 50;
  width: 58px;
  height: 58px;
  display: grid;
  place-items: center;
  border: 1px solid rgba(255, 255, 255, 0.24);
  border-radius: ${radii.pill};
  background: #1fbd61;
  color: ${palette.paper};
  box-shadow: 0 8px 14px rgba(31, 189, 97, 0.28);
  text-decoration: none;
  animation: ${float} 3.4s ease-in-out infinite;

  &:hover,
  &:focus-visible {
    background: #159f50;
    outline: 3px solid rgba(31, 189, 97, 0.24);
    outline-offset: 4px;
  }

  @media (prefers-reduced-motion: reduce) {
    animation: none;
  }
`;

export function FloatingWhatsAppButton() {
  return (
    <Link href={whatsAppHref} target="_blank" rel="noopener noreferrer" aria-label="Chamar a Mirage no WhatsApp">
      <WhatsappLogo size={31} weight="fill" aria-hidden="true" />
    </Link>
  );
}
