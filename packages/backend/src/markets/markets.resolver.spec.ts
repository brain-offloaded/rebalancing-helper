import { Test } from '@nestjs/testing';
import { MarketsResolver } from './markets.resolver';
import { MarketsService } from './markets.service';

describe('MarketsResolver', () => {
  let resolver: MarketsResolver;
  let service: { list: jest.Mock };

  beforeEach(async () => {
    service = { list: jest.fn() };
    const moduleRef = await Test.createTestingModule({
      providers: [
        MarketsResolver,
        { provide: MarketsService, useValue: service },
      ],
    }).compile();

    resolver = moduleRef.get(MarketsResolver);
  });

  it('markets 쿼리는 서비스의 리스트를 반환한다', async () => {
    const markets = [
      { id: 'market-1', name: 'KRX', description: 'Korea Exchange' },
    ];
    service.list.mockResolvedValue(markets);

    await expect(resolver.markets()).resolves.toBe(markets);
    expect(service.list).toHaveBeenCalledTimes(1);
  });
});
