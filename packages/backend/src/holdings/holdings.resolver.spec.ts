import { HoldingsResolver } from './holdings.resolver';
import { HoldingsService } from './holdings.service';
import {
  AddHoldingTagInput,
  RemoveHoldingTagInput,
  SetHoldingTagsInput,
} from './holdings.dto';
import { HoldingTag } from './holdings.entities';

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

  it('holdingTags는 심볼이 없으면 undefined를 전달한다', async () => {
    const tags = [createHoldingTag()];
    service.getHoldingTags.mockResolvedValue(tags);

    await expect(resolver.holdingTags()).resolves.toBe(tags);
    expect(service.getHoldingTags).toHaveBeenCalledWith(undefined);
  });

  it('holdingTags는 심볼을 전달하면 해당 값으로 조회한다', async () => {
    const tags = [createHoldingTag({ holdingSymbol: 'QQQ' })];
    service.getHoldingTags.mockResolvedValue(tags);

    await expect(resolver.holdingTags('QQQ')).resolves.toBe(tags);
    expect(service.getHoldingTags).toHaveBeenCalledWith('QQQ');
  });

  it('tagsForHolding은 서비스 결과를 반환한다', async () => {
    const tagIds = ['tag-1', 'tag-2'];
    service.getTagsForHolding.mockResolvedValue(tagIds);

    await expect(resolver.tagsForHolding('SPY')).resolves.toBe(tagIds);
    expect(service.getTagsForHolding).toHaveBeenCalledWith('SPY');
  });

  it('holdingsForTag는 서비스 위임을 수행한다', async () => {
    const symbols = ['SPY'];
    service.getHoldingsForTag.mockResolvedValue(symbols);

    await expect(resolver.holdingsForTag('tag-1')).resolves.toBe(symbols);
    expect(service.getHoldingsForTag).toHaveBeenCalledWith('tag-1');
  });

  it('addHoldingTag는 입력값을 전달한다', async () => {
    const input: AddHoldingTagInput = {
      holdingSymbol: 'SPY',
      tagId: 'tag-1',
    };
    const tag = createHoldingTag({
      holdingSymbol: input.holdingSymbol,
      tagId: input.tagId,
    });
    service.addTag.mockResolvedValue(tag);

    await expect(resolver.addHoldingTag(input)).resolves.toBe(tag);
    expect(service.addTag).toHaveBeenCalledWith(input);
  });

  it('removeHoldingTag는 Boolean 결과를 그대로 반환한다', async () => {
    const input: RemoveHoldingTagInput = {
      holdingSymbol: 'SPY',
      tagId: 'tag-1',
    };
    service.removeTag.mockResolvedValue(true);

    await expect(resolver.removeHoldingTag(input)).resolves.toBe(true);
    expect(service.removeTag).toHaveBeenCalledWith(input);
  });

  it('setHoldingTags는 결과 목록을 반환한다', async () => {
    const input: SetHoldingTagsInput = {
      holdingSymbol: 'SPY',
      tagIds: ['tag-1', 'tag-2'],
    };
    const tags = [
      createHoldingTag({ holdingSymbol: input.holdingSymbol, tagId: 'tag-1' }),
    ];
    service.setTags.mockResolvedValue(tags);

    await expect(resolver.setHoldingTags(input)).resolves.toBe(tags);
    expect(service.setTags).toHaveBeenCalledWith(input);
  });
});
