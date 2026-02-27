import { NestFactory } from '@nestjs/core';
import { bootstrap } from './main';
import { PrismaService } from './prisma/prisma.service';
import { TypedConfigService } from './typed-config';

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
  const configGet = jest.fn();
  const typedConfigService = {
    get: configGet,
  } as unknown as TypedConfigService;

  beforeEach(() => {
    enableCors.mockClear();
    listen.mockClear();
    configGet.mockReset().mockImplementation((key: string) => {
      if (key === 'PORT') {
        return 3000;
      }

      if (key === 'CORS_ORIGIN') {
        return 'http://localhost:5173';
      }

      return undefined;
    });
    get.mockReset().mockImplementation((token: unknown) => {
      if (token === PrismaService) {
        return { enableShutdownHooks };
      }
      if (token === TypedConfigService) {
        return typedConfigService;
      }
      return undefined;
    });
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
    expect(get).toHaveBeenCalledWith(TypedConfigService);
    expect(enableShutdownHooks).toHaveBeenCalledWith({
      enableCors,
      listen,
      get,
    });
    expect(listen).toHaveBeenCalledWith(3000);
  });

  it('PORT 환경변수가 있으면 해당 포트로 리슨한다', async () => {
    configGet.mockImplementation((key: string) =>
      key === 'PORT' ? 4000 : 'http://localhost:5173',
    );
    await bootstrap();

    expect(listen).toHaveBeenCalledWith(4000);
  });

  it('CORS_ORIGIN 환경변수가 있으면 해당 origin을 허용한다', async () => {
    configGet.mockImplementation((key: string) =>
      key === 'CORS_ORIGIN' ? 'http://localhost:5174' : 3000,
    );
    await bootstrap();

    expect(enableCors).toHaveBeenCalledWith({
      origin: ['http://localhost:5174'],
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization'],
      methods: ['GET', 'POST', 'OPTIONS'],
    });
  });
});
