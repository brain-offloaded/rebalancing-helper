/// <reference types="@testing-library/jest-dom" />

import userEvent from '@testing-library/user-event';
import { screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createDecimal } from '@rebalancing-helper/common';
import { renderWithProviders } from '../../test-utils/render';
import { Holdings } from '../Holdings';
import {
  CreateManualHoldingDocument,
  DeleteManualHoldingDocument,
  GetHoldingsDocument,
  GetBrokerageAccountsDocument,
  GetMarketsDocument,
  GetTagsDocument,
  GetHoldingTagsDocument,
  SetHoldingTagsDocument,
  SetManualHoldingQuantityDocument,
  SyncManualHoldingPriceDocument,
} from '../../graphql/__generated__';

const mockUseQuery = vi.fn();
const mockUseMutation = vi.fn();
const defaultMarkets = [
  { id: 'market-us', code: 'US', displayName: '미국', yahooSuffix: null },
];

const createHolding = (overrides: Partial<Record<string, unknown>> = {}) => ({
  id: 'holding-1',
  source: 'BROKERAGE',
  accountId: 'acc-1',
  market: null,
  symbol: 'AAPL',
  name: '애플',
  alias: null,
  quantity: createDecimal(1),
  currentPrice: createDecimal(100),
  marketValue: createDecimal(100),
  currency: 'USD',
  lastUpdated: new Date().toISOString(),
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

let holdingsData: Array<Record<string, unknown>>;
let holdingsLoadingState: boolean;
let holdingsRefetchFn: ReturnType<typeof vi.fn>;
let tagsDataState: Array<Record<string, unknown>>;
let tagsLoadingState: boolean;
let marketsDataState: typeof defaultMarkets;
let brokerageAccountsDataState: Array<Record<string, unknown>>;
let brokerageAccountsLoadingState: boolean;
let holdingTagsListState: Array<Record<string, unknown>>;
let holdingTagsRefetchFn: ReturnType<typeof vi.fn>;

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
    holdingsData = [];
    holdingsLoadingState = false;
    holdingsRefetchFn = vi.fn();
    tagsDataState = [];
    tagsLoadingState = false;
    marketsDataState = defaultMarkets;
    holdingTagsListState = [];
    holdingTagsRefetchFn = vi.fn();
    brokerageAccountsDataState = [
      {
        id: 'acc-1',
        name: '증권사 계좌',
        brokerId: 'broker-api',
        syncMode: 'API',
        broker: null,
        description: null,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'manual-account-1',
        name: '수동 계좌',
        brokerId: 'broker-manual',
        syncMode: 'MANUAL',
        broker: null,
        description: null,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
    brokerageAccountsLoadingState = false;

    mockUseQuery.mockImplementation((query) => {
      if (query === GetMarketsDocument) {
        return { data: { markets: marketsDataState }, loading: false };
      }
      if (query === GetHoldingsDocument) {
        return {
          data: holdingsLoadingState ? undefined : { holdings: holdingsData },
          loading: holdingsLoadingState,
          refetch: holdingsRefetchFn,
        };
      }
      if (query === GetTagsDocument) {
        return {
          data: { tags: tagsDataState },
          loading: tagsLoadingState,
        };
      }
      if (query === GetHoldingTagsDocument) {
        return {
          data: { holdingTags: holdingTagsListState },
          loading: false,
          refetch: holdingTagsRefetchFn,
        };
      }
      if (query === GetBrokerageAccountsDocument) {
        return {
          data: brokerageAccountsLoadingState
            ? undefined
            : { brokerageAccounts: brokerageAccountsDataState },
          loading: brokerageAccountsLoadingState,
        };
      }
      throw new Error('예상치 못한 쿼리 호출');
    });

    mockUseMutation.mockImplementation(() => [vi.fn(), { loading: false }]);
  });

  afterEach(() => {
    vi.clearAllMocks();
    vi.restoreAllMocks();
  });

  it('보유 종목을 불러오는 동안 로딩 메시지를 보여준다', () => {
    holdingsLoadingState = true;

    mockUseMutation.mockImplementation(() => [vi.fn(), { loading: false }]);

    renderWithProviders(<Holdings />, { withApollo: false });

    expect(screen.getByText('로딩 중...')).toBeInTheDocument();
  });

  it('통합된 보유 테이블에 증권사/수동 보유 종목을 표시한다', () => {
    holdingsData = [
      createHolding({
        id: 'holding-brokerage',
        source: 'BROKERAGE',
        symbol: 'AAPL',
        name: '애플',
        quantity: createDecimal(3),
        currentPrice: createDecimal(190.23),
        marketValue: createDecimal(570.69),
      }),
      createHolding({
        id: 'holding-manual',
        source: 'MANUAL',
        accountId: 'manual-account-1',
        market: 'US',
        symbol: 'VOO',
        name: 'Vanguard S&P 500 ETF',
        quantity: createDecimal(2),
        currentPrice: createDecimal(412.35),
        marketValue: createDecimal(824.7),
      }),
    ];

    mockUseMutation.mockImplementation(() => [vi.fn(), { loading: false }]);

    renderWithProviders(<Holdings />, { withApollo: false });

    expect(screen.getByText('증권사 계좌')).toBeInTheDocument();
    expect(screen.getAllByText('수동 계좌').length).toBeGreaterThan(0);
    expect(screen.getByText('AAPL')).toBeInTheDocument();
    expect(screen.getByText('US · VOO')).toBeInTheDocument();
    expect(screen.getByText('Vanguard S&P 500 ETF')).toBeInTheDocument();
    expect(screen.getByText('$412.35')).toBeInTheDocument();
  });

  it('계좌 헤더를 클릭하면 계좌명 기준 오름/내림/기본 순으로 순환 정렬한다', async () => {
    const user = userEvent.setup();
    brokerageAccountsDataState = [
      {
        id: 'acc-1',
        name: 'Account B',
        brokerId: 'broker-api',
        syncMode: 'API',
        broker: null,
        description: null,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'manual-account-1',
        name: 'Account A',
        brokerId: 'broker-manual',
        syncMode: 'MANUAL',
        broker: null,
        description: null,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'acc-2',
        name: 'Account C',
        brokerId: 'broker-api',
        syncMode: 'API',
        broker: null,
        description: null,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    holdingsData = [
      createHolding({
        id: 'holding-b',
        accountId: 'acc-1',
        symbol: 'BBB',
        name: 'Broker B',
      }),
      createHolding({
        id: 'holding-a',
        accountId: 'manual-account-1',
        source: 'MANUAL',
        market: 'US',
        symbol: 'AAA',
        name: 'Manual A',
      }),
      createHolding({
        id: 'holding-c',
        accountId: 'acc-2',
        symbol: 'CCC',
        name: 'Broker C',
      }),
    ];

    renderWithProviders(<Holdings />, { withApollo: false });

    const rows = screen.getAllByRole('row');
    expect(within(rows[1]).getByText('Account A')).toBeInTheDocument();

    const accountHeaderButton = screen.getByRole('button', {
      name: '계좌 정렬',
    });

    await user.click(accountHeaderButton);

    const sortedRows = screen.getAllByRole('row');
    expect(within(sortedRows[1]).getByText('Account C')).toBeInTheDocument();

    await user.click(accountHeaderButton);

    const reversedRows = screen.getAllByRole('row');
    expect(within(reversedRows[1]).getByText('Account B')).toBeInTheDocument();

    await user.click(accountHeaderButton);

    const resetRows = screen.getAllByRole('row');
    expect(within(resetRows[1]).getByText('Account A')).toBeInTheDocument();
  });

  it('태그 관리 모달에서 태그를 갱신한다', async () => {
    const user = userEvent.setup();
    holdingsData = [
      createHolding({
        id: 'holding-1',
        source: 'MANUAL',
        accountId: 'manual-account-1',
        market: 'US',
        symbol: 'QQQ',
        name: 'Invesco QQQ Trust',
      }),
    ];
    tagsDataState = [
      { id: 'tag-1', name: '성장주', description: '성장', color: '#ff0000' },
      { id: 'tag-2', name: '배당주', description: '배당', color: '#00ff00' },
    ];
    holdingTagsListState = [
      {
        id: 'link-1',
        holdingSymbol: 'QQQ',
        tagId: 'tag-1',
        createdAt: new Date().toISOString(),
      },
    ];

    const setHoldingTags = vi.fn().mockResolvedValue({});

    mockUseMutation.mockImplementation((document) => {
      if (document === SetHoldingTagsDocument) {
        return [setHoldingTags, { loading: false }];
      }
      return [vi.fn(), { loading: false }];
    });

    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    renderWithProviders(<Holdings />, { withApollo: false });

    await user.click(screen.getByText('Invesco QQQ Trust'));
    await screen.findByRole('button', { name: '저장' });

    await user.click(screen.getByRole('button', { name: '태그 선택' }));
    const tagPlaceholder = screen.getByRole('option', { name: '태그 선택' });
    const tagSelect = tagPlaceholder.parentElement as HTMLSelectElement;
    await user.selectOptions(tagSelect, 'tag-2');

    await user.click(screen.getByRole('button', { name: '저장' }));

    await waitFor(() => {
      expect(setHoldingTags).toHaveBeenCalledWith({
        variables: {
          input: {
            holdingSymbol: 'QQQ',
            tagIds: ['tag-1', 'tag-2'],
          },
        },
      });
    });
    expect(holdingsRefetchFn).toHaveBeenCalled();
    expect(holdingTagsRefetchFn).toHaveBeenCalled();

    confirmSpy.mockRestore();
  });

  it('수동 보유 종목을 추가하면 refetch를 호출한다', async () => {
    const user = userEvent.setup();
    holdingsRefetchFn = vi.fn();
    holdingsData = [];
    marketsDataState = defaultMarkets;

    const createManualHolding = vi.fn().mockResolvedValue({});
    mockUseMutation.mockImplementation((document) => {
      if (document === CreateManualHoldingDocument) {
        return [createManualHolding, { loading: false }];
      }
      return [vi.fn(), { loading: false }];
    });

    renderWithProviders(<Holdings />, { withApollo: false });

    await waitFor(() => {
      expect(screen.getByLabelText('계좌')).toHaveValue('manual-account-1');
    });
    await user.selectOptions(
      screen.getByLabelText('시장'),
      screen.getByRole('option', { name: /미국/ }),
    );
    await user.type(screen.getByLabelText('종목 코드'), 'VOO');
    await user.type(screen.getByLabelText('수량'), '2');
    await user.click(screen.getByRole('button', { name: '수동 추가' }));

    await waitFor(() => {
      expect(createManualHolding).toHaveBeenCalledWith({
        variables: {
          input: {
            accountId: 'manual-account-1',
            market: 'US',
            symbol: 'VOO',
            quantity: '2',
          },
        },
      });
    });
    expect(holdingsRefetchFn).toHaveBeenCalled();
  });

  it('수동 보유 종목을 수량 0으로도 추가할 수 있다', async () => {
    const user = userEvent.setup();
    holdingsRefetchFn = vi.fn();
    holdingsData = [];
    marketsDataState = defaultMarkets;

    const createManualHolding = vi.fn().mockResolvedValue({});
    mockUseMutation.mockImplementation((document) => {
      if (document === CreateManualHoldingDocument) {
        return [createManualHolding, { loading: false }];
      }
      return [vi.fn(), { loading: false }];
    });

    renderWithProviders(<Holdings />, { withApollo: false });

    await waitFor(() => {
      expect(screen.getByLabelText('계좌')).toHaveValue('manual-account-1');
    });
    await user.selectOptions(
      screen.getByLabelText('시장'),
      screen.getByRole('option', { name: /미국/ }),
    );
    await user.type(screen.getByLabelText('종목 코드'), 'BRK');
    await user.clear(screen.getByLabelText('수량'));
    await user.type(screen.getByLabelText('수량'), '0');
    await user.click(screen.getByRole('button', { name: '수동 추가' }));

    await waitFor(() => {
      expect(createManualHolding).toHaveBeenCalledWith({
        variables: {
          input: {
            accountId: 'manual-account-1',
            market: 'US',
            symbol: 'BRK',
            quantity: '0',
          },
        },
      });
    });
    expect(holdingsRefetchFn).toHaveBeenCalled();
  });

  it('수동 보유 종목 수량을 증가시킨다', async () => {
    const user = userEvent.setup();
    holdingsData = [
      createHolding({
        id: 'manual-1',
        source: 'MANUAL',
        accountId: 'manual-account-1',
        market: 'US',
        symbol: 'VOO',
        name: 'Vanguard S&P 500 ETF',
        quantity: createDecimal(2),
      }),
    ];

    const setManualHoldingQuantity = vi.fn().mockResolvedValue({});
    mockUseMutation.mockImplementation((document) => {
      if (document === SetManualHoldingQuantityDocument) {
        return [setManualHoldingQuantity, { loading: false }];
      }
      return [vi.fn(), { loading: false }];
    });

    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    renderWithProviders(<Holdings />, { withApollo: false });

    await user.click(screen.getByText('Vanguard S&P 500 ETF'));
    const deltaInput = await screen.findByPlaceholderText('+100');
    expect(deltaInput).toHaveValue('0');
    const targetInput = await screen.findByPlaceholderText('5');
    expect(targetInput).toHaveValue('2');
    await user.clear(deltaInput);
    await user.type(deltaInput, '1');
    expect(targetInput).toHaveValue('3');
    await user.click(screen.getByRole('button', { name: '저장' }));

    await waitFor(() => {
      expect(setManualHoldingQuantity).toHaveBeenCalledWith({
        variables: {
          input: {
            accountId: 'manual-account-1',
            market: 'US',
            symbol: 'VOO',
            quantity: '3',
          },
        },
      });
    });
    expect(holdingsRefetchFn).toHaveBeenCalled();
    expect(holdingTagsRefetchFn).toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it('수동 보유 종목 수량을 설정한다', async () => {
    const user = userEvent.setup();
    holdingsData = [
      createHolding({
        id: 'manual-1',
        source: 'MANUAL',
        accountId: 'manual-account-1',
        market: 'US',
        symbol: 'VOO',
        name: 'Vanguard S&P 500 ETF',
        quantity: createDecimal(5),
      }),
    ];

    const setManualHoldingQuantity = vi.fn().mockResolvedValue({});
    mockUseMutation.mockImplementation((document) => {
      if (document === SetManualHoldingQuantityDocument) {
        return [setManualHoldingQuantity, { loading: false }];
      }
      return [vi.fn(), { loading: false }];
    });

    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    renderWithProviders(<Holdings />, { withApollo: false });

    await user.click(screen.getByText('Vanguard S&P 500 ETF'));
    const targetInput = await screen.findByPlaceholderText('5');
    const deltaInput = await screen.findByPlaceholderText('+100');
    expect(targetInput).toHaveValue('5');
    expect(deltaInput).toHaveValue('0');
    await user.clear(targetInput);
    await user.type(targetInput, '10');
    expect(deltaInput).toHaveValue('+5');
    await user.click(screen.getByRole('button', { name: '저장' }));

    await waitFor(() => {
      expect(setManualHoldingQuantity).toHaveBeenCalledWith({
        variables: {
          input: {
            accountId: 'manual-account-1',
            market: 'US',
            symbol: 'VOO',
            quantity: '10',
          },
        },
      });
    });
    expect(holdingsRefetchFn).toHaveBeenCalled();
    expect(holdingTagsRefetchFn).toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it('수동 보유 종목을 삭제한다', async () => {
    const user = userEvent.setup();
    holdingsData = [
      createHolding({
        id: 'manual-1',
        source: 'MANUAL',
        accountId: 'manual-account-1',
        market: 'US',
        symbol: 'VOO',
        name: 'Vanguard S&P 500 ETF',
      }),
    ];

    const deleteManualHolding = vi.fn().mockResolvedValue({});
    mockUseMutation.mockImplementation((document) => {
      if (document === DeleteManualHoldingDocument) {
        return [deleteManualHolding, { loading: false }];
      }
      return [vi.fn(), { loading: false }];
    });

    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    renderWithProviders(<Holdings />, { withApollo: false });

    await user.click(screen.getByText('Vanguard S&P 500 ETF'));
    await screen.findByRole('button', { name: '저장' });
    await user.click(screen.getByRole('button', { name: '삭제' }));

    await waitFor(() => {
      expect(deleteManualHolding).toHaveBeenCalledWith({
        variables: {
          input: {
            accountId: 'manual-account-1',
            market: 'US',
            symbol: 'VOO',
          },
        },
      });
    });
    expect(holdingsRefetchFn).toHaveBeenCalled();
    expect(holdingTagsRefetchFn).toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it('수동 보유 종목 가격을 동기화한다', async () => {
    const user = userEvent.setup();
    holdingsRefetchFn = vi.fn();
    holdingsData = [
      createHolding({
        id: 'manual-1',
        source: 'MANUAL',
        accountId: 'manual-account-1',
        market: 'US',
        symbol: 'VOO',
        name: 'Vanguard S&P 500 ETF',
      }),
    ];

    const syncManualHoldingPrice = vi.fn().mockResolvedValue({});
    mockUseMutation.mockImplementation((document) => {
      if (document === SyncManualHoldingPriceDocument) {
        return [syncManualHoldingPrice, { loading: false }];
      }
      return [vi.fn(), { loading: false }];
    });

    renderWithProviders(<Holdings />, { withApollo: false });

    await user.click(
      screen.getAllByRole('button', { name: '현재가 동기화' })[0],
    );

    await waitFor(() => {
      expect(syncManualHoldingPrice).toHaveBeenCalledWith({
        variables: {
          input: {
            accountId: 'manual-account-1',
            market: 'US',
            symbol: 'VOO',
          },
        },
      });
    });
    expect(holdingsRefetchFn).toHaveBeenCalled();
  });
});
