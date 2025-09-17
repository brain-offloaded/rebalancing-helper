import userEvent from '@testing-library/user-event'
import { fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { renderWithProviders } from '../../test-utils/render'
import { Tags } from '../Tags'
import { CREATE_TAG, DELETE_TAG, GET_TAGS, UPDATE_TAG } from '../../graphql/tags'

const mockUseQuery = vi.fn()
const mockUseMutation = vi.fn()

vi.mock('@apollo/client', async () => {
  const actual = await vi.importActual<typeof import('@apollo/client')>(
    '@apollo/client',
  )

  return {
    ...actual,
    useQuery: (...args: Parameters<typeof actual.useQuery>) =>
      mockUseQuery(...args),
    useMutation: (...args: Parameters<typeof actual.useMutation>) =>
      mockUseMutation(...args),
  }
})

const getInputByLabel = (labelText: string, selector = 'input'): HTMLInputElement => {
  const label = screen.getByText(labelText)
  const container = label.parentElement
  const input = container?.querySelector(selector)

  if (!input) {
    throw new Error(`${labelText} 레이블과 연결된 입력을 찾을 수 없습니다.`)
  }

  return input as HTMLInputElement
}

describe('Tags', () => {
  beforeEach(() => {
    mockUseQuery.mockReset()
    mockUseMutation.mockReset()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  it('태그 목록을 불러오는 동안 로딩 메시지를 보여준다', () => {
    mockUseQuery.mockImplementation((query) => {
      if (query === GET_TAGS) {
        return { data: undefined, loading: true, error: undefined }
      }

      throw new Error('예상치 못한 쿼리 호출')
    })
    mockUseMutation.mockImplementation(() => [vi.fn(), { loading: false }])

    renderWithProviders(<Tags />, { withApollo: false })

    expect(screen.getByText('로딩 중...')).toBeInTheDocument()
  })

  it('태그 조회에 실패하면 오류 메시지를 표시한다', () => {
    mockUseQuery.mockImplementation((query) => {
      if (query === GET_TAGS) {
        return { data: undefined, loading: false, error: new Error('fetch failed') }
      }

      throw new Error('예상치 못한 쿼리 호출')
    })
    mockUseMutation.mockImplementation(() => [vi.fn(), { loading: false }])

    renderWithProviders(<Tags />, { withApollo: false })

    expect(screen.getByText('오류 발생: fetch failed')).toBeInTheDocument()
  })

  it('조회된 태그 목록을 렌더링한다', () => {
    const tags = [
      {
        id: 'tag-1',
        name: '성장주',
        description: '성장 기업',
        color: '#ff0000',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'tag-2',
        name: '배당주',
        description: null,
        color: '#00ff00',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ]

    mockUseQuery.mockImplementation((query) => {
      if (query === GET_TAGS) {
        return { data: { tags }, loading: false, error: undefined, refetch: vi.fn() }
      }

      throw new Error('예상치 못한 쿼리 호출')
    })
    mockUseMutation.mockImplementation(() => [vi.fn(), { loading: false }])

    renderWithProviders(<Tags />, { withApollo: false })

    expect(screen.getByText('성장주')).toBeInTheDocument()
    expect(screen.getByText('성장 기업')).toBeInTheDocument()
    expect(screen.getByText('배당주')).toBeInTheDocument()
  })

  it('새 태그를 추가한다', async () => {
    const refetch = vi.fn()
    const createTag = vi.fn().mockResolvedValue({})

    mockUseQuery.mockImplementation((query) => {
      if (query === GET_TAGS) {
        return { data: { tags: [] }, loading: false, error: undefined, refetch }
      }

      throw new Error('예상치 못한 쿼리 호출')
    })
    mockUseMutation.mockImplementation((document) => {
      if (document === CREATE_TAG) {
        return [createTag, { loading: false }]
      }
      if (document === UPDATE_TAG) {
        return [vi.fn(), { loading: false }]
      }
      if (document === DELETE_TAG) {
        return [vi.fn(), { loading: false }]
      }

      return [vi.fn(), { loading: false }]
    })

    const user = userEvent.setup()

    renderWithProviders(<Tags />, { withApollo: false })

    await user.click(screen.getByRole('button', { name: '태그 추가' }))

    await user.type(getInputByLabel('태그 이름'), '여행')
    await user.type(getInputByLabel('설명'), '여행 관련 지출')

    const colorInput = getInputByLabel('색상', 'input[type="color"]')
    fireEvent.input(colorInput, { target: { value: '#123456' } })

    await user.click(screen.getByRole('button', { name: '추가' }))

    await waitFor(() => {
      expect(createTag).toHaveBeenCalledWith({
        variables: {
          input: {
            name: '여행',
            description: '여행 관련 지출',
            color: '#123456',
          },
        },
      })
    })

    expect(refetch).toHaveBeenCalled()
    expect(screen.queryByText('새 태그 추가')).not.toBeInTheDocument()
  })

  it('기존 태그를 수정한다', async () => {
    const tag = {
      id: 'tag-1',
      name: '성장주',
      description: '성장 기업',
      color: '#ff0000',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    const refetch = vi.fn()
    const updateTag = vi.fn().mockResolvedValue({})

    mockUseQuery.mockImplementation((query) => {
      if (query === GET_TAGS) {
        return { data: { tags: [tag] }, loading: false, error: undefined, refetch }
      }

      throw new Error('예상치 못한 쿼리 호출')
    })
    mockUseMutation.mockImplementation((document) => {
      if (document === UPDATE_TAG) {
        return [updateTag, { loading: false }]
      }
      if (document === CREATE_TAG) {
        return [vi.fn(), { loading: false }]
      }
      if (document === DELETE_TAG) {
        return [vi.fn(), { loading: false }]
      }

      return [vi.fn(), { loading: false }]
    })

    const user = userEvent.setup()

    renderWithProviders(<Tags />, { withApollo: false })

    await user.click(screen.getByRole('button', { name: '수정' }))

    const nameInput = getInputByLabel('태그 이름')
    await user.clear(nameInput)
    await user.type(nameInput, '우량주')

    const form = screen.getByText('태그 수정').parentElement?.querySelector('form')
    if (!form) {
      throw new Error('태그 수정 폼을 찾을 수 없습니다.')
    }

    await user.click(within(form).getByRole('button', { name: '수정' }))

    await waitFor(() => {
      expect(updateTag).toHaveBeenCalledWith({
        variables: {
          input: {
            id: 'tag-1',
            name: '우량주',
            description: '성장 기업',
            color: '#ff0000',
          },
        },
      })
    })

    expect(refetch).toHaveBeenCalled()
    expect(screen.queryByText('태그 수정')).not.toBeInTheDocument()
  })

  it('태그를 삭제한다', async () => {
    const tag = {
      id: 'tag-1',
      name: '성장주',
      description: '성장 기업',
      color: '#ff0000',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    const refetch = vi.fn()
    const deleteTag = vi.fn().mockResolvedValue({})

    mockUseQuery.mockImplementation((query) => {
      if (query === GET_TAGS) {
        return { data: { tags: [tag] }, loading: false, error: undefined, refetch }
      }

      throw new Error('예상치 못한 쿼리 호출')
    })
    mockUseMutation.mockImplementation((document) => {
      if (document === DELETE_TAG) {
        return [deleteTag, { loading: false }]
      }
      if (document === CREATE_TAG) {
        return [vi.fn(), { loading: false }]
      }
      if (document === UPDATE_TAG) {
        return [vi.fn(), { loading: false }]
      }

      return [vi.fn(), { loading: false }]
    })

    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true)
    const user = userEvent.setup()

    renderWithProviders(<Tags />, { withApollo: false })

    await user.click(screen.getByRole('button', { name: '삭제' }))

    await waitFor(() => {
      expect(deleteTag).toHaveBeenCalledWith({ variables: { id: 'tag-1' } })
    })

    expect(refetch).toHaveBeenCalled()
    expect(confirmSpy).toHaveBeenCalledWith('이 태그를 삭제하시겠습니까?')

    confirmSpy.mockRestore()
  })
})
