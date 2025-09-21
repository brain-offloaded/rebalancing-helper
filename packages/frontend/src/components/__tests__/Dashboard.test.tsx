import userEvent from '@testing-library/user-event';
import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Dashboard } from '../Dashboard';
import { renderWithProviders } from '../../test-utils/render';

vi.mock('../BrokerageAccounts', () => ({
  BrokerageAccounts: () => (
    <div data-testid="accounts">증권사 계정 컴포넌트</div>
  ),
}));

vi.mock('../Holdings', () => ({
  Holdings: () => <div data-testid="holdings">보유 종목 컴포넌트</div>,
}));

vi.mock('../Tags', () => ({
  Tags: () => <div data-testid="tags">태그 컴포넌트</div>,
}));

vi.mock('../RebalancingGroups', () => ({
  RebalancingGroups: () => (
    <div data-testid="rebalancing">리밸런싱 컴포넌트</div>
  ),
}));

describe('Dashboard', () => {
  it('기본 탭에서 증권사 계정 화면을 노출한다', () => {
    renderWithProviders(<Dashboard />, { withApollo: false });

    expect(screen.getByTestId('accounts')).toBeInTheDocument();
  });

  it('탭을 전환하면 대응되는 컴포넌트를 표시한다', async () => {
    const user = userEvent.setup();

    renderWithProviders(<Dashboard />, { withApollo: false });

    await user.click(screen.getByRole('button', { name: '보유 종목' }));
    expect(screen.getByTestId('holdings')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '태그 관리' }));
    expect(screen.getByTestId('tags')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '리밸런싱' }));
    expect(screen.getByTestId('rebalancing')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: '증권사 계정' }));
    expect(screen.getByTestId('accounts')).toBeInTheDocument();
  });
});
