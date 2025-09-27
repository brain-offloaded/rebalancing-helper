import { RebalancingResolver } from './rebalancing.resolver';
import { RebalancingService } from './rebalancing.service';
import {
  CreateRebalancingGroupInput,
  UpdateRebalancingGroupInput,
  SetTargetAllocationsInput,
  CalculateInvestmentInput,
  AddTagsToRebalancingGroupInput,
  RemoveTagsFromRebalancingGroupInput,
  RenameRebalancingGroupInput,
} from './rebalancing.dto';
import {
  InvestmentRecommendation,
  RebalancingAnalysis,
  RebalancingGroup,
} from './rebalancing.entities';
import { ActiveUserData } from '../auth/auth.types';

const mockUser: ActiveUserData = {
  userId: 'user-1',
  email: 'demo@example.com',
};

const createGroup = (
  overrides: Partial<RebalancingGroup> = {},
): RebalancingGroup => ({
  id: overrides.id ?? 'group-1',
  name: overrides.name ?? '테스트 그룹',
  description: overrides.description ?? null,
  tagIds: overrides.tagIds ?? ['tag-1'],
  createdAt: overrides.createdAt ?? new Date('2024-01-01T00:00:00Z'),
  updatedAt: overrides.updatedAt ?? new Date('2024-01-02T00:00:00Z'),
});

const createAnalysis = (
  overrides: Partial<RebalancingAnalysis> = {},
): RebalancingAnalysis => ({
  groupId: overrides.groupId ?? 'group-1',
  groupName: overrides.groupName ?? '테스트 그룹',
  totalValue: overrides.totalValue ?? 1000,
  allocations: overrides.allocations ?? [
    {
      tagId: 'tag-1',
      tagName: '성장주',
      tagColor: '#ff0000',
      currentValue: 600,
      currentPercentage: 60,
      targetPercentage: 70,
      difference: 10,
    },
  ],
  lastUpdated: overrides.lastUpdated ?? new Date('2024-01-02T00:00:00Z'),
});

