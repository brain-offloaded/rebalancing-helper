import styled from 'styled-components';

export const Tabs = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

export const TabList = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.spacing.sm};
  border-bottom: 2px solid ${({ theme }) => theme.colors.border};
`;

export const TabButton = styled.button<{ $active: boolean }>`
  padding: ${({ theme }) => `${theme.spacing.md} ${theme.spacing.lg}`};
  border: none;
  border-radius: ${({ theme }) => theme.borderRadius.sm}
    ${({ theme }) => theme.borderRadius.sm} 0 0;
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  background-color: ${({ $active, theme }) =>
    $active ? theme.colors.primary : 'transparent'};
  color: ${({ $active, theme }) => ($active ? '#ffffff' : theme.colors.text)};
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    color 0.2s ease;

  &:hover {
    background-color: ${({ $active, theme }) =>
      $active ? theme.colors.primary : theme.colors.light};
  }
`;

export const TabPanel = styled.div`
  min-height: 320px;
`;
