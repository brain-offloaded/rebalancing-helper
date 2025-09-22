import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from './prisma.service';

describe('PrismaService', () => {
  it('생성자는 ConfigService에서 DATABASE_URL을 조회한다', async () => {
    const get = jest.fn().mockReturnValue('file:./prisma/test.db');
    const service = new PrismaService({
      get: get as ConfigService['get'],
    } as ConfigService);

    expect(get).toHaveBeenCalledWith('DATABASE_URL');

    await service.$disconnect();
  });

  const createService = () =>
    Object.create(PrismaService.prototype) as PrismaService & {
      $connect: jest.Mock;
      $disconnect: jest.Mock;
    };

  it('onModuleInit는 Prisma 연결을 초기화한다', async () => {
    const service = createService();
    service.$connect = jest.fn();

    await service.onModuleInit();

    expect(service.$connect).toHaveBeenCalledTimes(1);
  });

  it('onModuleDestroy는 Prisma 연결을 종료한다', async () => {
    const service = createService();
    service.$disconnect = jest.fn();

    await service.onModuleDestroy();

    expect(service.$disconnect).toHaveBeenCalledTimes(1);
  });

  it('enableShutdownHooks는 beforeExit에서 앱을 종료한다', () => {
    const service = createService();
    const close = jest.fn();
    const app = { close } as unknown as INestApplication;
    const listeners: Record<string, NodeJS.BeforeExitListener> = {};
    const processOnSpy = jest
      .spyOn(process, 'on')
      .mockImplementation(<T extends string | symbol>(event: T, listener: any) => {
        listeners[event as string] = listener;
        return process;
      });

    service.enableShutdownHooks(app);

    expect(processOnSpy).toHaveBeenCalledWith('beforeExit', expect.any(Function));

    const beforeExit = listeners['beforeExit'];
    expect(beforeExit).toBeDefined();
    beforeExit?.(0);

    expect(close).toHaveBeenCalledTimes(1);

    processOnSpy.mockRestore();
  });
});
