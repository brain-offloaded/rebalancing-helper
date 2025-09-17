import { RebalancingResolver } from './rebalancing.resolver';
import { RebalancingService } from './rebalancing.service';
import {
  CreateRebalancingGroupInput,
  UpdateRebalancingGroupInput,
  SetTargetAllocationsInput,
  CalculateInvestmentInput,
} from './rebalancing.dto';
import {
  InvestmentRecommendation,
  RebalancingAnalysis,
  RebalancingGroup,
  TagAllocation,
} from './rebalancing.entities';

const createGroup = (overrides: Partial<RebalancingGroup> = {}): RebalancingGroup => ({
  id: overrides.id ?? 'group-1',
  name: overrides.name ?? '테스트 그룹',
  description: overrides.description ?? null,
  tagIds: overrides.tagIds ?? ['tag-1'],
  createdAt: overrides.createdAt ?? new Date('2024-01-01T00:00:00Z'),
  updatedAt: overrides.updatedAt ?? new Date('2024-01-02T00:00:00Z'),
});

const createAllocation = (
  overrides: Partial<TagAllocation> = {},
): TagAllocation => ({
  tagId: overrides.tagId ?? 'tag-1',
  tagName: overrides.tagName ?? '성장주',
  tagColor: overrides.tagColor ?? '#ff0000',
  currentValue: overrides.currentValue ?? 1000,
  currentPercentage: overrides.currentPercentage ?? 0.5,
  targetPercentage: overrides.targetPercentage ?? 0.6,
  difference: overrides.difference ?? 0.1,
});

const createAnalysis = (
  overrides: Partial<RebalancingAnalysis> = {},
): RebalancingAnalysis => ({
  groupId: overrides.groupId ?? 'group-1',
  groupName: overrides.groupName ?? '테스트 그룹',
  totalValue: overrides.totalValue ?? 1000,
  allocations: overrides.allocations ?? [createAllocation()],
  lastUpdated: overrides.lastUpdated ?? new Date('2024-01-02T00:00:00Z'),
});

const createRecommendation = (
  overrides: Partial<InvestmentRecommendation> = {},
): InvestmentRecommendation => ({
  tagId: overrides.tagId ?? 'tag-1',
  tagName: overrides.tagName ?? '성장주',
  recommendedAmount: overrides.recommendedAmount ?? 100,
  recommendedPercentage: overrides.recommendedPercentage ?? 0.1,
  suggestedSymbols: overrides.suggestedSymbols ?? ['SPY'],
});

describe('RebalancingResolver', () => {
  let resolver: RebalancingResolver;
  let service: jest.Mocked<RebalancingService>;

  beforeEach(() => {
    service = {
      getGroups: jest.fn(),
      getGroup: jest.fn(),
      getRebalancingAnalysis: jest.fn(),
      createGroup: jest.fn(),
      updateGroup: jest.fn(),
      deleteGroup: jest.fn(),
      setTargetAllocations: jest.fn(),
      calculateInvestmentRecommendation: jest.fn(),
    } as unknown as jest.Mocked<RebalancingService>;

    resolver = new RebalancingResolver(service);
  });

  it('rebalancingGroups는 서비스의 그룹 목록을 반환한다', async () => {
    const groups = [createGroup()];
    service.getGroups.mockResolvedValue(groups);

    await expect(resolver.rebalancingGroups()).resolves.toBe(groups);
    expect(service.getGroups).toHaveBeenCalledTimes(1);
  });

  it('rebalancingGroup은 ID 기반 단일 그룹을 조회한다', async () => {
    const group = createGroup({ id: 'group-9' });
    service.getGroup.mockResolvedValue(group);

    await expect(resolver.rebalancingGroup('group-9')).resolves.toBe(group);
    expect(service.getGroup).toHaveBeenCalledWith('group-9');
  });

  it('rebalancingAnalysis는 분석 데이터를 반환한다', async () => {
    const analysis = createAnalysis({ groupId: 'group-1' });
    service.getRebalancingAnalysis.mockResolvedValue(analysis);

    await expect(resolver.rebalancingAnalysis('group-1')).resolves.toBe(analysis);
    expect(service.getRebalancingAnalysis).toHaveBeenCalledWith('group-1');
  });

  it('createRebalancingGroup은 생성 입력을 위임한다', async () => {
    const input: CreateRebalancingGroupInput = {
      name: '새 그룹',
      description: '설명',
      tagIds: ['tag-1'],
    };
    const group = createGroup({ name: input.name, description: input.description });
    service.createGroup.mockResolvedValue(group);

    await expect(resolver.createRebalancingGroup(input)).resolves.toBe(group);
    expect(service.createGroup).toHaveBeenCalledWith(input);
  });

  it('updateRebalancingGroup은 수정 입력을 서비스로 전달한다', async () => {
    const input: UpdateRebalancingGroupInput = {
      id: 'group-1',
      name: '수정된 이름',
    };
    const group = createGroup({ name: input.name });
    service.updateGroup.mockResolvedValue(group);

    await expect(resolver.updateRebalancingGroup(input)).resolves.toBe(group);
    expect(service.updateGroup).toHaveBeenCalledWith(input);
  });

  it('deleteRebalancingGroup은 Boolean 값을 반환한다', async () => {
    service.deleteGroup.mockResolvedValue(true);

    await expect(resolver.deleteRebalancingGroup('group-1')).resolves.toBe(true);
    expect(service.deleteGroup).toHaveBeenCalledWith('group-1');
  });

  it('setTargetAllocations는 성공 여부를 전달한다', async () => {
    const input: SetTargetAllocationsInput = {
      groupId: 'group-1',
      targets: [{ tagId: 'tag-1', targetPercentage: 0.5 }],
    };
    service.setTargetAllocations.mockResolvedValue(true);

    await expect(resolver.setTargetAllocations(input)).resolves.toBe(true);
    expect(service.setTargetAllocations).toHaveBeenCalledWith(input);
  });

  it('investmentRecommendation은 추천 결과를 반환한다', async () => {
    const input: CalculateInvestmentInput = {
      groupId: 'group-1',
      investmentAmount: 1000,
    };
    const recommendations = [createRecommendation({ recommendedAmount: 500 })];
    service.calculateInvestmentRecommendation.mockResolvedValue(recommendations);

    await expect(resolver.investmentRecommendation(input)).resolves.toBe(
      recommendations,
    );
    expect(service.calculateInvestmentRecommendation).toHaveBeenCalledWith(input);
  });
});
