import { createGlobalStyle } from 'styled-components';

export const theme = {
  colors: {
    primary: '#007bff',
    secondary: '#6c757d',
    success: '#28a745',
    danger: '#dc3545',
    warning: '#ffc107',
    info: '#17a2b8',
    light: '#f8f9fa',
    dark: '#343a40',
    background: '#ffffff',
    surface: '#f8f9fa',
    text: '#212529',
    textLight: '#6c757d',
    border: '#dee2e6',
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
    xxl: '48px',
  },
  typography: {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
    fontSize: {
      xs: '12px',
      sm: '14px',
      md: '16px',
      lg: '18px',
      xl: '20px',
      xxl: '24px',
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
  },
  borderRadius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
  },
  shadows: {
    sm: '0 1px 3px rgba(0, 0, 0, 0.1)',
    md: '0 4px 6px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px rgba(0, 0, 0, 0.1)',
  },
};

export const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  body {
    font-family: ${theme.typography.fontFamily};
    font-size: ${theme.typography.fontSize.md};
    line-height: 1.5;
    color: ${theme.colors.text};
    background-color: ${theme.colors.background};
  }

  h1, h2, h3, h4, h5, h6 {
    font-weight: ${theme.typography.fontWeight.semibold};
    margin-bottom: ${theme.spacing.md};
  }

  h1 {
    font-size: ${theme.typography.fontSize.xxl};
  }

  h2 {
    font-size: ${theme.typography.fontSize.xl};
  }

  h3 {
    font-size: ${theme.typography.fontSize.lg};
  }

  button {
    font-family: inherit;
    cursor: pointer;
    border: none;
    outline: none;
    background: none;
  }

  input, select, textarea {
    font-family: inherit;
    font-size: inherit;
    border: 1px solid ${theme.colors.border};
    border-radius: ${theme.borderRadius.sm};
    padding: ${theme.spacing.sm} ${theme.spacing.md};
    outline: none;
    
    &:focus {
      border-color: ${theme.colors.primary};
      box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
    }
  }

  a {
    color: ${theme.colors.primary};
    text-decoration: none;
    
    &:hover {
      text-decoration: underline;
    }
  }
`;