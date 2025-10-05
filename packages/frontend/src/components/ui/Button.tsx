import { forwardRef } from 'react';
import styled, { css, type DefaultTheme } from 'styled-components';
import { theme as defaultTheme } from '../../styles/GlobalStyle';

export type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  block?: boolean;
}

const getColor = (
  theme: DefaultTheme | undefined,
  key: keyof typeof defaultTheme.colors,
) => theme?.colors?.[key] ?? defaultTheme.colors[key];

const getSpacing = (
  theme: DefaultTheme | undefined,
  key: keyof typeof defaultTheme.spacing,
) => theme?.spacing?.[key] ?? defaultTheme.spacing[key];

const getFontSize = (
  theme: DefaultTheme | undefined,
  key: keyof typeof defaultTheme.typography.fontSize,
) =>
  theme?.typography?.fontSize?.[key] ?? defaultTheme.typography.fontSize[key];

const getFontWeight = (
  theme: DefaultTheme | undefined,
  key: keyof typeof defaultTheme.typography.fontWeight,
) =>
  theme?.typography?.fontWeight?.[key] ??
  defaultTheme.typography.fontWeight[key];

const getBorderRadius = (
  theme: DefaultTheme | undefined,
  key: keyof typeof defaultTheme.borderRadius,
) => theme?.borderRadius?.[key] ?? defaultTheme.borderRadius[key];

const variantStyles: Record<ButtonVariant, ReturnType<typeof css>> = {
  primary: css`
    background-color: ${({ theme }) => getColor(theme, 'primary')};
    color: #ffffff;

    &:hover:not(:disabled) {
      background-color: ${({ theme }) =>
        theme?.colors?.primaryHover ?? '#0b4cc4'};
    }
  `,
  secondary: css`
    background-color: ${({ theme }) => getColor(theme, 'light')};
    color: ${({ theme }) => getColor(theme, 'text')};
    border: 1px solid ${({ theme }) => getColor(theme, 'border')};

    &:hover:not(:disabled) {
      background-color: ${({ theme }) =>
        theme?.colors?.lightHover ?? '#e5e7eb'};
    }
  `,
  danger: css`
    background-color: ${({ theme }) => getColor(theme, 'danger')};
    color: #ffffff;

    &:hover:not(:disabled) {
      background-color: ${({ theme }) =>
        theme?.colors?.dangerHover ?? '#c82333'};
    }
  `,
  ghost: css`
    background-color: transparent;
    color: ${({ theme }) => getColor(theme, 'text')};

    &:hover:not(:disabled) {
      background-color: ${({ theme }) => getColor(theme, 'light')};
    }
  `,
};

const sizeStyles: Record<ButtonSize, ReturnType<typeof css>> = {
  sm: css`
    padding: ${({ theme }) =>
      `${getSpacing(theme, 'xs')} ${getSpacing(theme, 'sm')}`};
    font-size: ${({ theme }) => getFontSize(theme, 'xs')};
  `,
  md: css`
    padding: ${({ theme }) =>
      `${getSpacing(theme, 'sm')} ${getSpacing(theme, 'md')}`};
    font-size: ${({ theme }) => getFontSize(theme, 'sm')};
  `,
};

const StyledButton = styled.button<
  Required<Pick<ButtonProps, 'variant' | 'size'>> & {
    $block?: boolean;
  }
>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => getSpacing(theme, 'xs')};
  border: none;
  border-radius: ${({ theme }) => getBorderRadius(theme, 'sm')};
  font-weight: ${({ theme }) => getFontWeight(theme, 'medium')};
  cursor: pointer;
  transition:
    background-color 0.2s ease,
    color 0.2s ease,
    opacity 0.2s ease;
  text-align: center;
  width: ${({ $block }) => ($block ? '100%' : 'auto')};

  ${({ variant }) => variantStyles[variant]};
  ${({ size }) => sizeStyles[size]};

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      variant = 'secondary',
      size = 'md',
      block,
      type = 'button',
      ...props
    },
    ref,
  ) => (
    <StyledButton
      ref={ref}
      variant={variant}
      size={size}
      type={type}
      $block={block}
      {...props}
    >
      {children}
    </StyledButton>
  ),
);

Button.displayName = 'Button';

export const ButtonGroup = styled.div`
  display: inline-flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => getSpacing(theme, 'sm')};
`;

export const IconButton = styled(StyledButton).attrs<{ 'aria-label'?: string }>(
  () => ({
    type: 'button',
    size: 'sm',
  }),
)<Required<Pick<ButtonProps, 'variant'>> & { $block?: boolean }>`
  width: 32px;
  height: 32px;
  padding: 0;
  border-radius: 50%;
`;
