import styled from 'styled-components';
import type { FC } from 'react';
import { PrimaryText, SecondaryText } from './styles';
import type { SecurityDisplayInfo } from './security-display';
import { isSameSecurityLabel } from './security-display';

const SecurityLabelRoot = styled.span`
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 2px;
  min-width: 0;
`;

const SecurityPrimaryRow = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  min-width: 0;
`;

const SecurityCode = styled.span`
  display: inline-flex;
  align-items: center;
  padding: 1px 6px;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  color: ${({ theme }) => theme.colors.textLight};
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  line-height: 1.4;
`;

export const SecurityLabelList = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  gap: ${({ theme }) => theme.spacing.sm};
`;

interface SecurityLabelProps {
  info: SecurityDisplayInfo;
}

export const SecurityLabel: FC<SecurityLabelProps> = ({ info }) => {
  const shouldShowCode = !isSameSecurityLabel(info.displayName, info.symbol);
  const shouldShowBaseName = !isSameSecurityLabel(
    info.baseName,
    info.displayName,
  );

  return (
    <SecurityLabelRoot>
      <SecurityPrimaryRow>
        <PrimaryText>{info.displayName}</PrimaryText>
        {shouldShowCode ? <SecurityCode>{info.symbol}</SecurityCode> : null}
      </SecurityPrimaryRow>
      {shouldShowBaseName ? (
        <SecondaryText>{info.baseName}</SecondaryText>
      ) : null}
      <SecondaryText>{info.subtitle}</SecondaryText>
    </SecurityLabelRoot>
  );
};
