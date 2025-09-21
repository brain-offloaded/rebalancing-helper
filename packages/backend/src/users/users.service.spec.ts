import { UsersService } from './users.service';
import { PrismaService } from '../prisma/prisma.service';

describe('UsersService', () => {
  let service: UsersService;
  let prismaMock: {
    user: {
      create: jest.Mock;
      findUnique: jest.Mock;
    };
  };

  beforeEach(() => {
    prismaMock = {
      user: {
        create: jest.fn(),
        findUnique: jest.fn(),
      },
    };

    service = new UsersService(prismaMock as unknown as PrismaService);
  });

  it('create는 전달된 데이터를 Prisma에 위임한다', async () => {
    prismaMock.user.create.mockResolvedValue({ id: 'user-1' });

    await service.create({ email: 'demo@example.com', passwordHash: 'hash' });

    expect(prismaMock.user.create).toHaveBeenCalledWith({
      data: {
        email: 'demo@example.com',
        passwordHash: 'hash',
      },
    });
  });

  it('findByEmail은 이메일로 단일 사용자 를 조회한다', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    await service.findByEmail('demo@example.com');

    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'demo@example.com' },
    });
  });

  it('findById는 ID 기준으로 조회한다', async () => {
    prismaMock.user.findUnique.mockResolvedValue(null);

    await service.findById('user-1');

    expect(prismaMock.user.findUnique).toHaveBeenCalledWith({
      where: { id: 'user-1' },
    });
  });
});
