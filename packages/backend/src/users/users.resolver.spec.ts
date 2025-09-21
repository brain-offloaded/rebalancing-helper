import { UsersResolver } from './users.resolver';
import { UsersService } from './users.service';
import { ActiveUserData } from '../auth/auth.types';
import { NotFoundException } from '@nestjs/common';

describe('UsersResolver', () => {
  let resolver: UsersResolver;
  let service: jest.Mocked<UsersService>;
  const user: ActiveUserData = { userId: 'user-1', email: 'demo@example.com' };

  beforeEach(() => {
    service = {
      findById: jest.fn(),
    } as unknown as jest.Mocked<UsersService>;

    resolver = new UsersResolver(service);
  });

  it('me는 현재 사용자 정보를 반환한다', async () => {
    const record = {
      id: user.userId,
      email: user.email,
      passwordHash: 'hashed',
      createdAt: new Date('2024-01-01T00:00:00Z'),
      updatedAt: new Date('2024-01-01T00:00:00Z'),
    };
    service.findById.mockResolvedValue(record);

    await expect(resolver.me(user)).resolves.toBe(record);
    expect(service.findById).toHaveBeenCalledWith(user.userId);
  });

  it('사용자를 찾지 못하면 NotFoundException을 던진다', async () => {
    service.findById.mockResolvedValue(null);

    await expect(resolver.me(user)).rejects.toThrow(NotFoundException);
  });
});