const createRecommendation = (
  overrides: Partial<InvestmentRecommendation> = {},
): InvestmentRecommendation => ({
  tagId: overrides.tagId ?? 'tag-1',
  tagName: overrides.tagName ?? '성장주',
  recommendedAmount: overrides.recommendedAmount ?? 100,
  recommendedPercentage: overrides.recommendedPercentage ?? 50,
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
      addTagsToGroup: jest.fn(),
      removeTagsFromGroup: jest.fn(),
      renameGroup: jest.fn(),
      setTargetAllocations: jest.fn(),
      calculateInvestmentRecommendation: jest.fn(),
    } as unknown as jest.Mocked<RebalancingService>;

    resolver = new RebalancingResolver(service);
  });

  it('rebalancingGroups는 사용자 ID로 그룹 목록을 조회한다', async () => {
    const groups = [createGroup()];
    service.getGroups.mockResolvedValue(groups);

    await expect(resolver.rebalancingGroups(mockUser)).resolves.toBe(groups);
    expect(service.getGroups).toHaveBeenCalledWith(mockUser.userId);
  });

  it('rebalancingGroup은 사용자와 ID를 전달한다', async () => {
    const group = createGroup({ id: 'group-9' });
    service.getGroup.mockResolvedValue(group);

    await expect(resolver.rebalancingGroup(mockUser, 'group-9')).resolves.toBe(
      group,
    );
    expect(service.getGroup).toHaveBeenCalledWith(mockUser.userId, 'group-9');
  });

  it('rebalancingAnalysis는 사용자와 그룹 ID로 분석을 조회한다', async () => {
    const analysis = createAnalysis();
    service.getRebalancingAnalysis.mockResolvedValue(analysis);

    await expect(
      resolver.rebalancingAnalysis(mockUser, 'group-1'),
    ).resolves.toBe(analysis);
    expect(service.getRebalancingAnalysis).toHaveBeenCalledWith(
      mockUser.userId,
      'group-1',
    );
  });

  it('createRebalancingGroup은 사용자 ID와 입력을 서비스로 전달한다', async () => {
    const input: CreateRebalancingGroupInput = {
      name: '새 그룹',
      description: '설명',
      tagIds: ['tag-1'],
    };
    const group = createGroup({ name: input.name });
    service.createGroup.mockResolvedValue(group);

    await expect(
      resolver.createRebalancingGroup(mockUser, input),
    ).resolves.toBe(group);
    expect(service.createGroup).toHaveBeenCalledWith(mockUser.userId, input);
  });

  it('updateRebalancingGroup은 사용자 ID를 포함해 호출한다', async () => {
    const input: UpdateRebalancingGroupInput = {
      id: 'group-1',
      name: '수정된 이름',
    };
    const group = createGroup({ name: input.name });
    service.updateGroup.mockResolvedValue(group);

    await expect(
      resolver.updateRebalancingGroup(mockUser, input),
    ).resolves.toBe(group);
    expect(service.updateGroup).toHaveBeenCalledWith(mockUser.userId, input);
  });

  it('deleteRebalancingGroup은 사용자 ID와 그룹 ID를 전달한다', async () => {
    service.deleteGroup.mockResolvedValue(true);

    await expect(
      resolver.deleteRebalancingGroup(mockUser, 'group-1'),
    ).resolves.toBe(true);
    expect(service.deleteGroup).toHaveBeenCalledWith(
      mockUser.userId,
      'group-1',
    );
  });

  it('addTagsToRebalancingGroup은 사용자 ID와 입력을 전달한다', async () => {
    const input: AddTagsToRebalancingGroupInput = {
      groupId: 'group-1',
      tagIds: ['tag-3'],
    };
    const group = createGroup({ tagIds: ['tag-1', 'tag-3'] });
    service.addTagsToGroup.mockResolvedValue(group);

    await expect(
      resolver.addTagsToRebalancingGroup(mockUser, input),
    ).resolves.toBe(group);
    expect(service.addTagsToGroup).toHaveBeenCalledWith(
      mockUser.userId,
      input,
    );
  });

  it('removeTagsFromRebalancingGroup은 사용자 ID와 입력을 전달한다', async () => {
    const input: RemoveTagsFromRebalancingGroupInput = {
      groupId: 'group-1',
      tagIds: ['tag-2'],
    };
    const group = createGroup({ tagIds: ['tag-1'] });
    service.removeTagsFromGroup.mockResolvedValue(group);

    await expect(
      resolver.removeTagsFromRebalancingGroup(mockUser, input),
    ).resolves.toBe(group);
    expect(service.removeTagsFromGroup).toHaveBeenCalledWith(
      mockUser.userId,
      input,
    );
  });

  it('renameRebalancingGroup은 사용자 ID와 입력을 전달한다', async () => {
    const input: RenameRebalancingGroupInput = {
      groupId: 'group-1',
      name: '새 이름',
    };
    const group = createGroup({ name: input.name });
    service.renameGroup.mockResolvedValue(group);

    await expect(
      resolver.renameRebalancingGroup(mockUser, input),
    ).resolves.toBe(group);
    expect(service.renameGroup).toHaveBeenCalledWith(
      mockUser.userId,
      input,
    );
  });

  it('setTargetAllocations는 사용자 ID와 입력을 전달한다', async () => {
    const input: SetTargetAllocationsInput = {
      groupId: 'group-1',
      targets: [{ tagId: 'tag-1', targetPercentage: 50 }],
    };
    service.setTargetAllocations.mockResolvedValue(true);

    await expect(resolver.setTargetAllocations(mockUser, input)).resolves.toBe(
      true,
    );
    expect(service.setTargetAllocations).toHaveBeenCalledWith(
      mockUser.userId,
      input,
    );
  });

  it('investmentRecommendation은 사용자 ID와 입력을 전달한다', async () => {
    const input: CalculateInvestmentInput = {
      groupId: 'group-1',
      investmentAmount: 1000,
    };
    const recommendations = [createRecommendation()];
    service.calculateInvestmentRecommendation.mockResolvedValue(
      recommendations,
    );

    await expect(
      resolver.investmentRecommendation(mockUser, input),
    ).resolves.toBe(recommendations);
    expect(service.calculateInvestmentRecommendation).toHaveBeenCalledWith(
      mockUser.userId,
      input,
    );
  });
});
