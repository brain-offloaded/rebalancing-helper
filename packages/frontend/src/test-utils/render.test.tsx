import { ReactNode } from 'react';
import { beforeEach, describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from './render';

const MockedProviderMock = vi.hoisted(() =>
  vi.fn(({ children }: { children: ReactNode }) => (
    <div data-testid="mocked-provider">{children}</div>
  )),
);

vi.mock('@apollo/client/testing', () => ({
  MockedProvider: MockedProviderMock,
}));

beforeEach(() => {
  MockedProviderMock.mockClear();
});

describe('renderWithProviders', () => {
  it('Apollo Provider를 포함하여 컴포넌트를 렌더링한다', () => {
    renderWithProviders(<div data-testid="content" />);

    expect(screen.getByTestId('content')).toBeInTheDocument();
    expect(MockedProviderMock).toHaveBeenCalled();
  });

  it('withApollo 옵션이 false이면 Apollo Provider 없이 렌더링한다', () => {
    renderWithProviders(<div data-testid="plain-content" />, {
      withApollo: false,
    });

    expect(screen.getByTestId('plain-content')).toBeInTheDocument();
    expect(MockedProviderMock).not.toHaveBeenCalled();
  });

  it('addTypename 옵션을 명시하면 MockedProvider에 전달한다', () => {
    renderWithProviders(<div />, { addTypename: false });

    expect(MockedProviderMock).toHaveBeenCalledWith(
      expect.objectContaining({ addTypename: false }),
      expect.anything(),
    );
  });
});
