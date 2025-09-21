import { NestFactory } from '@nestjs/core';
import { bootstrap } from './main';
import { PrismaService } from './prisma/prisma.service';

jest.mock('@nestjs/core', () => ({
  NestFactory: {
    create: jest.fn(),
  },
}));

describe('bootstrap', () => {
  const enableCors = jest.fn();
  const listen = jest.fn().mockResolvedValue(undefined);
  const get = jest.fn();
  const enableShutdownHooks = jest.fn();

  beforeEach(() => {
    enableCors.mockClear();
    listen.mockClear();
    get.mockReset().mockReturnValue({ enableShutdownHooks });
    enableShutdownHooks.mockClear();

    (NestFactory.create as jest.Mock).mockResolvedValue({
      enableCors,
      listen,
      get,
    });
  });

  it('Nest 앱을 생성하고 CORS 및 Prisma 종료 훅을 설정한다', async () => {
    await bootstrap();

    expect(NestFactory.create).toHaveBeenCalled();
    expect(enableCors).toHaveBeenCalledWith({
      origin: ['http://localhost:5173'],
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization'],
      methods: ['GET', 'POST', 'OPTIONS'],
    });
    expect(get).toHaveBeenCalledWith(PrismaService);
    expect(enableShutdownHooks).toHaveBeenCalledWith({
      enableCors,
      listen,
      get,
    });
    expect(listen).toHaveBeenCalledWith(3000);
  });

  it('PORT 환경변수가 있으면 해당 포트로 리슨한다', async () => {
    process.env.PORT = '4000';

    await bootstrap();

    expect(listen).toHaveBeenCalledWith('4000');

    delete process.env.PORT;
  });
});
