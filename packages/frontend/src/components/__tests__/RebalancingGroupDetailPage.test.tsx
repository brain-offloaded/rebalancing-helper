import userEvent from '@testing-library/user-event';
import { screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { renderWithProviders } from '../../test-utils/render';
import { RebalancingGroupDetailPage } from '../RebalancingGroupDetailPage';
import {
  GetInvestmentRecommendationDocument,
  GetRebalancingAnalysisDocument,
  GetRebalancingGroupsDocument,
  GetTagsDocument,
  SetTargetAllocationsDocument,
  UpdateRebalancingGroupDocument,
  DeleteRebalancingGroupDocument,
} from '../../graphql/__generated__';

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

const defaultGroups = [
  {
    id: 'group-1',
    name: '성장 그룹',
    description: '성장 전략 소개',
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
};

const defaultRecommendation = {
  investmentRecommendation: [
    {
      tagId: 'tag-1',
      tagName: '성장주',
      recommendedAmount: 600,
      recommendedPercentage: 60,
      suggestedSymbols: ['AAPL', 'MSFT'],
      symbolQuotes: [
        {
          symbol: 'AAPL',
          unitPriceInBaseCurrency: 200,
          baseCurrency: 'USD',
          priceAvailable: true,
        },
        {
          symbol: 'MSFT',
          unitPriceInBaseCurrency: 300,
          baseCurrency: 'USD',
          priceAvailable: true,
        },
      ],
      baseCurrency: 'USD',
    },
    {
      tagId: 'tag-2',
      tagName: '배당주',
      recommendedAmount: 400,
      recommendedPercentage: 40,
      suggestedSymbols: ['KO'],
      symbolQuotes: [
        {
          symbol: 'KO',
          unitPriceInBaseCurrency: 50,
          baseCurrency: 'USD',
          priceAvailable: true,
        },
      ],
      baseCurrency: 'USD',
    },
  ],
};

const setupMocks = ({
  groups = defaultGroups,
  tags = defaultTags,
  analysis = defaultAnalysis,
  recommendation = defaultRecommendation,
  groupsLoading = false,
  analysisLoading = false,
}: {
  groups?: typeof defaultGroups;
  tags?: typeof defaultTags;
  analysis?: typeof defaultAnalysis;
  recommendation?: typeof defaultRecommendation;
  groupsLoading?: boolean;
  analysisLoading?: boolean;
} = {}) => {
  const refetchGroups = vi.fn();
  const refetchAnalysis = vi.fn();
  const setTargets = vi.fn().mockResolvedValue({});
  const updateGroup = vi.fn().mockResolvedValue({});
  const deleteGroup = vi.fn().mockResolvedValue({});

  mockUseQuery.mockImplementation((document, options) => {
    if (document === GetRebalancingGroupsDocument) {
      return {
        data: groupsLoading ? undefined : { rebalancingGroups: groups },
        loading: groupsLoading,
        refetch: refetchGroups,
      };
    }

    if (document === GetTagsDocument) {
      return { data: { tags }, loading: false };
    }

    if (document === GetRebalancingAnalysisDocument) {
      if (options?.skip || !options?.variables?.groupId) {
        return {
          data: undefined,
          loading: analysisLoading,
          refetch: refetchAnalysis,
        };
      }

      return {
        data: analysis,
        loading: analysisLoading,
        refetch: refetchAnalysis,
      };
    }

    if (document === GetInvestmentRecommendationDocument) {
      if (options?.skip) {
        return { data: undefined, loading: false };
      }

      return { data: recommendation, loading: false };
    }

    throw new Error('예상치 못한 쿼리 호출');
  });

  mockUseMutation.mockImplementation((document) => {
    if (document === SetTargetAllocationsDocument) {
      return [setTargets, { loading: false }];
    }
    if (document === UpdateRebalancingGroupDocument) {
      return [updateGroup, { loading: false }];
    }
    if (document === DeleteRebalancingGroupDocument) {
      return [deleteGroup, { loading: false }];
    }

    return [vi.fn(), { loading: false }];
  });

  return {
    refetchGroups,
    refetchAnalysis,
    setTargets,
    updateGroup,
    deleteGroup,
  };
};

describe('RebalancingGroupDetailPage', () => {
  beforeEach(() => {
    mockUseQuery.mockReset();
    mockUseMutation.mockReset();
  });

  it('데이터를 불러오는 동안 로딩 메시지를 보여준다', () => {
    setupMocks({ groupsLoading: true });

    renderWithProviders(
      <RebalancingGroupDetailPage groupId="group-1" onClose={vi.fn()} />,
      { withApollo: false },
    );

    expect(screen.getByText('로딩 중...')).toBeInTheDocument();
  });

  it('그룹 상세 정보를 렌더링한다', () => {
    setupMocks();

    renderWithProviders(
      <RebalancingGroupDetailPage groupId="group-1" onClose={vi.fn()} />,
      { withApollo: false },
    );

    expect(screen.getByText('성장 그룹')).toBeInTheDocument();
    expect(screen.getByText('성장 전략 소개')).toBeInTheDocument();
    expect(screen.getByText('총 평가 금액')).toBeInTheDocument();
    expect(screen.getByText('투자 추천')).toBeInTheDocument();
    expect(screen.getByText('AAPL, MSFT')).toBeInTheDocument();
  });

  it('투자 예정 금액 입력을 비워도 빈 값으로 유지한다', async () => {
    setupMocks();
    const user = userEvent.setup();

    renderWithProviders(
      <RebalancingGroupDetailPage groupId="group-1" onClose={vi.fn()} />,
      { withApollo: false },
    );

    const amountInput = screen.getByLabelText(/투자 예정 금액/);
    await user.clear(amountInput);

    expect((amountInput as HTMLInputElement).value).toBe('');
  });

  it('추천 종목 수량 입력값으로 예상 투자액을 계산한다', async () => {
    setupMocks();
    const user = userEvent.setup();

    renderWithProviders(
      <RebalancingGroupDetailPage groupId="group-1" onClose={vi.fn()} />,
      { withApollo: false },
    );

    const quantityInput = (await screen.findByLabelText(
      'AAPL 매수 수량',
    )) as HTMLInputElement;
    await user.clear(quantityInput);
    await user.type(quantityInput, '3');

    expect(quantityInput.value).toBe('3');
    expect(quantityInput.closest('tr')).toHaveTextContent('600');
  });

  it('대시보드로 돌아가기 버튼을 클릭하면 onClose를 호출한다', async () => {
    setupMocks();
    const user = userEvent.setup();
    const onClose = vi.fn();

    renderWithProviders(
      <RebalancingGroupDetailPage groupId="group-1" onClose={onClose} />,
      { withApollo: false },
    );

    await user.click(
      screen.getByRole('button', { name: '대시보드로 돌아가기' }),
    );

    expect(onClose).toHaveBeenCalled();
  });

  it('목표 비율을 저장하면 mutation을 호출하고 분석을 새로고침한다', async () => {
    const { setTargets, refetchAnalysis } = setupMocks();
    const user = userEvent.setup();
    const alertSpy = vi
      .spyOn(window, 'alert')
      .mockImplementation(() => undefined);

    renderWithProviders(
      <RebalancingGroupDetailPage groupId="group-1" onClose={vi.fn()} />,
      { withApollo: false },
    );

    const growthInput = screen.getByLabelText('성장주 목표 비율');
    const dividendInput = screen.getByLabelText('배당주 목표 비율');

    await user.clear(growthInput);
    await user.type(growthInput, '55');
    await user.clear(dividendInput);
    await user.type(dividendInput, '45');

    await user.click(screen.getByRole('button', { name: '목표 비율 저장' }));

    await waitFor(() => expect(setTargets).toHaveBeenCalled());

    expect(setTargets).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: {
          input: {
            groupId: 'group-1',
            targets: [
              { tagId: 'tag-1', targetPercentage: 55 },
              { tagId: 'tag-2', targetPercentage: 45 },
            ],
          },
        },
      }),
    );
    expect(refetchAnalysis).toHaveBeenCalled();
    expect(alertSpy).toHaveBeenCalledWith('목표 비율을 저장했습니다.');

    alertSpy.mockRestore();
  });

  it('태그 저장 시 그룹 정보를 갱신하고 분석을 새로고침한다', async () => {
    const { updateGroup, refetchGroups, refetchAnalysis } = setupMocks();
    const user = userEvent.setup();
    const alertSpy = vi
      .spyOn(window, 'alert')
      .mockImplementation(() => undefined);

    renderWithProviders(
      <RebalancingGroupDetailPage groupId="group-1" onClose={vi.fn()} />,
      { withApollo: false },
    );

    await user.click(screen.getByRole('button', { name: '태그 저장' }));

    await waitFor(() => expect(updateGroup).toHaveBeenCalled());

    expect(updateGroup).toHaveBeenCalledWith(
      expect.objectContaining({
        variables: {
          input: {
            id: 'group-1',
            tagIds: ['tag-1', 'tag-2'],
          },
        },
      }),
    );
    expect(refetchGroups).toHaveBeenCalled();
    expect(refetchAnalysis).toHaveBeenCalled();
    expect(alertSpy).toHaveBeenCalledWith('태그 구성을 저장했습니다.');

    alertSpy.mockRestore();
  });

  it('그룹 삭제를 확인하면 삭제 후 onClose를 호출한다', async () => {
    const { deleteGroup, refetchGroups } = setupMocks();
    const user = userEvent.setup();
    const alertSpy = vi
      .spyOn(window, 'alert')
      .mockImplementation(() => undefined);
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(true);
    const onClose = vi.fn();

    renderWithProviders(
      <RebalancingGroupDetailPage groupId="group-1" onClose={onClose} />,
      { withApollo: false },
    );

    await user.click(screen.getByRole('button', { name: '그룹 삭제' }));

    await waitFor(() => expect(deleteGroup).toHaveBeenCalled());

    expect(deleteGroup).toHaveBeenCalledWith({ variables: { id: 'group-1' } });
    expect(refetchGroups).toHaveBeenCalled();
    expect(alertSpy).toHaveBeenCalledWith('그룹을 삭제했습니다.');
    expect(onClose).toHaveBeenCalled();

    alertSpy.mockRestore();
    confirmSpy.mockRestore();
  });
});
