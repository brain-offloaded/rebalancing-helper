import styled from 'styled-components';

export const Form = styled.form`
  display: grid;
  gap: ${({ theme }) => theme.spacing.md};
`;

export const FormGrid = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.spacing.md};
`;

export const FormRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.spacing.sm};
  align-items: center;
`;

export const Field = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.spacing.xs};
`;

export const FieldLabel = styled.label`
  font-weight: ${({ theme }) => theme.typography.fontWeight.medium};
`;

export const TextInput = styled.input`
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  width: 100%;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 2px rgba(14, 116, 239, 0.2);
  }

  &:disabled {
    background-color: ${({ theme }) => theme.colors.light};
    cursor: not-allowed;
  }
`;

export const TextArea = styled.textarea`
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  width: 100%;
  min-height: 80px;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 2px rgba(14, 116, 239, 0.2);
  }
`;

export const Select = styled.select`
  padding: ${({ theme }) => `${theme.spacing.sm} ${theme.spacing.md}`};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.borderRadius.sm};
  font-size: ${({ theme }) => theme.typography.fontSize.md};
  background-color: #ffffff;

  &:focus {
    outline: none;
    border-color: ${({ theme }) => theme.colors.primary};
    box-shadow: 0 0 0 2px rgba(14, 116, 239, 0.2);
  }
`;

export const HelperText = styled.span`
  font-size: ${({ theme }) => theme.typography.fontSize.xs};
  color: ${({ theme }) => theme.colors.textLight};
`;
