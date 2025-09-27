import userEvent from '@testing-library/user-event';
import { screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../../test-utils/render';
import { Holdings } from '../Holdings';
import { GET_BROKERAGE_HOLDINGS } from '../../graphql/brokerage';
import { GET_MARKETS } from '../../graphql/markets';
import { GET_TAGS } from '../../graphql/tags';
import {
  GET_TAGS_FOR_HOLDING,
  SET_HOLDING_TAGS,
  GET_MANUAL_HOLDINGS,
  CREATE_MANUAL_HOLDING,
  INCREASE_MANUAL_HOLDING,
  SET_MANUAL_HOLDING_QUANTITY,
  DELETE_MANUAL_HOLDING,
  SYNC_MANUAL_HOLDING_PRICE,
} from '../../graphql/holdings';

const mockUseQuery = vi.fn();
const mockUseMutation = vi.fn();
const defaultMarkets = [
  { id: 'market-us', code: 'US', displayName: '미국', yahooSuffix: null },
];

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
      if (query === GET_MARKETS) {
        return { data: { markets: defaultMarkets }, loading: false };
      }
      if (query === GET_BROKERAGE_HOLDINGS) {
        return { data: undefined, loading: true, error: undefined };
      }
      if (query === GET_MANUAL_HOLDINGS) {
        return {
          data: { manualHoldings: [] },
          loading: false,
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
      if (query === GET_MARKETS) {
        return { data: { markets: defaultMarkets }, loading: false };
      }
      if (query === GET_BROKERAGE_HOLDINGS) {
        return { data: { brokerageHoldings: holdings }, loading: false };
      }
      if (query === GET_MANUAL_HOLDINGS) {
        return {
          data: { manualHoldings: [] },
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
      if (query === GET_MARKETS) {
        return { data: { markets: defaultMarkets }, loading: false };
      }
      if (query === GET_BROKERAGE_HOLDINGS) {
        return { data: { brokerageHoldings: holdings }, loading: false };
      }
      if (query === GET_MANUAL_HOLDINGS) {
        return {
          data: { manualHoldings: [] },
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
      if (query === GET_MARKETS) {
        return { data: { markets: defaultMarkets }, loading: false };
      }
      if (query === GET_BROKERAGE_HOLDINGS) {
        return { data: { brokerageHoldings: holdings }, loading: false };
      }
      if (query === GET_MANUAL_HOLDINGS) {
        return {
          data: { manualHoldings: [] },
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

  describe('수동 보유 종목 관리', () => {
    it('수동 보유 종목을 테이블에 표시한다', () => {
      const holdings = [
        {
          id: 'manual-1',
          market: 'US',
          symbol: 'VOO',
          name: 'Vanguard S&P 500 ETF',
          quantity: 2,
          currentPrice: 412.35,
          marketValue: 824.7,
          currency: 'USD',
          lastUpdated: new Date('2024-01-01T00:00:00Z').toISOString(),
        },
      ];

      mockUseQuery.mockImplementation((query) => {
        if (query === GET_MARKETS) {
          return { data: { markets: defaultMarkets }, loading: false };
        }
        if (query === GET_BROKERAGE_HOLDINGS) {
          return { data: { brokerageHoldings: [] }, loading: false };
        }
        if (query === GET_MANUAL_HOLDINGS) {
          return {
            data: { manualHoldings: holdings },
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

      expect(screen.getByText('수동 보유 종목')).toBeInTheDocument();
      expect(screen.getByText('VOO')).toBeInTheDocument();
      expect(screen.getByText('US')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('$412.35')).toBeInTheDocument();
    });

    it('새로운 수동 보유 종목을 등록한다', async () => {
      const user = userEvent.setup();
      const refetchManualHoldings = vi.fn();
      const createManualHolding = vi.fn().mockResolvedValue({});

      mockUseQuery.mockImplementation((query) => {
        if (query === GET_MARKETS) {
          return { data: { markets: defaultMarkets }, loading: false };
        }
        if (query === GET_BROKERAGE_HOLDINGS) {
          return { data: { brokerageHoldings: [] }, loading: false };
        }
        if (query === GET_MANUAL_HOLDINGS) {
          return {
            data: { manualHoldings: [] },
            loading: false,
            refetch: refetchManualHoldings,
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
      mockUseMutation.mockImplementation((document) => {
        if (document === CREATE_MANUAL_HOLDING) {
          return [createManualHolding, { loading: false }];
        }

        return [vi.fn(), { loading: false }];
      });

      renderWithProviders(<Holdings />, { withApollo: false });

      await user.selectOptions(screen.getByLabelText('시장'), 'US');
      await user.type(screen.getByLabelText('종목 코드'), 'VOO');
      await user.type(screen.getByLabelText('수량'), '2');
      await user.click(screen.getByRole('button', { name: '수동 추가' }));

      await waitFor(() => {
        expect(createManualHolding).toHaveBeenCalledWith({
          variables: {
            input: {
              market: 'US',
              symbol: 'VOO',
              quantity: 2,
            },
          },
        });
      });

      expect(refetchManualHoldings).toHaveBeenCalled();
    });

    it('수동 보유 종목 수량을 증가시킨다', async () => {
      const user = userEvent.setup();
      const refetchManualHoldings = vi.fn();
      const increaseManualHolding = vi.fn().mockResolvedValue({});
      const originalPrompt = window.prompt;
      window.prompt = vi.fn().mockReturnValue('3');

      mockUseQuery.mockImplementation((query) => {
        if (query === GET_MARKETS) {
          return { data: { markets: defaultMarkets }, loading: false };
        }
        if (query === GET_BROKERAGE_HOLDINGS) {
          return { data: { brokerageHoldings: [] }, loading: false };
        }
        if (query === GET_MANUAL_HOLDINGS) {
          return {
            data: {
              manualHoldings: [
                {
                  id: 'manual-1',
                  market: 'US',
                  symbol: 'VOO',
                  name: 'VOO',
                  quantity: 2,
                  currentPrice: 400,
                  marketValue: 800,
                  currency: 'USD',
                  lastUpdated: new Date().toISOString(),
                },
              ],
            },
            loading: false,
            refetch: refetchManualHoldings,
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
      mockUseMutation.mockImplementation((document) => {
        if (document === INCREASE_MANUAL_HOLDING) {
          return [increaseManualHolding, { loading: false }];
        }

        return [vi.fn(), { loading: false }];
      });

      renderWithProviders(<Holdings />, { withApollo: false });

      await user.click(screen.getByRole('button', { name: '수량 증가' }));

      await waitFor(() => {
        expect(window.prompt).toHaveBeenCalled();
        expect(increaseManualHolding).toHaveBeenCalledWith({
          variables: {
            input: {
              market: 'US',
              symbol: 'VOO',
              quantityDelta: 3,
            },
          },
        });
      });

      expect(refetchManualHoldings).toHaveBeenCalled();
      window.prompt = originalPrompt;
    });

    it('수동 보유 종목 수량을 설정한다', async () => {
      const user = userEvent.setup();
      const refetchManualHoldings = vi.fn();
      const setManualHoldingQuantity = vi.fn().mockResolvedValue({});
      const originalPrompt = window.prompt;
      window.prompt = vi.fn().mockReturnValue('5');

      mockUseQuery.mockImplementation((query) => {
        if (query === GET_MARKETS) {
          return { data: { markets: defaultMarkets }, loading: false };
        }
        if (query === GET_BROKERAGE_HOLDINGS) {
          return { data: { brokerageHoldings: [] }, loading: false };
        }
        if (query === GET_MANUAL_HOLDINGS) {
          return {
            data: {
              manualHoldings: [
                {
                  id: 'manual-2',
                  market: 'US',
                  symbol: 'VOO',
                  name: 'VOO',
                  quantity: 2,
                  currentPrice: 400,
                  marketValue: 800,
                  currency: 'USD',
                  lastUpdated: new Date().toISOString(),
                },
              ],
            },
            loading: false,
            refetch: refetchManualHoldings,
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
      mockUseMutation.mockImplementation((document) => {
        if (document === SET_MANUAL_HOLDING_QUANTITY) {
          return [setManualHoldingQuantity, { loading: false }];
        }

        return [vi.fn(), { loading: false }];
      });

      renderWithProviders(<Holdings />, { withApollo: false });

      await user.click(screen.getByRole('button', { name: '수량 설정' }));

      await waitFor(() => {
        expect(setManualHoldingQuantity).toHaveBeenCalledWith({
          variables: {
            input: {
              market: 'US',
              symbol: 'VOO',
              quantity: 5,
            },
          },
        });
      });

      expect(refetchManualHoldings).toHaveBeenCalled();
      window.prompt = originalPrompt;
    });

    it('수동 보유 종목을 삭제한다', async () => {
      const user = userEvent.setup();
      const refetchManualHoldings = vi.fn();
      const deleteManualHolding = vi.fn().mockResolvedValue({});

      mockUseQuery.mockImplementation((query) => {
        if (query === GET_MARKETS) {
          return { data: { markets: defaultMarkets }, loading: false };
        }
        if (query === GET_BROKERAGE_HOLDINGS) {
          return { data: { brokerageHoldings: [] }, loading: false };
        }
        if (query === GET_MANUAL_HOLDINGS) {
          return {
            data: {
              manualHoldings: [
                {
                  id: 'manual-3',
                  market: 'US',
                  symbol: 'VOO',
                  name: 'VOO',
                  quantity: 2,
                  currentPrice: 400,
                  marketValue: 800,
                  currency: 'USD',
                  lastUpdated: new Date().toISOString(),
                },
              ],
            },
            loading: false,
            refetch: refetchManualHoldings,
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
      mockUseMutation.mockImplementation((document) => {
        if (document === DELETE_MANUAL_HOLDING) {
          return [deleteManualHolding, { loading: false }];
        }

        return [vi.fn(), { loading: false }];
      });

      renderWithProviders(<Holdings />, { withApollo: false });

      await user.click(screen.getByRole('button', { name: '삭제' }));

      await waitFor(() => {
        expect(deleteManualHolding).toHaveBeenCalledWith({
          variables: {
            input: {
              market: 'US',
              symbol: 'VOO',
            },
          },
        });
      });

      expect(refetchManualHoldings).toHaveBeenCalled();
    });

    it('수동 보유 종목 가격을 동기화한다', async () => {
      const user = userEvent.setup();
      const refetchManualHoldings = vi.fn();
      const syncManualHoldingPrice = vi.fn().mockResolvedValue({});

      mockUseQuery.mockImplementation((query) => {
        if (query === GET_MARKETS) {
          return { data: { markets: defaultMarkets }, loading: false };
        }
        if (query === GET_BROKERAGE_HOLDINGS) {
          return { data: { brokerageHoldings: [] }, loading: false };
        }
        if (query === GET_MANUAL_HOLDINGS) {
          return {
            data: {
              manualHoldings: [
                {
                  id: 'manual-4',
                  market: 'US',
                  symbol: 'VOO',
                  name: 'VOO',
                  quantity: 2,
                  currentPrice: 400,
                  marketValue: 800,
                  currency: 'USD',
                  lastUpdated: new Date().toISOString(),
                },
              ],
            },
            loading: false,
            refetch: refetchManualHoldings,
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
      mockUseMutation.mockImplementation((document) => {
        if (document === SYNC_MANUAL_HOLDING_PRICE) {
          return [syncManualHoldingPrice, { loading: false }];
        }

        return [vi.fn(), { loading: false }];
      });

      renderWithProviders(<Holdings />, { withApollo: false });

      await user.click(screen.getByRole('button', { name: '현재가 동기화' }));

      await waitFor(() => {
        expect(syncManualHoldingPrice).toHaveBeenCalledWith({
          variables: {
            input: {
              market: 'US',
              symbol: 'VOO',
            },
          },
        });
      });

      expect(refetchManualHoldings).toHaveBeenCalled();
    });
  });
});
