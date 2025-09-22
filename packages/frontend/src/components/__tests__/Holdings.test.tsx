import userEvent from '@testing-library/user-event';
import { screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../../test-utils/render';
import { Holdings } from '../Holdings';
import {
  GET_BROKERAGE_HOLDINGS,
  PATCH_BROKERAGE_HOLDING_QUANTITY,
  PUT_BROKERAGE_HOLDING_QUANTITY,
  SYNC_BROKERAGE_HOLDING_PRICE,
} from '../../graphql/brokerage';
import { GET_TAGS } from '../../graphql/tags';
import { GET_TAGS_FOR_HOLDING, SET_HOLDING_TAGS } from '../../graphql/holdings';

const mockUseQuery = vi.fn();
const mockUseMutation = vi.fn();
const patchHoldingQuantityMock = vi.fn();
const putHoldingQuantityMock = vi.fn();
const syncHoldingPriceMock = vi.fn();
const setHoldingTagsMock = vi.fn();

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
    patchHoldingQuantityMock.mockReset();
    patchHoldingQuantityMock.mockResolvedValue({});
    putHoldingQuantityMock.mockReset();
    putHoldingQuantityMock.mockResolvedValue({});
    syncHoldingPriceMock.mockReset();
    syncHoldingPriceMock.mockResolvedValue({});
    setHoldingTagsMock.mockReset();

    mockUseMutation.mockImplementation((document) => {
      if (document === PATCH_BROKERAGE_HOLDING_QUANTITY) {
        return [patchHoldingQuantityMock, { loading: false }];
      }
      if (document === PUT_BROKERAGE_HOLDING_QUANTITY) {
        return [putHoldingQuantityMock, { loading: false }];
      }
      if (document === SYNC_BROKERAGE_HOLDING_PRICE) {
        return [syncHoldingPriceMock, { loading: false }];
      }
      if (document === SET_HOLDING_TAGS) {
        return [setHoldingTagsMock, { loading: false }];
      }

      return [vi.fn(), { loading: false }];
    });
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
    setHoldingTagsMock.mockResolvedValue({});

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

    const user = userEvent.setup();

    renderWithProviders(<Holdings />, { withApollo: false });

    await user.click(screen.getByRole('button', { name: '태그 관리' }));

    const checkboxes = screen.getAllByRole('checkbox');
    expect(checkboxes[0]).toBeChecked();
    expect(checkboxes[1]).not.toBeChecked();

    await user.click(checkboxes[1]);
    await user.click(screen.getByRole('button', { name: '적용' }));

    await waitFor(() => {
      expect(setHoldingTagsMock).toHaveBeenCalledWith({
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

    const user = userEvent.setup();

    renderWithProviders(<Holdings />, { withApollo: false });

    await user.click(screen.getByRole('button', { name: '태그 관리' }));

    expect(screen.getByText('태그를 불러오는 중...')).toBeInTheDocument();
  });

  it('수량 추가 버튼으로 보유 수량을 늘릴 수 있다', async () => {
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

    mockUseQuery.mockImplementation((query) => {
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
        return { data: undefined, loading: false, refetch: vi.fn() };
      }

      throw new Error('예상치 못한 쿼리 호출');
    });

    const user = userEvent.setup();

    renderWithProviders(<Holdings />, { withApollo: false });

    const increaseInput = screen.getByPlaceholderText('증가 수량');
    await user.type(increaseInput, '3');
    await user.click(screen.getByRole('button', { name: '수량 추가' }));

    await waitFor(() => {
      expect(patchHoldingQuantityMock).toHaveBeenCalledWith({
        variables: {
          input: {
            holdingId: 'holding-1',
            quantityDelta: 3,
          },
        },
      });
    });

    expect(refetchHoldings).toHaveBeenCalled();
    await waitFor(() => {
      expect((screen.getByPlaceholderText('증가 수량') as HTMLInputElement).value).toBe('');
    });
  });

  it('수량 설정 버튼으로 보유 수량을 직접 입력할 수 있다', async () => {
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

    mockUseQuery.mockImplementation((query) => {
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
        return { data: undefined, loading: false, refetch: vi.fn() };
      }

      throw new Error('예상치 못한 쿼리 호출');
    });

    const user = userEvent.setup();

    renderWithProviders(<Holdings />, { withApollo: false });

    const setInput = screen.getByPlaceholderText('설정 수량');
    await user.type(setInput, '7');
    await user.click(screen.getByRole('button', { name: '수량 설정' }));

    await waitFor(() => {
      expect(putHoldingQuantityMock).toHaveBeenCalledWith({
        variables: {
          input: {
            holdingId: 'holding-1',
            quantity: 7,
          },
        },
      });
    });

    expect(refetchHoldings).toHaveBeenCalled();
    await waitFor(() => {
      expect((screen.getByPlaceholderText('설정 수량') as HTMLInputElement).value).toBe('');
    });
  });

  it('현재가 동기화 버튼으로 최신 가격을 요청한다', async () => {
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

    mockUseQuery.mockImplementation((query) => {
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
        return { data: undefined, loading: false, refetch: vi.fn() };
      }

      throw new Error('예상치 못한 쿼리 호출');
    });

    const user = userEvent.setup();

    renderWithProviders(<Holdings />, { withApollo: false });

    await user.click(screen.getByRole('button', { name: '현재가 동기화' }));

    await waitFor(() => {
      expect(syncHoldingPriceMock).toHaveBeenCalledWith({
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
