import { AuthResolver } from './auth.resolver';
import { AuthService } from './auth.service';
import { RegisterInput } from './dto/register.input';
import { LoginInput } from './dto/login.input';
import { AuthPayload } from './entities/auth-payload.entity';

describe('AuthResolver', () => {
  let resolver: AuthResolver;
  let service: jest.Mocked<AuthService>;

  beforeEach(() => {
    service = {
      register: jest.fn(),
      login: jest.fn(),
      getActiveUserData: jest.fn(),
    } as unknown as jest.Mocked<AuthService>;

    resolver = new AuthResolver(service);
  });

  it('register는 AuthService.register를 호출한다', async () => {
    const input: RegisterInput = {
      email: 'demo@example.com',
      password: 'password123',
    };
    const payload: AuthPayload = {
      accessToken: 'token',
      user: {
        id: 'user-1',
        email: 'demo@example.com',
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
      },
    };
    service.register.mockResolvedValue(payload);

    await expect(resolver.register(input)).resolves.toBe(payload);
    expect(service.register).toHaveBeenCalledWith(input);
  });

  it('login은 AuthService.login을 호출한다', async () => {
    const input: LoginInput = {
      email: 'demo@example.com',
      password: 'password123',
    };
    const payload: AuthPayload = {
      accessToken: 'token',
      user: {
        id: 'user-1',
        email: 'demo@example.com',
        createdAt: new Date('2024-01-01T00:00:00Z'),
        updatedAt: new Date('2024-01-01T00:00:00Z'),
      },
    };
    service.login.mockResolvedValue(payload);

    await expect(resolver.login(input)).resolves.toBe(payload);
    expect(service.login).toHaveBeenCalledWith(input);
  });
});
