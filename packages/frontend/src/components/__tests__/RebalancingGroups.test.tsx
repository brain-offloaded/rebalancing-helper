import userEvent from '@testing-library/user-event';
import { screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { renderWithProviders } from '../../test-utils/render';
import { RebalancingGroups } from '../RebalancingGroups';
import {
  CREATE_REBALANCING_GROUP,
  GET_INVESTMENT_RECOMMENDATION,
  GET_REBALANCING_ANALYSIS,
  GET_REBALANCING_GROUPS,
  SET_TARGET_ALLOCATIONS,
  ADD_TAGS_TO_REBALANCING_GROUP,
  REMOVE_TAGS_FROM_REBALANCING_GROUP,
  RENAME_REBALANCING_GROUP,
  DELETE_REBALANCING_GROUP,
} from '../../graphql/rebalancing';
import { GET_TAGS } from '../../graphql/tags';

const mockUseQuery = vi.fn();
const mockUseMutation = vi.fn();

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

const getFirstInputAfterLabel = (labelText: string): HTMLInputElement => {
  const label = screen.getByText(labelText);
  const container = label.parentElement;
  const input = container?.querySelector('input');

  if (!input) {
    throw new Error(`${labelText} 레이블과 연결된 입력을 찾을 수 없습니다.`);
  }

  return input as HTMLInputElement;
};

const defaultGroups = [
  {
    id: 'group-1',
    name: '성장 그룹',
    description: '성장주 중심 포트폴리오',
    tagIds: ['tag-1', 'tag-2'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const defaultTags = [
  { id: 'tag-1', name: '성장주', color: '#ff0000' },
  { id: 'tag-2', name: '배당주', color: '#00ff00' },
];

const defaultAnalysis = {
  rebalancingAnalysis: {
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
};

const defaultRecommendation = {
  investmentRecommendation: [
    {
      tagId: 'tag-1',
      tagName: '성장주',
      recommendedAmount: 600,
      recommendedPercentage: 60,
      suggestedSymbols: ['AAPL', 'MSFT'],
    },
    {
      tagId: 'tag-2',
      tagName: '배당주',
      recommendedAmount: 400,
      recommendedPercentage: 40,
      suggestedSymbols: ['KO'],
    },
  ],
};

const setupMocks = ({
  groups = defaultGroups,
  tags = defaultTags,
  analysis = defaultAnalysis,
  recommendation = defaultRecommendation,
  groupsLoading = false,
}: {
  groups?: typeof defaultGroups;
  tags?: typeof defaultTags;
  analysis?: typeof defaultAnalysis;
  recommendation?: typeof defaultRecommendation;
  groupsLoading?: boolean;
} = {}) => {
  const refetchGroups = vi.fn();
  const refetchAnalysis = vi.fn();
  const createGroup = vi.fn().mockResolvedValue({});
  const setTargets = vi.fn().mockResolvedValue({});
  const addTags = vi.fn().mockResolvedValue({});
  const removeTags = vi.fn().mockResolvedValue({});
  const renameGroup = vi.fn().mockResolvedValue({});
  const deleteGroup = vi.fn().mockResolvedValue({});

  mockUseQuery.mockImplementation((query, options) => {
    if (query === GET_REBALANCING_GROUPS) {
      return {
        data: groupsLoading ? undefined : { rebalancingGroups: groups },
        loading: groupsLoading,
        refetch: refetchGroups,
      };
    }
    if (query === GET_TAGS) {
      return { data: { tags }, loading: false };
    }
    if (query === GET_REBALANCING_ANALYSIS) {
      if (options?.skip || !options?.variables?.groupId) {
        return { data: undefined, loading: false, refetch: refetchAnalysis };
      }

      return { data: analysis, loading: false, refetch: refetchAnalysis };
    }
    if (query === GET_INVESTMENT_RECOMMENDATION) {
      if (options?.skip || !options?.variables?.input?.groupId) {
        return { data: undefined, loading: false };
      }

      return { data: recommendation, loading: false };
    }

    throw new Error('예상치 못한 쿼리 호출');
  });

  mockUseMutation.mockImplementation((document) => {
    if (document === CREATE_REBALANCING_GROUP) {
      return [createGroup, { loading: false }];
    }
    if (document === SET_TARGET_ALLOCATIONS) {
      return [setTargets, { loading: false }];
    }
    if (document === ADD_TAGS_TO_REBALANCING_GROUP) {
      return [addTags, { loading: false }];
    }
    if (document === REMOVE_TAGS_FROM_REBALANCING_GROUP) {
      return [removeTags, { loading: false }];
    }
    if (document === RENAME_REBALANCING_GROUP) {
      return [renameGroup, { loading: false }];
    }
    if (document === DELETE_REBALANCING_GROUP) {
      return [deleteGroup, { loading: false }];
    }

    return [vi.fn(), { loading: false }];
  });

  return {
    refetchGroups,
    refetchAnalysis,
    createGroup,
    setTargets,
    addTags,
    removeTags,
    renameGroup,
    deleteGroup,
  };
};

describe('RebalancingGroups', () => {
  beforeEach(() => {
    mockUseQuery.mockReset();
    mockUseMutation.mockReset();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('리밸런싱 그룹을 로딩하는 동안 메시지를 노출한다', () => {
    setupMocks({ groupsLoading: true });

    renderWithProviders(<RebalancingGroups />, { withApollo: false });

    expect(screen.getByText('로딩 중...')).toBeInTheDocument();
  });

  it('리밸런싱 그룹 목록과 태그 정보를 렌더링한다', () => {
    setupMocks();

    renderWithProviders(<RebalancingGroups />, { withApollo: false });

    expect(screen.getByText('성장 그룹')).toBeInTheDocument();
    expect(screen.getByText('성장주')).toBeInTheDocument();
    expect(screen.getByText('배당주')).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: '분석 보기' }),
    ).toBeInTheDocument();
  });

  it('새 리밸런싱 그룹을 생성한다', async () => {
    const { refetchGroups, createGroup } = setupMocks({ groups: [] });
    const user = userEvent.setup();

    renderWithProviders(<RebalancingGroups />, { withApollo: false });

    await user.click(screen.getByRole('button', { name: '그룹 추가' }));

    await user.type(getFirstInputAfterLabel('그룹 이름'), '배당 그룹');
    await user.type(getFirstInputAfterLabel('설명'), '배당주 전략');

    const checkboxes = screen.getAllByRole('checkbox');
    await user.click(checkboxes[0]);

    await user.click(screen.getByRole('button', { name: '그룹 추가' }));

    await waitFor(() => {
      expect(createGroup).toHaveBeenCalledWith({
        variables: {
          input: {
            name: '배당 그룹',
            description: '배당주 전략',
            tagIds: ['tag-1'],
          },
        },
      });
    });

    expect(refetchGroups).toHaveBeenCalled();
    expect(screen.queryByText('새 리밸런싱 그룹 추가')).not.toBeInTheDocument();
  });

  it('목표 비율 합이 100이 아니면 경고를 표시한다', async () => {
    setupMocks();
    const user = userEvent.setup();
    const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});

    renderWithProviders(<RebalancingGroups />, { withApollo: false });

    await user.click(screen.getByRole('button', { name: '분석 보기' }));
    await user.click(screen.getByRole('button', { name: '목표 비율 설정' }));

    const inputs = screen.getAllByRole('spinbutton');
    await user.clear(inputs[0]);
    await user.type(inputs[0], '40');
    await user.clear(inputs[1]);
    await user.type(inputs[1], '30');

    await user.click(screen.getByRole('button', { name: '목표 비율 적용' }));

    expect(alertSpy).toHaveBeenCalledWith(
      '목표 비율의 합이 100%가 되어야 합니다.',
    );

    alertSpy.mockRestore();
  });

  it('목표 비율을 저장하고 분석을 갱신한다', async () => {
    const { refetchAnalysis, setTargets } = setupMocks();
    const user = userEvent.setup();

    renderWithProviders(<RebalancingGroups />, { withApollo: false });

    await user.click(screen.getByRole('button', { name: '분석 보기' }));
    await user.click(screen.getByRole('button', { name: '목표 비율 설정' }));

    const inputs = screen.getAllByRole('spinbutton');
    await user.clear(inputs[0]);
    await user.type(inputs[0], '60');
    await user.clear(inputs[1]);
    await user.type(inputs[1], '40');

    await user.click(screen.getByRole('button', { name: '목표 비율 적용' }));

    await waitFor(() => {
      expect(setTargets).toHaveBeenCalledWith({
        variables: {
          input: {
            groupId: 'group-1',
            targets: [
              { tagId: 'tag-1', targetPercentage: 60 },
              { tagId: 'tag-2', targetPercentage: 40 },
            ],
          },
        },
      });
    });

    expect(refetchAnalysis).toHaveBeenCalled();
    expect(screen.queryByText('목표 비율 설정')).toBeInTheDocument();
    expect(screen.queryByText('목표 비율 적용')).not.toBeInTheDocument();
  });

  it('태그 관리에서 추가 및 제거를 처리한다', async () => {
    const extraTag = { id: 'tag-3', name: '가치주', color: '#0000ff' };
    const { addTags, removeTags, refetchGroups } = setupMocks({
      tags: [...defaultTags, extraTag],
      groups: [
        {
          ...defaultGroups[0],
          tagIds: ['tag-1', 'tag-2'],
        },
      ],
    });
    const user = userEvent.setup();

    renderWithProviders(<RebalancingGroups />, { withApollo: false });

    await user.click(
      screen.getByRole('button', { name: '태그 관리' }),
    );

    const 가치주Checkbox = screen.getByRole('checkbox', { name: '가치주' });
    const 배당주Checkbox = screen.getByRole('checkbox', { name: '배당주' });

    expect(배당주Checkbox).toBeChecked();

    await user.click(가치주Checkbox);
    await user.click(배당주Checkbox);

    await user.click(screen.getByRole('button', { name: '태그 변경 저장' }));

    await waitFor(() => {
      expect(addTags).toHaveBeenCalledWith({
        variables: { input: { groupId: 'group-1', tagIds: ['tag-3'] } },
      });
      expect(removeTags).toHaveBeenCalledWith({
        variables: { input: { groupId: 'group-1', tagIds: ['tag-2'] } },
      });
    });

    expect(refetchGroups).toHaveBeenCalled();
  });

  it('그룹 이름을 변경한다', async () => {
    const { renameGroup, refetchGroups } = setupMocks();
    const user = userEvent.setup();

    renderWithProviders(<RebalancingGroups />, { withApollo: false });

    await user.click(screen.getByRole('button', { name: '이름 변경' }));

    const input = screen.getByDisplayValue('성장 그룹');
    await user.clear(input);
    await user.type(input, '새로운 성장 전략');

    await user.click(screen.getByRole('button', { name: '이름 저장' }));

    await waitFor(() => {
      expect(renameGroup).toHaveBeenCalledWith({
        variables: {
          input: {
            groupId: 'group-1',
            name: '새로운 성장 전략',
          },
        },
      });
    });

    expect(refetchGroups).toHaveBeenCalled();
    expect(screen.queryByDisplayValue('새로운 성장 전략')).not.toBeInTheDocument();
  });

  it('그룹을 삭제하고 목록을 갱신한다', async () => {
    const { deleteGroup, refetchGroups } = setupMocks();
    const user = userEvent.setup();
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);

    renderWithProviders(<RebalancingGroups />, { withApollo: false });

    await user.click(screen.getByRole('button', { name: '그룹 삭제' }));

    await waitFor(() => {
      expect(deleteGroup).toHaveBeenCalledWith({
        variables: { id: 'group-1' },
      });
    });

    expect(refetchGroups).toHaveBeenCalled();
    confirmSpy.mockRestore();
  });
});
