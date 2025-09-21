import { ReactElement, ReactNode } from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { MockedProvider, MockedResponse } from '@apollo/client/testing';
import { ThemeProvider } from 'styled-components';
import { theme } from '../styles/GlobalStyle';

interface ProvidersOptions {
  mocks?: MockedResponse[];
  addTypename?: boolean;
  withApollo?: boolean;
}

type ExtendedRenderOptions = ProvidersOptions & Omit<RenderOptions, 'wrapper'>;

export const renderWithProviders = (
  ui: ReactElement,
  {
    mocks = [],
    addTypename,
    withApollo = true,
    ...renderOptions
  }: ExtendedRenderOptions = {},
) => {
  const Wrapper = ({ children }: { children: ReactNode }) => {
    const content = withApollo ? (
      <MockedProvider
        mocks={mocks}
        {...(addTypename === undefined ? {} : { addTypename })}
      >
        {children}
      </MockedProvider>
    ) : (
      children
    );

    return <ThemeProvider theme={theme}>{content}</ThemeProvider>;
  };

  return render(ui, { wrapper: Wrapper, ...renderOptions });
};
