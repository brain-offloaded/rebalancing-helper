import { HoldingsResolver } from './holdings.resolver';
import { HoldingsService } from './holdings.service';
import {
  AddHoldingTagInput,
  RemoveHoldingTagInput,
  SetHoldingTagsInput,
} from './holdings.dto';
import { HoldingTag } from './holdings.entities';
import { ActiveUserData } from '../auth/auth.types';

const mockUser: ActiveUserData = {
  userId: 'user-1',
  email: 'demo@example.com',
};

const createHoldingTag = (overrides: Partial<HoldingTag> = {}): HoldingTag => ({
  id: overrides.id ?? 'holding-tag-1',
  holdingSymbol: overrides.holdingSymbol ?? 'SPY',
  tagId: overrides.tagId ?? 'tag-1',
  createdAt: overrides.createdAt ?? new Date('2024-01-01T00:00:00Z'),
});

describe('HoldingsResolver', () => {
  let resolver: HoldingsResolver;
  let service: jest.Mocked<HoldingsService>;

  beforeEach(() => {
    service = {
      getHoldingTags: jest.fn(),
      getTagsForHolding: jest.fn(),
      getHoldingsForTag: jest.fn(),
      addTag: jest.fn(),
      removeTag: jest.fn(),
      setTags: jest.fn(),
    } as unknown as jest.Mocked<HoldingsService>;

    resolver = new HoldingsResolver(service);
  });

  it('holdingTags는 사용자 ID와 함께 조회한다', async () => {
    const tags = [createHoldingTag()];
    service.getHoldingTags.mockResolvedValue(tags);

    await expect(resolver.holdingTags(mockUser)).resolves.toBe(tags);
    expect(service.getHoldingTags).toHaveBeenCalledWith(
      mockUser.userId,
      undefined,
    );

    service.getHoldingTags.mockClear();
    service.getHoldingTags.mockResolvedValue(tags);

    await expect(resolver.holdingTags(mockUser, 'QQQ')).resolves.toBe(tags);
    expect(service.getHoldingTags).toHaveBeenCalledWith(mockUser.userId, 'QQQ');
  });

  it('tagsForHolding은 사용자 ID를 전달한다', async () => {
    const tagIds = ['tag-1', 'tag-2'];
    service.getTagsForHolding.mockResolvedValue(tagIds);

    await expect(resolver.tagsForHolding(mockUser, 'SPY')).resolves.toBe(
      tagIds,
    );
    expect(service.getTagsForHolding).toHaveBeenCalledWith(
      mockUser.userId,
      'SPY',
    );
  });

  it('holdingsForTag는 사용자 ID 기반으로 호출된다', async () => {
    const symbols = ['SPY'];
    service.getHoldingsForTag.mockResolvedValue(symbols);

    await expect(resolver.holdingsForTag(mockUser, 'tag-1')).resolves.toBe(
      symbols,
    );
    expect(service.getHoldingsForTag).toHaveBeenCalledWith(
      mockUser.userId,
      'tag-1',
    );
  });

  it('addHoldingTag는 사용자 ID와 입력을 전달한다', async () => {
    const input: AddHoldingTagInput = {
      holdingSymbol: 'SPY',
      tagId: 'tag-1',
    };
    const tag = createHoldingTag({
      holdingSymbol: input.holdingSymbol,
      tagId: input.tagId,
    });
    service.addTag.mockResolvedValue(tag);

    await expect(resolver.addHoldingTag(mockUser, input)).resolves.toBe(tag);
    expect(service.addTag).toHaveBeenCalledWith(mockUser.userId, input);
  });

  it('removeHoldingTag는 사용자 ID를 포함하여 호출한다', async () => {
    const input: RemoveHoldingTagInput = {
      holdingSymbol: 'SPY',
      tagId: 'tag-1',
    };
    service.removeTag.mockResolvedValue(true);

    await expect(resolver.removeHoldingTag(mockUser, input)).resolves.toBe(
      true,
    );
    expect(service.removeTag).toHaveBeenCalledWith(mockUser.userId, input);
  });

  it('setHoldingTags는 사용자 ID와 입력을 전달한다', async () => {
    const input: SetHoldingTagsInput = {
      holdingSymbol: 'SPY',
      tagIds: ['tag-1', 'tag-2'],
    };
    const tags = [
      createHoldingTag({ holdingSymbol: input.holdingSymbol, tagId: 'tag-1' }),
    ];
    service.setTags.mockResolvedValue(tags);

    await expect(resolver.setHoldingTags(mockUser, input)).resolves.toBe(tags);
    expect(service.setTags).toHaveBeenCalledWith(mockUser.userId, input);
  });
});
