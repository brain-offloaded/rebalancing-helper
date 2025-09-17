import { BrokerageService } from './brokerage.service';
import { PrismaService } from '../prisma/prisma.service';

describe('BrokerageService', () => {
  let service: BrokerageService;
  let prismaMock: {
    brokerageAccount: {
      update: jest.Mock;
    };
  };

  beforeEach(() => {
    prismaMock = {
      brokerageAccount: {
        update: jest.fn(),
      },
    };

    service = new BrokerageService(prismaMock as unknown as PrismaService);
  });

  it('updateAccount 호출 시 apiKey, apiSecret, description이 undefined이면 Prisma data에 포함되지 않는다', async () => {
    const updatedAccount = { id: 'account-id' };
    prismaMock.brokerageAccount.update.mockResolvedValue(updatedAccount);

    const result = await service.updateAccount({
      id: 'account-id',
      apiKey: undefined,
      apiSecret: undefined,
      description: undefined,
    });

    expect(prismaMock.brokerageAccount.update).toHaveBeenCalledWith({
      where: { id: 'account-id' },
      data: {},
    });
    expect(result).toBe(updatedAccount);
  });

  it('updateAccount 호출 시 apiKey, apiSecret, description이 null이면 Prisma data에 null로 설정된다', async () => {
    const updatedAccount = { id: 'account-id', apiKey: null, apiSecret: null, description: null };
    prismaMock.brokerageAccount.update.mockResolvedValue(updatedAccount);

    const result = await service.updateAccount({
      id: 'account-id',
      apiKey: null as unknown as string,
      apiSecret: null as unknown as string,
      description: null as unknown as string,
    });

    expect(prismaMock.brokerageAccount.update).toHaveBeenCalledWith({
      where: { id: 'account-id' },
      data: {
        apiKey: null,
        apiSecret: null,
        description: null,
      },
    });
    expect(result).toBe(updatedAccount);
  });
});
