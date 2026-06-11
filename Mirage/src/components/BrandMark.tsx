import styled from "styled-components";
import { palette } from "../theme";

const Mark = styled.span<{ $compact?: boolean; $dark?: boolean }>`
  display: inline-grid;
  justify-items: center;
  min-width: ${(props) => (props.$compact ? "112px" : "154px")};
  color: ${(props) => (props.$dark ? palette.paper : palette.navy)};
  text-decoration: none;
  line-height: 1;
`;

const Name = styled.span<{ $compact?: boolean }>`
  position: relative;
  display: inline-block;
  font-family: "Archivo", ui-sans-serif, system-ui, sans-serif;
  font-size: ${(props) => (props.$compact ? "1.54rem" : "2.55rem")};
  font-weight: 800;
  letter-spacing: -0.04em;

  &::after {
    content: "";
    position: absolute;
    left: 0.07em;
    right: 0.03em;
    bottom: -0.06em;
    height: 2px;
    background: currentColor;
  }
`;

const Sub = styled.span<{ $compact?: boolean }>`
  margin-top: ${(props) => (props.$compact ? "5px" : "8px")};
  font-size: ${(props) => (props.$compact ? "0.57rem" : "0.74rem")};
  font-weight: 800;
  letter-spacing: ${(props) => (props.$compact ? "0.22em" : "0.28em")};
  text-transform: uppercase;
`;

type BrandMarkProps = {
  compact?: boolean;
  dark?: boolean;
  className?: string;
};

export function BrandMark({ compact, dark, className }: BrandMarkProps) {
  return (
    <Mark $compact={compact} $dark={dark} className={className} aria-label="Mirage Eyewear">
      <Name $compact={compact}>Mirage</Name>
      <Sub $compact={compact}>Eyewear</Sub>
    </Mark>
  );
}
