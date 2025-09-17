jest.mock('@prisma/client', () => {
  const actual = jest.requireActual('@prisma/client');
  class PrismaClientMock {
    public readonly options: unknown;
    public $connect = jest.fn();
    public $disconnect = jest.fn();
    public $on = jest.fn();

    constructor(options?: unknown) {
      this.options = options;
    }
  }

  return {
    ...actual,
    PrismaClient: PrismaClientMock,
  };
});

import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  const createConfigService = (databaseUrl?: string) => {
    const get = jest.fn().mockImplementation((key: string) => {
      if (key === 'DATABASE_URL') {
        return databaseUrl;
      }
      return undefined;
    });
    return { get } as unknown as ConfigService;
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('DATABASE_URL 환경 변수를 활용해 Prisma 클라이언트를 초기화한다', () => {
    const get = jest.fn().mockReturnValue('postgres://example');
    const config = { get } as unknown as ConfigService;

    const service = new PrismaService(config);
    const internal = service as unknown as { options: unknown };

    expect(get).toHaveBeenCalledWith('DATABASE_URL');
    expect(internal.options).toEqual({
      datasources: {
        db: {
          url: 'postgres://example',
        },
      },
    });
  });

  it('DATABASE_URL이 없으면 로컬 파일 데이터베이스를 사용한다', () => {
    const config = createConfigService(undefined);

    const service = new PrismaService(config);
    const internal = service as unknown as { options: unknown };

    expect(internal.options).toEqual({
      datasources: {
        db: {
          url: 'file:./prisma/dev.db',
        },
      },
    });
  });

  it('onModuleInit은 Prisma 연결을 수립한다', async () => {
    const config = createConfigService('postgres://example');

    const service = new PrismaService(config);
    const internal = service as unknown as { $connect: jest.Mock };

    await service.onModuleInit();

    expect(internal.$connect).toHaveBeenCalledTimes(1);
  });

  it('onModuleDestroy는 Prisma 연결을 종료한다', async () => {
    const config = createConfigService('postgres://example');

    const service = new PrismaService(config);
    const internal = service as unknown as { $disconnect: jest.Mock };

    await service.onModuleDestroy();

    expect(internal.$disconnect).toHaveBeenCalledTimes(1);
  });

  it('enableShutdownHooks는 beforeExit 훅을 등록하고 앱을 종료한다', () => {
    const config = createConfigService('postgres://example');

    const service = new PrismaService(config);
    const internal = service as unknown as { $on: jest.Mock };
    const app = { close: jest.fn().mockResolvedValue(undefined) } as unknown as INestApplication;

    service.enableShutdownHooks(app);

    expect(internal.$on).toHaveBeenCalledWith('beforeExit', expect.any(Function));
    const handler = internal.$on.mock.calls[0][1] as () => void;
    handler();

    expect(app.close).toHaveBeenCalledTimes(1);
  });
});
