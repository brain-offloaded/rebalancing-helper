import userEvent from '@testing-library/user-event';
import { screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../../test-utils/render';
import { Holdings } from '../Holdings';
import {
  GET_BROKERAGE_HOLDINGS,
  INCREMENT_BROKERAGE_HOLDING_QUANTITY,
  SET_BROKERAGE_HOLDING_QUANTITY,
  SYNC_BROKERAGE_HOLDING_PRICE,
} from '../../graphql/brokerage';
import { GET_TAGS } from '../../graphql/tags';
import { GET_TAGS_FOR_HOLDING, SET_HOLDING_TAGS } from '../../graphql/holdings';

const mockUseQuery = vi.fn();
const mockUseMutation = vi.fn();

vi.mock('@apollo/client', async () => {
  const actual =
    await vi.importActual<typeof import('@apollo/client')>('@apollo/client');

  return {
    ...actual,
    useQuery: (...args: Parameters<typeof actual.useQuery>) =>
      mockUseQuery(...args),
    useMutation: (...args: Parameters<typeof actual.useMutation>) =>
      mockUseMutation(...args),
  };
});

describe('Holdings', () => {
  beforeEach(() => {
    mockUseQuery.mockReset();
    mockUseMutation.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('보유 종목을 불러오는 동안 로딩 메시지를 보여준다', () => {
    mockUseQuery.mockImplementation((query) => {
      if (query === GET_BROKERAGE_HOLDINGS) {
        return {
          data: undefined,
          loading: true,
          error: undefined,
          refetch: vi.fn(),
        };
      }
      if (query === GET_TAGS) {
        return { data: undefined, loading: false, error: undefined };
      }
      if (query === GET_TAGS_FOR_HOLDING) {
        return { data: undefined, loading: false, refetch: vi.fn() };
      }

      throw new Error('예상치 못한 쿼리 호출');
    });
    mockUseMutation.mockImplementation(() => [vi.fn(), { loading: false }]);

    renderWithProviders(<Holdings />, { withApollo: false });

    expect(screen.getByText('로딩 중...')).toBeInTheDocument();
  });

  it('보유 종목 정보를 테이블에 표시한다', () => {
    const holdings = [
      {
        id: 'holding-1',
        symbol: 'AAPL',
        name: '애플',
        quantity: 12,
        currentPrice: 190.23,
        marketValue: 2282.76,
        averageCost: 150.1,
        currency: 'USD',
        accountId: 'acc-1',
        lastUpdated: new Date().toISOString(),
      },
    ];

    mockUseQuery.mockImplementation((query) => {
      if (query === GET_BROKERAGE_HOLDINGS) {
        return {
          data: { brokerageHoldings: holdings },
          loading: false,
          refetch: vi.fn(),
        };
      }
      if (query === GET_TAGS) {
        return { data: { tags: [] }, loading: false };
      }
      if (query === GET_TAGS_FOR_HOLDING) {
        return { data: undefined, loading: false, refetch: vi.fn() };
      }

      throw new Error('예상치 못한 쿼리 호출');
    });
    mockUseMutation.mockImplementation(() => [vi.fn(), { loading: false }]);

    renderWithProviders(<Holdings />, { withApollo: false });

    expect(screen.getByText('AAPL')).toBeInTheDocument();
    expect(screen.getByText('애플')).toBeInTheDocument();
    expect(screen.getByText('12')).toBeInTheDocument();
    expect(screen.getByText('$190.23')).toBeInTheDocument();
    expect(screen.getByText('$2282.76')).toBeInTheDocument();
    expect(screen.getByText('$150.10')).toBeInTheDocument();
  });

  it('태그 관리 모달에서 태그를 갱신한다', async () => {
    const holdings = [
      {
        id: 'holding-1',
        symbol: 'AAPL',
        name: '애플',
        quantity: 5,
        currentPrice: 180,
        marketValue: 900,
        averageCost: 150,
        currency: 'USD',
        accountId: 'acc-1',
        lastUpdated: new Date().toISOString(),
      },
    ];
    const tags = [
      { id: 'tag-1', name: '성장주', description: '성장', color: '#ff0000' },
      { id: 'tag-2', name: '배당주', description: '배당', color: '#00ff00' },
    ];
    const refetchHoldingTags = vi.fn();
    const setHoldingTags = vi.fn().mockResolvedValue({});

    mockUseQuery.mockImplementation((query, options) => {
      if (query === GET_BROKERAGE_HOLDINGS) {
        return {
          data: { brokerageHoldings: holdings },
          loading: false,
          refetch: vi.fn(),
        };
      }
      if (query === GET_TAGS) {
        return { data: { tags }, loading: false };
      }
      if (query === GET_TAGS_FOR_HOLDING) {
        if (options?.skip || !options?.variables?.holdingSymbol) {
          return {
            data: undefined,
            loading: false,
            refetch: refetchHoldingTags,
          };
        }

        return {
          data: { tagsForHolding: ['tag-1'] },
          loading: false,
          refetch: refetchHoldingTags,
        };
      }

      throw new Error('예상치 못한 쿼리 호출');
    });
    mockUseMutation.mockImplementation((document) => {
      if (document === SET_HOLDING_TAGS) {
        return [setHoldingTags, { loading: false }];
      }

      return [vi.fn(), { loading: false }];
    });

    const user = userEvent.setup();

    renderWithProviders(<Holdings />, { withApollo: false });

    await user.click(screen.getByRole('button', { name: '태그 관리' }));

    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes[0]).toBeChecked();
    expect(checkboxes[1]).not.toBeChecked();

    await user.click(checkboxes[1]);
    await user.click(screen.getByRole('button', { name: '적용' }));

    await waitFor(() => {
      expect(setHoldingTags).toHaveBeenCalledWith({
        variables: {
          input: {
            holdingSymbol: 'AAPL',
            tagIds: ['tag-1', 'tag-2'],
          },
        },
      });
    });

    expect(refetchHoldingTags).toHaveBeenCalled();

    await waitFor(() => {
      expect(screen.queryByText('AAPL 태그 관리')).not.toBeInTheDocument();
    });
  });

  it('태그 정보를 불러오는 동안 모달에서 로딩 메시지를 보여준다', async () => {
    const holdings = [
      {
        id: 'holding-1',
        symbol: 'AAPL',
        name: '애플',
        quantity: 5,
        currentPrice: 180,
        marketValue: 900,
        averageCost: 150,
        currency: 'USD',
        accountId: 'acc-1',
        lastUpdated: new Date().toISOString(),
      },
    ];
    const tags = [
      { id: 'tag-1', name: '성장주', description: '성장', color: '#ff0000' },
    ];

    mockUseQuery.mockImplementation((query, options) => {
      if (query === GET_BROKERAGE_HOLDINGS) {
        return {
          data: { brokerageHoldings: holdings },
          loading: false,
          refetch: vi.fn(),
        };
      }
      if (query === GET_TAGS) {
        return { data: { tags }, loading: false };
      }
      if (query === GET_TAGS_FOR_HOLDING) {
        if (options?.skip || !options?.variables?.holdingSymbol) {
          return { data: undefined, loading: false, refetch: vi.fn() };
        }

        return { data: undefined, loading: true, refetch: vi.fn() };
      }

      throw new Error('예상치 못한 쿼리 호출');
    });
    mockUseMutation.mockImplementation(() => [vi.fn(), { loading: false }]);

    const user = userEvent.setup();

    renderWithProviders(<Holdings />, { withApollo: false });

    await user.click(screen.getByRole('button', { name: '태그 관리' }));

    expect(screen.getByText('태그를 불러오는 중...')).toBeInTheDocument();
  });

  it('수량 조정 모달에서 수량을 증가시킨다', async () => {
    const holdings = [
      {
        id: 'holding-1',
        symbol: 'AAPL',
        name: '애플',
        quantity: 5,
        currentPrice: 180,
        marketValue: 900,
        averageCost: 150,
        currency: 'USD',
        accountId: 'acc-1',
        lastUpdated: new Date().toISOString(),
      },
    ];
    const refetchHoldings = vi.fn();
    const incrementHolding = vi.fn().mockResolvedValue({});

    mockUseQuery.mockImplementation((query, options) => {
      if (query === GET_BROKERAGE_HOLDINGS) {
        return {
          data: { brokerageHoldings: holdings },
          loading: false,
          refetch: refetchHoldings,
        };
      }
      if (query === GET_TAGS) {
        return { data: { tags: [] }, loading: false };
      }
      if (query === GET_TAGS_FOR_HOLDING) {
        if (options?.skip || !options?.variables?.holdingSymbol) {
          return { data: undefined, loading: false, refetch: vi.fn() };
        }

        return { data: { tagsForHolding: [] }, loading: false, refetch: vi.fn() };
      }

      throw new Error('예상치 못한 쿼리 호출');
    });
    mockUseMutation.mockImplementation((document) => {
      if (document === INCREMENT_BROKERAGE_HOLDING_QUANTITY) {
        return [incrementHolding, { loading: false }];
      }

      return [vi.fn(), { loading: false }];
    });

    const user = userEvent.setup();

    renderWithProviders(<Holdings />, { withApollo: false });

    await user.click(screen.getByRole('button', { name: '수량 조정' }));

    const incrementInput = screen.getByLabelText('추가 수량');
    const incrementButton = screen.getByRole('button', { name: '수량 증가' });
    expect(incrementButton).toBeDisabled();

    await user.type(incrementInput, '3');
    expect(incrementButton).not.toBeDisabled();

    await user.click(incrementButton);

    await waitFor(() => {
      expect(incrementHolding).toHaveBeenCalledWith({
        variables: {
          input: {
            holdingId: 'holding-1',
            quantityDelta: 3,
          },
        },
      });
    });
    expect(refetchHoldings).toHaveBeenCalled();
  });

  it('수량 조정 모달에서 절대 수량을 설정한다', async () => {
    const holdings = [
      {
        id: 'holding-1',
        symbol: 'AAPL',
        name: '애플',
        quantity: 5,
        currentPrice: 180,
        marketValue: 900,
        averageCost: 150,
        currency: 'USD',
        accountId: 'acc-1',
        lastUpdated: new Date().toISOString(),
      },
    ];
    const refetchHoldings = vi.fn();
    const setHoldingQuantity = vi.fn().mockResolvedValue({});

    mockUseQuery.mockImplementation((query, options) => {
      if (query === GET_BROKERAGE_HOLDINGS) {
        return {
          data: { brokerageHoldings: holdings },
          loading: false,
          refetch: refetchHoldings,
        };
      }
      if (query === GET_TAGS) {
        return { data: { tags: [] }, loading: false };
      }
      if (query === GET_TAGS_FOR_HOLDING) {
        if (options?.skip || !options?.variables?.holdingSymbol) {
          return { data: undefined, loading: false, refetch: vi.fn() };
        }

        return { data: { tagsForHolding: [] }, loading: false, refetch: vi.fn() };
      }

      throw new Error('예상치 못한 쿼리 호출');
    });
    mockUseMutation.mockImplementation((document) => {
      if (document === SET_BROKERAGE_HOLDING_QUANTITY) {
        return [setHoldingQuantity, { loading: false }];
      }

      return [vi.fn(), { loading: false }];
    });

    const user = userEvent.setup();

    renderWithProviders(<Holdings />, { withApollo: false });

    await user.click(screen.getByRole('button', { name: '수량 조정' }));

    const setInput = screen.getByLabelText('설정 수량');
    const setButton = screen.getByRole('button', { name: '수량 설정' });
    expect(setButton).toBeDisabled();

    await user.clear(setInput);
    await user.type(setInput, '12.5');
    expect(setButton).not.toBeDisabled();

    await user.click(setButton);

    await waitFor(() => {
      expect(setHoldingQuantity).toHaveBeenCalledWith({
        variables: {
          input: {
            holdingId: 'holding-1',
            quantity: 12.5,
          },
        },
      });
    });
    expect(refetchHoldings).toHaveBeenCalled();
  });

  it('수량 조정 모달에서 현재가를 동기화한다', async () => {
    const holdings = [
      {
        id: 'holding-1',
        symbol: 'AAPL',
        name: '애플',
        quantity: 5,
        currentPrice: 180,
        marketValue: 900,
        averageCost: 150,
        currency: 'USD',
        accountId: 'acc-1',
        lastUpdated: new Date().toISOString(),
      },
    ];
    const refetchHoldings = vi.fn();
    const syncHoldingPrice = vi.fn().mockResolvedValue({});

    mockUseQuery.mockImplementation((query, options) => {
      if (query === GET_BROKERAGE_HOLDINGS) {
        return {
          data: { brokerageHoldings: holdings },
          loading: false,
          refetch: refetchHoldings,
        };
      }
      if (query === GET_TAGS) {
        return { data: { tags: [] }, loading: false };
      }
      if (query === GET_TAGS_FOR_HOLDING) {
        if (options?.skip || !options?.variables?.holdingSymbol) {
          return { data: undefined, loading: false, refetch: vi.fn() };
        }

        return { data: { tagsForHolding: [] }, loading: false, refetch: vi.fn() };
      }

      throw new Error('예상치 못한 쿼리 호출');
    });
    mockUseMutation.mockImplementation((document) => {
      if (document === SYNC_BROKERAGE_HOLDING_PRICE) {
        return [syncHoldingPrice, { loading: false }];
      }

      return [vi.fn(), { loading: false }];
    });

    const user = userEvent.setup();

    renderWithProviders(<Holdings />, { withApollo: false });

    await user.click(screen.getByRole('button', { name: '수량 조정' }));

    await user.click(screen.getByRole('button', { name: '현재가 동기화' }));

    await waitFor(() => {
      expect(syncHoldingPrice).toHaveBeenCalledWith({
        variables: {
          input: {
            holdingId: 'holding-1',
          },
        },
      });
    });
    expect(refetchHoldings).toHaveBeenCalled();
  });
});
