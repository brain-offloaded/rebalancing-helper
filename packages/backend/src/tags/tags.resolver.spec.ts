import { TagsResolver } from './tags.resolver';
import { TagsService } from './tags.service';
import { CreateTagInput, UpdateTagInput } from './tags.dto';
import { Tag } from './tags.entities';

const createTag = (overrides: Partial<Tag> = {}): Tag => ({
  id: overrides.id ?? 'tag-1',
  name: overrides.name ?? '성장주',
  description: overrides.description ?? null,
  color: overrides.color ?? '#ff0000',
  createdAt: overrides.createdAt ?? new Date('2024-01-01T00:00:00Z'),
  updatedAt: overrides.updatedAt ?? new Date('2024-01-02T00:00:00Z'),
});

describe('TagsResolver', () => {
  let resolver: TagsResolver;
  let service: jest.Mocked<TagsService>;

  beforeEach(() => {
    service = {
      getTags: jest.fn(),
      getTag: jest.fn(),
      createTag: jest.fn(),
      updateTag: jest.fn(),
      deleteTag: jest.fn(),
    } as unknown as jest.Mocked<TagsService>;

    resolver = new TagsResolver(service);
  });

  it('tags는 전체 태그 목록을 반환한다', async () => {
    const tags = [createTag()];
    service.getTags.mockResolvedValue(tags);

    await expect(resolver.tags()).resolves.toBe(tags);
    expect(service.getTags).toHaveBeenCalledTimes(1);
  });

  it('tag는 ID에 해당하는 태그를 조회한다', async () => {
    const tag = createTag({ id: 'tag-9' });
    service.getTag.mockResolvedValue(tag);

    await expect(resolver.tag('tag-9')).resolves.toBe(tag);
    expect(service.getTag).toHaveBeenCalledWith('tag-9');
  });

  it('createTag는 서비스에 생성을 위임한다', async () => {
    const input: CreateTagInput = {
      name: '가치주',
      color: '#00ff00',
    };
    const tag = createTag({ name: input.name, color: input.color });
    service.createTag.mockResolvedValue(tag);

    await expect(resolver.createTag(input)).resolves.toBe(tag);
    expect(service.createTag).toHaveBeenCalledWith(input);
  });

  it('updateTag는 서비스 업데이트 결과를 반환한다', async () => {
    const input: UpdateTagInput = {
      id: 'tag-1',
      description: '수정된 설명',
    };
    const tag = createTag({ description: input.description });
    service.updateTag.mockResolvedValue(tag);

    await expect(resolver.updateTag(input)).resolves.toBe(tag);
    expect(service.updateTag).toHaveBeenCalledWith(input);
  });

  it('deleteTag는 Boolean 결과를 전달한다', async () => {
    service.deleteTag.mockResolvedValue(true);

    await expect(resolver.deleteTag('tag-1')).resolves.toBe(true);
    expect(service.deleteTag).toHaveBeenCalledWith('tag-1');
  });
});
