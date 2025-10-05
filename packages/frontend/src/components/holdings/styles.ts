import styled from 'styled-components';
import { ButtonGroup } from '../ui/Button';

export const CellContent = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
`;

export const PrimaryText = styled.span`
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
  color: ${({ theme }) => theme.colors.text};
`;

export const SecondaryText = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.textLight};
`;

export const TagContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.xs};
`;

export const PriceWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.spacing.xs};
`;

export const ModalSection = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.sm};
`;

export const ModalRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.sm};
`;

export const InlineLabel = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.textLight};
`;

export const ValueBadge = styled.span`
  display: inline-flex;
  align-items: center;
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.sm}`};
  background-color: ${({ theme }) => theme.colors.light};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

export const TagList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.xs};
`;

export const TagChip = styled.span<{ color: string }>`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.spacing.xs};
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.sm}`};
  background-color: ${({ color }) => color};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  color: #ffffff;
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
`;

export const TagRemoveButton = styled.button`
  border: none;
  background: transparent;
  color: inherit;
  cursor: pointer;
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

export const TagActions = styled(ButtonGroup)`
  flex-wrap: wrap;
`;

export const QuantityInput = styled.input<{ $invalid?: boolean }>`
  width: 120px;
  padding: ${({ theme }) => `${theme.spacing.xs} ${theme.spacing.sm}`};
  border: 1px solid
    ${({ $invalid, theme }) =>
      $invalid ? theme.colors.danger : theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};

  &:focus {
    outline: none;
    border-color: ${({ $invalid, theme }) =>
      $invalid ? theme.colors.danger : theme.colors.primary};
    box-shadow: 0 0 0 1px
      ${({ $invalid, theme }) =>
        ($invalid ? theme.colors.danger : theme.colors.primary) + '33'};
  }
`;

export const HelperText = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.textLight};
`;

export const ManualForm = styled.form`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
  align-items: flex-end;
`;

export const ManualFormGroup = styled.label`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
  font-size: ${({ theme }) => theme.typography.fontSize.sm};
`;

export const ManualInput = styled.input`
  padding: ${({ theme }) => theme.spacing.xs};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  min-width: 120px;
`;

export const ManualSelect = styled.select`
  padding: ${({ theme }) => theme.spacing.xs};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  min-width: 160px;
`;
