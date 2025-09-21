import userEvent from '@testing-library/user-event';
import { screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../../test-utils/render';
import {
  CREATE_BROKER,
  DELETE_BROKER,
  UPDATE_BROKER,
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

import { Brokers } from '../Brokers';

const getInput = (labelText: string): HTMLInputElement => {
  const label = screen.getByText(labelText);
  if (!(label instanceof HTMLLabelElement)) {
    throw new Error(`${labelText}은 label 요소가 아닙니다.`);
  }
  const input = label.parentElement?.querySelector('input') as
    | HTMLInputElement
    | undefined;
  if (!input) {
    throw new Error(`${labelText} 입력 요소를 찾을 수 없습니다.`);
  }
  return input;
};

describe('Brokers', () => {
  beforeEach(() => {
    mockUseQuery.mockReset();
    mockUseMutation.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('증권사 목록을 불러오는 동안 로딩을 표시한다', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      loading: true,
      error: undefined,
    });
    mockUseMutation.mockReturnValue([vi.fn(), { loading: false }]);

    renderWithProviders(<Brokers />, { withApollo: false });

    expect(screen.getByText('로딩 중...')).toBeInTheDocument();
  });

  it('조회 실패 시 오류를 노출한다', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      loading: false,
      error: new Error('network error'),
    });
    mockUseMutation.mockReturnValue([vi.fn(), { loading: false }]);

    renderWithProviders(<Brokers />, { withApollo: false });

    expect(screen.getByText('오류 발생: network error')).toBeInTheDocument();
  });

  it('증권사 목록을 렌더링한다', () => {
    const brokers = [
      {
        id: 'broker-1',
        name: '미래에셋',
        code: 'MIRA',
        description: '미래에셋증권 API',
        apiBaseUrl: 'https://api.mirae.com',
        isActive: true,
      },
    ];

    mockUseQuery.mockReturnValue({
      data: { brokers },
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    });
    mockUseMutation.mockReturnValue([vi.fn(), { loading: false }]);

    renderWithProviders(<Brokers />, { withApollo: false });

    expect(screen.getByText('미래에셋')).toBeInTheDocument();
    expect(screen.getByText('코드:')).toBeInTheDocument();
    expect(screen.getByText('MIRA')).toBeInTheDocument();
    expect(screen.getByText('미래에셋증권 API')).toBeInTheDocument();
    expect(screen.getByText('활성')).toBeInTheDocument();
  });

  it('새 증권사를 추가하면 변수를 전달하고 목록을 갱신한다', async () => {
    const refetch = vi.fn();
    const createBroker = vi.fn().mockResolvedValue({});
    const updateBroker = vi.fn();
    const deleteBroker = vi.fn();

    mockUseQuery.mockReturnValue({
      data: { brokers: [] },
      loading: false,
      error: undefined,
      refetch,
    });

    mockUseMutation.mockImplementation((document) => {
      if (document === CREATE_BROKER) {
        return [createBroker, { loading: false }];
      }
      if (document === UPDATE_BROKER) {
        return [updateBroker, { loading: false }];
      }
      if (document === DELETE_BROKER) {
        return [deleteBroker, { loading: false }];
      }
      return [vi.fn(), { loading: false }];
    });

    const user = userEvent.setup();
    renderWithProviders(<Brokers />, { withApollo: false });

    await user.click(screen.getByRole('button', { name: '증권사 추가' }));
    await user.type(getInput('증권사 코드'), 'KB');
    await user.type(getInput('증권사 이름'), 'KB증권');
    await user.type(getInput('설명'), 'KB증권 표준 API');
    await user.type(getInput('API 베이스 URL'), 'https://api.kbsec.com');

    await user.click(screen.getByRole('button', { name: /^등록$/ }));

    await waitFor(() => {
      expect(createBroker).toHaveBeenCalledWith({
        variables: {
          input: {
            code: 'KB',
            name: 'KB증권',
            description: 'KB증권 표준 API',
            apiBaseUrl: 'https://api.kbsec.com',
          },
        },
      });
    });

    expect(refetch).toHaveBeenCalled();
    expect(screen.queryByText('새 증권사 등록')).not.toBeInTheDocument();
  });

  it('활성 상태 토글 시 updateBroker를 호출한다', async () => {
    const refetch = vi.fn();
    const createBroker = vi.fn();
    const updateBroker = vi.fn().mockResolvedValue({});
    const deleteBroker = vi.fn();

    mockUseQuery.mockReturnValue({
      data: {
        brokers: [
          {
            id: 'broker-1',
            name: '비활성 증권사',
            code: 'INACTIVE',
            description: null,
            apiBaseUrl: null,
            isActive: false,
          },
        ],
      },
      loading: false,
      error: undefined,
      refetch,
    });

    mockUseMutation.mockImplementation((document) => {
      if (document === CREATE_BROKER) {
        return [createBroker, { loading: false }];
      }
      if (document === UPDATE_BROKER) {
        return [updateBroker, { loading: false }];
      }
      if (document === DELETE_BROKER) {
        return [deleteBroker, { loading: false }];
      }
      return [vi.fn(), { loading: false }];
    });

    const user = userEvent.setup();
    renderWithProviders(<Brokers />, { withApollo: false });

    await user.click(screen.getByRole('button', { name: '활성화' }));

    await waitFor(() => {
      expect(updateBroker).toHaveBeenCalledWith({
        variables: {
          input: { id: 'broker-1', isActive: true },
        },
      });
    });

    expect(refetch).toHaveBeenCalled();
  });

  it('삭제 버튼을 클릭하면 확인 창을 거쳐 삭제한다', async () => {
    const refetch = vi.fn();
    const createBroker = vi.fn();
    const updateBroker = vi.fn();
    const deleteBroker = vi.fn().mockResolvedValue({});

    mockUseQuery.mockReturnValue({
      data: {
        brokers: [
          {
            id: 'broker-1',
            name: '삭제 대상 증권사',
            code: 'DEL',
            description: null,
            apiBaseUrl: null,
            isActive: true,
          },
        ],
      },
      loading: false,
      error: undefined,
      refetch,
    });

    mockUseMutation.mockImplementation((document) => {
      if (document === CREATE_BROKER) {
        return [createBroker, { loading: false }];
      }
      if (document === UPDATE_BROKER) {
        return [updateBroker, { loading: false }];
      }
      if (document === DELETE_BROKER) {
        return [deleteBroker, { loading: false }];
      }
      return [vi.fn(), { loading: false }];
    });

    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const user = userEvent.setup();

    renderWithProviders(<Brokers />, { withApollo: false });

    await user.click(screen.getByRole('button', { name: '삭제' }));

    await waitFor(() => {
      expect(deleteBroker).toHaveBeenCalledWith({
        variables: { id: 'broker-1' },
      });
    });

    expect(confirmSpy).toHaveBeenCalledWith('이 증권사를 삭제하시겠습니까?');
    expect(refetch).toHaveBeenCalled();

    confirmSpy.mockRestore();
  });
});
