import { ConflictException, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { RegisterInput } from './dto/register.input';
import { LoginInput } from './dto/login.input';
import { User } from '@prisma/client';

jest.mock('bcryptjs', () => ({
  hash: jest.fn(),
  compare: jest.fn(),
}));

const { hash, compare } = jest.requireMock('bcryptjs') as {
  hash: jest.Mock;
  compare: jest.Mock;
};

describe('AuthService', () => {
  let service: AuthService;
  let usersService: jest.Mocked<UsersService>;
  let jwtService: jest.Mocked<JwtService>;

  const baseUser: User = {
    id: 'user-1',
    email: 'demo@example.com',
    passwordHash: 'hashed',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-01T00:00:00Z'),
  };

  beforeEach(() => {
    usersService = {
      findByEmail: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
    } as unknown as jest.Mocked<UsersService>;

    jwtService = {
      sign: jest.fn(),
    } as unknown as jest.Mocked<JwtService>;

    hash.mockReset();
    compare.mockReset();

    service = new AuthService(jwtService, usersService);
  });

  describe('register', () => {
    it('새 사용자를 생성하고 토큰을 반환한다', async () => {
      const input: RegisterInput = {
        email: 'new@example.com',
        password: 'password123',
      };
      usersService.findByEmail.mockResolvedValue(null);
      hash.mockResolvedValue('hashed-password');
      usersService.create.mockResolvedValue({
        ...baseUser,
        email: input.email,
        passwordHash: 'hashed-password',
      });
      jwtService.sign.mockReturnValue('token');

      const result = await service.register(input);

      expect(usersService.findByEmail).toHaveBeenCalledWith(input.email);
      expect(hash).toHaveBeenCalledWith(input.password, 10);
      expect(usersService.create).toHaveBeenCalledWith({
        email: input.email,
        passwordHash: 'hashed-password',
      });
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: baseUser.id,
        email: input.email,
      });
      expect(result).toEqual({
        accessToken: 'token',
        user: {
          ...baseUser,
          email: input.email,
          passwordHash: 'hashed-password',
        },
      });
    });

    it('이미 존재하는 이메일이면 예외를 던진다', async () => {
      usersService.findByEmail.mockResolvedValue(baseUser);

      await expect(
        service.register({ email: baseUser.email, password: 'secret' }),
      ).rejects.toThrow(ConflictException);
      expect(usersService.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const input: LoginInput = {
      email: baseUser.email,
      password: 'password123',
    };

    it('유효한 자격 증명이면 토큰을 반환한다', async () => {
      usersService.findByEmail.mockResolvedValue(baseUser);
      compare.mockResolvedValue(true);
      jwtService.sign.mockReturnValue('token');

      const result = await service.login(input);

      expect(usersService.findByEmail).toHaveBeenCalledWith(input.email);
      expect(compare).toHaveBeenCalledWith(input.password, baseUser.passwordHash);
      expect(result.accessToken).toBe('token');
    });

    it('사용자가 없으면 UnauthorizedException을 던진다', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(service.login(input)).rejects.toThrow(UnauthorizedException);
    });

    it('비밀번호가 일치하지 않으면 UnauthorizedException을 던진다', async () => {
      usersService.findByEmail.mockResolvedValue(baseUser);
      compare.mockResolvedValue(false);

      await expect(service.login(input)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('getActiveUserData', () => {
    it('사용자를 찾으면 ActiveUserData를 반환한다', async () => {
      usersService.findById.mockResolvedValue(baseUser);

      await expect(service.getActiveUserData(baseUser.id)).resolves.toEqual({
        userId: baseUser.id,
        email: baseUser.email,
      });
    });

    it('사용자가 없으면 UnauthorizedException을 던진다', async () => {
      usersService.findById.mockResolvedValue(null);

      await expect(service.getActiveUserData('missing')).rejects.toThrow(
        UnauthorizedException,
      );
    });
  });
});
