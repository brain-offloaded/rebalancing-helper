import userEvent from '@testing-library/user-event';
import { screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '../../test-utils/render';
import { RebalancingGroups } from '../RebalancingGroups';

const mockUseGetRebalancingGroupsQuery = vi.fn();
const mockUseGetTagsQuery = vi.fn();
const mockUseCreateRebalancingGroupMutation = vi.fn();

let latestModalProps: {
  open: boolean;
  groupId: string | null;
  onClose: () => void;
} | null = null;

vi.mock('../RebalancingGroupManagementModal', () => ({
  RebalancingGroupManagementModal: (props: {
    open: boolean;
    groupId: string | null;
    onClose: () => void;
  }) => {
    latestModalProps = props;
    if (!props.open) {
      return null;
    }

    return (
      <div data-testid="management-modal">
        {props.groupId}
        <button type="button" onClick={props.onClose}>
          모달 닫기
        </button>
      </div>
    );
  },
}));

vi.mock('../../graphql/__generated__', () => ({
  useGetRebalancingGroupsQuery: (...args: unknown[]) =>
    mockUseGetRebalancingGroupsQuery(...args),
  useGetTagsQuery: (...args: unknown[]) => mockUseGetTagsQuery(...args),
  useCreateRebalancingGroupMutation: (...args: unknown[]) =>
    mockUseCreateRebalancingGroupMutation(...args),
}));

describe('RebalancingGroups', () => {
  const refetchGroups = vi.fn().mockResolvedValue({});
  const createGroup = vi.fn().mockResolvedValue({});

  beforeEach(() => {
    latestModalProps = null;
    refetchGroups.mockClear();
    createGroup.mockClear();
    mockUseGetRebalancingGroupsQuery.mockReset();
    mockUseGetTagsQuery.mockReset();
    mockUseCreateRebalancingGroupMutation.mockReset();

    mockUseGetRebalancingGroupsQuery.mockReturnValue({
      data: {
        rebalancingGroups: [
          {
            id: 'group-1',
            name: '성장 그룹',
            description: '장기 성장주 비중 관리',
            tagIds: ['tag-1'],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          },
        ],
      },
      loading: false,
      refetch: refetchGroups,
    });
    mockUseGetTagsQuery.mockReturnValue({
      data: {
        tags: [{ id: 'tag-1', name: '성장주', color: '#ff0000' }],
      },
      loading: false,
    });
    mockUseCreateRebalancingGroupMutation.mockReturnValue([
      createGroup,
      { loading: false },
    ]);
  });

  it('리밸런싱 그룹 카드에서 관리 버튼을 표시한다', () => {
    renderWithProviders(<RebalancingGroups />, { withApollo: false });

    expect(screen.getByRole('button', { name: '관리' })).toBeInTheDocument();
  });

  it('관리 버튼을 클릭하면 모달이 열리고 닫기 시 그룹 목록을 새로고침한다', async () => {
    renderWithProviders(<RebalancingGroups />, { withApollo: false });

    await userEvent.click(screen.getByRole('button', { name: '관리' }));

    const modal = await screen.findByTestId('management-modal');
    expect(modal).toHaveTextContent('group-1');
    expect(latestModalProps?.open).toBe(true);

    await userEvent.click(screen.getByText('모달 닫기'));

    await waitFor(() => {
      expect(refetchGroups).toHaveBeenCalled();
    });
  });

  it('새 그룹 만들기 버튼을 누르면 생성 폼을 열고 제출 시 그룹을 생성한다', async () => {
    renderWithProviders(<RebalancingGroups />, { withApollo: false });

    await userEvent.click(
      screen.getByRole('button', { name: '새 그룹 만들기' }),
    );

    const nameInput = screen.getByLabelText('그룹 이름');
    await userEvent.type(nameInput, '새로운 그룹');
    await userEvent.click(screen.getByRole('button', { name: '그룹 생성' }));

    await waitFor(() => {
      expect(createGroup).toHaveBeenCalledWith({
        variables: {
          input: {
            name: '새로운 그룹',
            description: null,
            tagIds: [],
          },
        },
      });
    });
  });
});
