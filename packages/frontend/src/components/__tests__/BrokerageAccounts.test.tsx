import userEvent from '@testing-library/user-event';
import { screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../../test-utils/render';
import {
  CREATE_BROKERAGE_ACCOUNT,
  DELETE_BROKERAGE_ACCOUNT,
  GET_BROKERAGE_ACCOUNTS,
  GET_BROKERS,
  REFRESH_BROKERAGE_HOLDINGS,
} from '../../graphql/brokerage';

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

// vi.mock 호출 이후에 컴포넌트를 불러와야 한다.
import { BrokerageAccounts } from '../BrokerageAccounts';

const getFieldByLabel = (
  labelText: string,
): HTMLInputElement | HTMLSelectElement => {
  const label = screen.getByText(labelText);

  if (!(label instanceof HTMLLabelElement)) {
    throw new Error(`${labelText} 레이블은 label 요소가 아닙니다.`);
  }

  const container = label.parentElement;
  const field = container?.querySelector('input, select');

  if (!field) {
    throw new Error(`${labelText} 레이블과 연결된 필드를 찾을 수 없습니다.`);
  }

  return field as HTMLInputElement | HTMLSelectElement;
};

describe('BrokerageAccounts', () => {
  beforeEach(() => {
    mockUseQuery.mockReset();
    mockUseMutation.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('브로커리지 계정을 불러오는 동안 로딩 메시지를 출력한다', () => {
    mockUseQuery.mockImplementation((query) => {
      if (query === GET_BROKERAGE_ACCOUNTS) {
        return { data: undefined, loading: true, error: undefined };
      }
      if (query === GET_BROKERS) {
        return { data: undefined, loading: false, error: undefined };
      }
      return {};
    });
    mockUseMutation.mockReturnValue([vi.fn(), { loading: false }]);

    renderWithProviders(<BrokerageAccounts />, { withApollo: false });

    expect(screen.getByText('로딩 중...')).toBeInTheDocument();
  });

  it('쿼리에 실패하면 오류 메시지를 노출한다', () => {
    mockUseQuery.mockImplementation((query) => {
      if (query === GET_BROKERAGE_ACCOUNTS) {
        return {
          data: undefined,
          loading: false,
          error: new Error('network error'),
        };
      }
      if (query === GET_BROKERS) {
        return { data: { brokers: [] }, loading: false, error: undefined };
      }
      return {};
    });
    mockUseMutation.mockReturnValue([vi.fn(), { loading: false }]);

    renderWithProviders(<BrokerageAccounts />, { withApollo: false });

    expect(screen.getByText('오류 발생: network error')).toBeInTheDocument();
  });

  it('조회된 계정 목록을 표시한다', () => {
    const accounts = [
      {
        id: 'acc-1',
        name: '미래에셋 계정',
        broker: {
          id: 'broker-1',
          name: '미래에셋',
          code: 'MIRA',
        },
        description: '주식 계좌',
        isActive: true,
        createdAt: new Date('2024-01-10T00:00:00Z').toISOString(),
        updatedAt: new Date('2024-01-11T00:00:00Z').toISOString(),
      },
    ];

    mockUseQuery.mockImplementation((query) => {
      if (query === GET_BROKERAGE_ACCOUNTS) {
        return {
          data: { brokerageAccounts: accounts },
          loading: false,
          error: undefined,
          refetch: vi.fn(),
        };
      }
      if (query === GET_BROKERS) {
        return {
          data: {
            brokers: [
              { id: 'broker-1', name: '미래에셋', code: 'MIRA' },
              { id: 'broker-2', name: '키움증권', code: 'KIWOOM' },
            ],
          },
          loading: false,
          error: undefined,
        };
      }
      return {};
    });
    mockUseMutation.mockReturnValue([vi.fn(), { loading: false }]);

    renderWithProviders(<BrokerageAccounts />, { withApollo: false });

    expect(screen.getByText('미래에셋 계정')).toBeInTheDocument();
    const brokerTexts = screen.getAllByText(/미래에셋/);
    expect(brokerTexts.length).toBeGreaterThan(0);
    expect(screen.getByText('활성')).toBeInTheDocument();
    expect(screen.getByText('주식 계좌')).toBeInTheDocument();
  });

  it('새 계정을 추가하면 입력값을 전달하고 목록을 갱신한다', async () => {
    const refetch = vi.fn();
    const createAccount = vi.fn().mockResolvedValue({});
    const deleteAccount = vi.fn();
    const refreshHoldings = vi.fn();

    mockUseQuery.mockImplementation((query) => {
      if (query === GET_BROKERAGE_ACCOUNTS) {
        return {
          data: { brokerageAccounts: [] },
          loading: false,
          error: undefined,
          refetch,
        };
      }
      if (query === GET_BROKERS) {
        return {
          data: {
            brokers: [
              { id: 'broker-1', name: '미래에셋', code: 'MIRA' },
              { id: 'broker-2', name: '키움증권', code: 'KIWOOM' },
            ],
          },
          loading: false,
          error: undefined,
        };
      }
      return {};
    });

    mockUseMutation.mockImplementation((document) => {
      if (document === CREATE_BROKERAGE_ACCOUNT) {
        return [createAccount, { loading: false }];
      }
      if (document === DELETE_BROKERAGE_ACCOUNT) {
        return [deleteAccount, { loading: false }];
      }
      if (document === REFRESH_BROKERAGE_HOLDINGS) {
        return [refreshHoldings, { loading: false }];
      }

      return [vi.fn(), { loading: false }];
    });

    const user = userEvent.setup();

    renderWithProviders(<BrokerageAccounts />, { withApollo: false });

    await user.click(screen.getByRole('button', { name: '계정 추가' }));

    await user.type(getFieldByLabel('계정 이름'), '신규 계정');
    await user.selectOptions(
      getFieldByLabel('증권사') as HTMLSelectElement,
      'broker-2',
    );
    await user.type(getFieldByLabel('API 키'), 'api-key');
    await user.type(getFieldByLabel('API 시크릿'), 'secret');
    await user.type(getFieldByLabel('설명'), '계정 설명');

    await user.click(screen.getByRole('button', { name: /^계정 추가$/ }));

    await waitFor(() => {
      expect(createAccount).toHaveBeenCalledWith({
        variables: {
          input: {
            name: '신규 계정',
            brokerId: 'broker-2',
            apiKey: 'api-key',
            apiSecret: 'secret',
            description: '계정 설명',
          },
        },
      });
    });

    expect(refetch).toHaveBeenCalled();
    expect(screen.queryByText('새 계정 추가')).not.toBeInTheDocument();
  });

  it('계정을 삭제하면 확인 대화상자를 거쳐 삭제 요청을 보낸다', async () => {
    const refetch = vi.fn();
    const createAccount = vi.fn();
    const deleteAccount = vi.fn().mockResolvedValue({});
    const refreshHoldings = vi.fn();

    mockUseQuery.mockImplementation((query) => {
      if (query === GET_BROKERAGE_ACCOUNTS) {
        return {
          data: {
            brokerageAccounts: [
              {
                id: 'acc-1',
                name: '삭제 대상 계정',
                broker: { id: 'broker-1', name: '테스트 증권', code: 'TEST' },
                description: null,
                isActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            ],
          },
          loading: false,
          error: undefined,
          refetch,
        };
      }
      if (query === GET_BROKERS) {
        return {
          data: {
            brokers: [{ id: 'broker-1', name: '테스트 증권', code: 'TEST' }],
          },
          loading: false,
          error: undefined,
        };
      }
      return {};
    });

    mockUseMutation.mockImplementation((document) => {
      if (document === CREATE_BROKERAGE_ACCOUNT) {
        return [createAccount, { loading: false }];
      }
      if (document === DELETE_BROKERAGE_ACCOUNT) {
        return [deleteAccount, { loading: false }];
      }
      if (document === REFRESH_BROKERAGE_HOLDINGS) {
        return [refreshHoldings, { loading: false }];
      }

      return [vi.fn(), { loading: false }];
    });

    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    const user = userEvent.setup();
    renderWithProviders(<BrokerageAccounts />, { withApollo: false });

    await user.click(screen.getByRole('button', { name: '삭제' }));

    await waitFor(() => {
      expect(deleteAccount).toHaveBeenCalledWith({
        variables: { id: 'acc-1' },
      });
    });

    expect(confirmSpy).toHaveBeenCalledWith('이 계정을 삭제하시겠습니까?');
    expect(refetch).toHaveBeenCalled();

    confirmSpy.mockRestore();
  });

  it('보유 종목 새로고침 시 알림을 표시한다', async () => {
    const refetch = vi.fn();
    const createAccount = vi.fn();
    const deleteAccount = vi.fn();
    const refreshHoldings = vi.fn().mockResolvedValue({});

    mockUseQuery.mockImplementation((query) => {
      if (query === GET_BROKERAGE_ACCOUNTS) {
        return {
          data: {
            brokerageAccounts: [
              {
                id: 'acc-1',
                name: '새로고침 계정',
                broker: { id: 'broker-1', name: '테스트 증권', code: 'TEST' },
                description: null,
                isActive: true,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              },
            ],
          },
          loading: false,
          error: undefined,
          refetch,
        };
      }
      if (query === GET_BROKERS) {
        return {
          data: {
            brokers: [{ id: 'broker-1', name: '테스트 증권', code: 'TEST' }],
          },
          loading: false,
          error: undefined,
        };
      }
      return {};
    });

    mockUseMutation.mockImplementation((document) => {
      if (document === CREATE_BROKERAGE_ACCOUNT) {
        return [createAccount, { loading: false }];
      }
      if (document === DELETE_BROKERAGE_ACCOUNT) {
        return [deleteAccount, { loading: false }];
      }
      if (document === REFRESH_BROKERAGE_HOLDINGS) {
        return [refreshHoldings, { loading: false }];
      }

      return [vi.fn(), { loading: false }];
    });

    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    const user = userEvent.setup();
    renderWithProviders(<BrokerageAccounts />, { withApollo: false });

    await user.click(screen.getByRole('button', { name: '보유종목 새로고침' }));

    await waitFor(() => {
      expect(refreshHoldings).toHaveBeenCalledWith({
        variables: { accountId: 'acc-1' },
      });
    });

    expect(alertSpy).toHaveBeenCalledWith('보유 종목이 업데이트되었습니다.');

    alertSpy.mockRestore();
  });
});
