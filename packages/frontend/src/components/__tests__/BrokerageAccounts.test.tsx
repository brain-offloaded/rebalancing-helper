import userEvent from '@testing-library/user-event'
import { screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../test-utils/render'
import {
  CREATE_BROKERAGE_ACCOUNT,
  DELETE_BROKERAGE_ACCOUNT,
  REFRESH_BROKERAGE_HOLDINGS,
} from '../../graphql/brokerage'

const mockUseQuery = vi.fn()
const mockUseMutation = vi.fn()

vi.mock('@apollo/client', async () => {
  const actual = await vi.importActual<typeof import('@apollo/client')>('@apollo/client')

  return {
    ...actual,
    useQuery: (...args: Parameters<typeof actual.useQuery>) => mockUseQuery(...args),
    useMutation: (...args: Parameters<typeof actual.useMutation>) => mockUseMutation(...args),
  }
})

// vi.mock 호출 이후에 컴포넌트를 불러와야 한다.
import { BrokerageAccounts } from '../BrokerageAccounts'

const getInputByLabel = (labelText: string): HTMLInputElement => {
  const label = screen.getByText(labelText)

  if (!(label instanceof HTMLLabelElement)) {
    throw new Error(`${labelText} 레이블은 label 요소가 아닙니다.`)
  }

  const container = label.parentElement
  const input = container?.querySelector('input')

  if (!input) {
    throw new Error(`${labelText} 레이블과 연결된 input을 찾을 수 없습니다.`)
  }

  return input as HTMLInputElement
}

describe('BrokerageAccounts', () => {
  beforeEach(() => {
    mockUseQuery.mockReset()
    mockUseMutation.mockReset()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('브로커리지 계정을 불러오는 동안 로딩 메시지를 출력한다', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      loading: true,
      error: undefined,
    })
    mockUseMutation.mockReturnValue([vi.fn(), { loading: false }])

    renderWithProviders(<BrokerageAccounts />, { withApollo: false })

    expect(screen.getByText('로딩 중...')).toBeInTheDocument()
  })

  it('쿼리에 실패하면 오류 메시지를 노출한다', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      loading: false,
      error: new Error('network error'),
    })
    mockUseMutation.mockReturnValue([vi.fn(), { loading: false }])

    renderWithProviders(<BrokerageAccounts />, { withApollo: false })

    expect(screen.getByText('오류 발생: network error')).toBeInTheDocument()
  })

  it('조회된 계정 목록을 표시한다', () => {
    const accounts = [
      {
        id: 'acc-1',
        name: '미래에셋 계정',
        brokerName: '미래에셋',
        description: '주식 계좌',
        isActive: true,
        createdAt: new Date('2024-01-10T00:00:00Z').toISOString(),
        updatedAt: new Date('2024-01-11T00:00:00Z').toISOString(),
      },
    ]

    mockUseQuery.mockReturnValue({
      data: { brokerageAccounts: accounts },
      loading: false,
      error: undefined,
      refetch: vi.fn(),
    })
    mockUseMutation.mockReturnValue([vi.fn(), { loading: false }])

    renderWithProviders(<BrokerageAccounts />, { withApollo: false })

    expect(screen.getByText('미래에셋 계정')).toBeInTheDocument()
    expect(screen.getByText('미래에셋')).toBeInTheDocument()
    expect(screen.getByText('활성')).toBeInTheDocument()
    expect(screen.getByText('주식 계좌')).toBeInTheDocument()
  })

  it('새 계정을 추가하면 입력값을 전달하고 목록을 갱신한다', async () => {
    const refetch = vi.fn()
    const createAccount = vi.fn().mockResolvedValue({})
    const deleteAccount = vi.fn()
    const refreshHoldings = vi.fn()

    mockUseQuery.mockReturnValue({
      data: { brokerageAccounts: [] },
      loading: false,
      error: undefined,
      refetch,
    })

    mockUseMutation.mockImplementation((document) => {
      if (document === CREATE_BROKERAGE_ACCOUNT) {
        return [createAccount, { loading: false }]
      }
      if (document === DELETE_BROKERAGE_ACCOUNT) {
        return [deleteAccount, { loading: false }]
      }
      if (document === REFRESH_BROKERAGE_HOLDINGS) {
        return [refreshHoldings, { loading: false }]
      }

      return [vi.fn(), { loading: false }]
    })

    const user = userEvent.setup()

    renderWithProviders(<BrokerageAccounts />, { withApollo: false })

    await user.click(screen.getByRole('button', { name: '계정 추가' }))

    await user.type(getInputByLabel('계정 이름'), '신규 계정')
    await user.type(getInputByLabel('증권사 이름'), '키움증권')
    await user.type(getInputByLabel('API 키'), 'api-key')
    await user.type(getInputByLabel('API 시크릿'), 'secret')
    await user.type(getInputByLabel('API 베이스 URL'), 'https://api.example.com')
    await user.type(getInputByLabel('설명'), '계정 설명')

    await user.click(screen.getByRole('button', { name: /^계정 추가$/ }))

    await waitFor(() => {
      expect(createAccount).toHaveBeenCalledWith({
        variables: {
          input: {
            name: '신규 계정',
            brokerName: '키움증권',
            apiKey: 'api-key',
            apiSecret: 'secret',
            apiBaseUrl: 'https://api.example.com',
            description: '계정 설명',
          },
        },
      })
    })

    expect(refetch).toHaveBeenCalled()
    expect(screen.queryByText('새 계정 추가')).not.toBeInTheDocument()
  })

  it('계정을 삭제하면 확인 대화상자를 거쳐 삭제 요청을 보낸다', async () => {
    const refetch = vi.fn()
    const createAccount = vi.fn()
    const deleteAccount = vi.fn().mockResolvedValue({})
    const refreshHoldings = vi.fn()

    mockUseQuery.mockReturnValue({
      data: {
        brokerageAccounts: [
          {
            id: 'acc-1',
            name: '삭제 대상 계정',
            brokerName: '테스트 증권',
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
    })

    mockUseMutation.mockImplementation((document) => {
      if (document === CREATE_BROKERAGE_ACCOUNT) {
        return [createAccount, { loading: false }]
      }
      if (document === DELETE_BROKERAGE_ACCOUNT) {
        return [deleteAccount, { loading: false }]
      }
      if (document === REFRESH_BROKERAGE_HOLDINGS) {
        return [refreshHoldings, { loading: false }]
      }

      return [vi.fn(), { loading: false }]
    })

    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)

    const user = userEvent.setup()
    renderWithProviders(<BrokerageAccounts />, { withApollo: false })

    await user.click(screen.getByRole('button', { name: '삭제' }))

    await waitFor(() => {
      expect(deleteAccount).toHaveBeenCalledWith({ variables: { id: 'acc-1' } })
    })

    expect(confirmSpy).toHaveBeenCalledWith('이 계정을 삭제하시겠습니까?')
    expect(refetch).toHaveBeenCalled()

    confirmSpy.mockRestore()
  })

  it('보유 종목 새로고침 시 알림을 표시한다', async () => {
    const refetch = vi.fn()
    const createAccount = vi.fn()
    const deleteAccount = vi.fn()
    const refreshHoldings = vi.fn().mockResolvedValue({})

    mockUseQuery.mockReturnValue({
      data: {
        brokerageAccounts: [
          {
            id: 'acc-1',
            name: '새로고침 계정',
            brokerName: '테스트 증권',
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
    })

    mockUseMutation.mockImplementation((document) => {
      if (document === CREATE_BROKERAGE_ACCOUNT) {
        return [createAccount, { loading: false }]
      }
      if (document === DELETE_BROKERAGE_ACCOUNT) {
        return [deleteAccount, { loading: false }]
      }
      if (document === REFRESH_BROKERAGE_HOLDINGS) {
        return [refreshHoldings, { loading: false }]
      }

      return [vi.fn(), { loading: false }]
    })

    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {})

    const user = userEvent.setup()
    renderWithProviders(<BrokerageAccounts />, { withApollo: false })

    await user.click(screen.getByRole('button', { name: '보유종목 새로고침' }))

    await waitFor(() => {
      expect(refreshHoldings).toHaveBeenCalledWith({ variables: { accountId: 'acc-1' } })
    })

    expect(alertSpy).toHaveBeenCalledWith('보유 종목이 업데이트되었습니다.')

    alertSpy.mockRestore()
  })
})
