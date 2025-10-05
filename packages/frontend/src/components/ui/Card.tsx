import styled from 'styled-components';

export const Card = styled.div`
  background-color: #ffffff;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.md};
  padding: ${({ theme }) => theme.spacing.lg};
  box-shadow: ${({ theme }) => theme.shadows.sm};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.md};
`;

export const CardHeader = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`;

export const CardTitle = styled.h3`
  margin: 0;
  color: ${({ theme }) => theme.colors.text};
`;

export const CardDescription = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.textLight};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

export const CardActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
`;
