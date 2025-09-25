import { MarketsService } from './markets.service';
import { PrismaService } from '../prisma/prisma.service';

describe('MarketsService', () => {
  let prismaMock: { market: { findMany: jest.Mock } };
  let service: MarketsService;

  beforeEach(() => {
    prismaMock = {
      market: {
        findMany: jest.fn(),
      },
    };

    service = new MarketsService(prismaMock as unknown as PrismaService);
  });

  it('리스트를 조회하고 식별자를 배열로 변환한다', async () => {
    prismaMock.market.findMany.mockResolvedValue([
      {
        id: '1',
        code: 'US',
        displayName: '미국',
        yahooSuffix: null,
        yahooMarketIdentifiers: 'us_market,us_equity',
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-02T00:00:00Z'),
      },
    ]);

    const result = await service.list();

    expect(prismaMock.market.findMany).toHaveBeenCalledWith({
      orderBy: { displayName: 'asc' },
    });
    expect(result).toEqual([
      {
        id: '1',
        code: 'US',
        displayName: '미국',
        yahooSuffix: null,
        yahooMarketIdentifiers: ['us_market', 'us_equity'],
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-02T00:00:00Z'),
      },
    ]);
  });
});
