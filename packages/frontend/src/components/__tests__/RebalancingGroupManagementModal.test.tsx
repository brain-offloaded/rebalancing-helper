import userEvent from '@testing-library/user-event';
import { screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { renderWithProviders } from '../../test-utils/render';
import { RebalancingGroupManagementModal } from '../RebalancingGroupManagementModal';

const mockUseGetRebalancingGroupsQuery = vi.fn();
const mockUseGetTagsQuery = vi.fn();
const mockUseGetRebalancingAnalysisQuery = vi.fn();
const mockUseGetInvestmentRecommendationQuery = vi.fn();
const mockUseSetTargetAllocationsMutation = vi.fn();
const mockUseUpdateRebalancingGroupMutation = vi.fn();
const mockUseDeleteRebalancingGroupMutation = vi.fn();

vi.mock('recharts', () => {
  const MockComponent = ({ children }: { children?: ReactNode }) => (
    <div>{children}</div>
  );

  return {
    ResponsiveContainer: MockComponent,
    PieChart: MockComponent,
    Pie: MockComponent,
    Cell: MockComponent,
    BarChart: MockComponent,
    Bar: MockComponent,
    XAxis: MockComponent,
    YAxis: MockComponent,
    CartesianGrid: MockComponent,
    Tooltip: MockComponent,
    Legend: MockComponent,
  };
});

vi.mock('../../graphql/__generated__', () => ({
  useGetRebalancingGroupsQuery: (...args: unknown[]) =>
    mockUseGetRebalancingGroupsQuery(...args),
  useGetTagsQuery: (...args: unknown[]) => mockUseGetTagsQuery(...args),
  useGetRebalancingAnalysisQuery: (...args: unknown[]) =>
    mockUseGetRebalancingAnalysisQuery(...args),
  useGetInvestmentRecommendationQuery: (...args: unknown[]) =>
    mockUseGetInvestmentRecommendationQuery(...args),
  useSetTargetAllocationsMutation: (...args: unknown[]) =>
    mockUseSetTargetAllocationsMutation(...args),
  useUpdateRebalancingGroupMutation: (...args: unknown[]) =>
    mockUseUpdateRebalancingGroupMutation(...args),
  useDeleteRebalancingGroupMutation: (...args: unknown[]) =>
    mockUseDeleteRebalancingGroupMutation(...args),
}));

describe('RebalancingGroupManagementModal', () => {
  const refetchGroups = vi.fn();
  const refetchAnalysis = vi.fn();
  const updateGroup = vi.fn().mockResolvedValue({});
  const setTargets = vi.fn().mockResolvedValue({});
  const deleteGroup = vi.fn().mockResolvedValue({});

  beforeEach(() => {
    mockUseGetRebalancingGroupsQuery.mockReturnValue({
      data: {
        rebalancingGroups: [
          {
            id: 'group-1',
            name: '성장 그룹',
            description: '성장 전략을 위한 그룹',
            tagIds: ['tag-1', 'tag-2'],
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
        tags: [
          { id: 'tag-1', name: '성장주', color: '#ff0000' },
          { id: 'tag-2', name: '배당주', color: '#00ff00' },
        ],
      },
      loading: false,
    });
    mockUseGetRebalancingAnalysisQuery.mockReturnValue({
      data: {
        rebalancingAnalysis: {
          groupId: 'group-1',
          groupName: '성장 그룹',
          totalValue: 1000,
          baseCurrency: 'USD',
          lastUpdated: new Date('2024-01-01T00:00:00Z').toISOString(),
          allocations: [
            {
              tagId: 'tag-1',
              tagName: '성장주',
              tagColor: '#ff0000',
              currentValue: 600,
              currentPercentage: 60,
              targetPercentage: 50,
              difference: 10,
            },
            {
              tagId: 'tag-2',
              tagName: '배당주',
              tagColor: '#00ff00',
              currentValue: 400,
              currentPercentage: 40,
              targetPercentage: 50,
              difference: -10,
            },
          ],
        },
      },
      loading: false,
      refetch: refetchAnalysis,
    });
    mockUseGetInvestmentRecommendationQuery.mockReturnValue({
      data: { investmentRecommendation: [] },
      loading: false,
    });
    mockUseUpdateRebalancingGroupMutation.mockReturnValue([
      updateGroup,
      { loading: false },
    ]);
    mockUseSetTargetAllocationsMutation.mockReturnValue([
      setTargets,
      { loading: false },
    ]);
    mockUseDeleteRebalancingGroupMutation.mockReturnValue([
      deleteGroup,
      { loading: false },
    ]);
    window.alert = vi.fn();
    window.confirm = vi.fn(() => true);
  });

  it('목표 비율 입력을 모두 지우면 빈 문자열이 유지된다', async () => {
    renderWithProviders(
      <RebalancingGroupManagementModal
        open
        groupId="group-1"
        onClose={vi.fn()}
      />,
      { withApollo: false },
    );

    const input = await screen.findByLabelText('성장주 목표 비율');
    await userEvent.clear(input);

    expect((input as HTMLInputElement).value).toBe('');
  });

  it('저장 버튼을 클릭하면 그룹 정보와 목표 비율을 저장하고 성공 알림을 표시한다', async () => {
    const onClose = vi.fn();

    renderWithProviders(
      <RebalancingGroupManagementModal
        open
        groupId="group-1"
        onClose={onClose}
      />,
      { withApollo: false },
    );

    const saveButton = await screen.findByRole('button', { name: '저장' });
    await userEvent.click(saveButton);

    await waitFor(() => {
      expect(updateGroup).toHaveBeenCalledTimes(2);
      expect(setTargets).toHaveBeenCalledTimes(1);
      expect(window.alert).toHaveBeenCalledWith(
        '리밸런싱 그룹 정보를 저장했습니다.',
      );
    });
  });

  it('삭제 버튼을 클릭하면 확인 후 그룹을 삭제하고 닫기 콜백을 호출한다', async () => {
    const onClose = vi.fn();

    renderWithProviders(
      <RebalancingGroupManagementModal
        open
        groupId="group-1"
        onClose={onClose}
      />,
      { withApollo: false },
    );

    const deleteButton = await screen.findByRole('button', { name: '삭제' });
    await userEvent.click(deleteButton);

    await waitFor(() => {
      expect(window.confirm).toHaveBeenCalled();
      expect(deleteGroup).toHaveBeenCalledTimes(1);
      expect(onClose).toHaveBeenCalled();
    });
  });
});
