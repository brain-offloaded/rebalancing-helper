import { JwtStrategy } from './jwt.strategy';
import { AuthService } from './auth.service';
import { TypedConfigService } from '../typed-config';

describe('JwtStrategy', () => {
  let strategy: JwtStrategy;
  let authService: jest.Mocked<AuthService>;

  beforeEach(() => {
    const configService = {
      get: jest.fn().mockReturnValue('secret'),
    } as unknown as TypedConfigService;

    authService = {
      getActiveUserData: jest.fn(),
    } as unknown as jest.Mocked<AuthService>;

    strategy = new JwtStrategy(configService, authService);
  });

  it('validate는 AuthService.getActiveUserData를 호출한다', async () => {
    const payload = { sub: 'user-1', email: 'demo@example.com' };
    const activeUser = { userId: 'user-1', email: 'demo@example.com' };
    authService.getActiveUserData.mockResolvedValue(activeUser);

    await expect(strategy.validate(payload)).resolves.toBe(activeUser);
    expect(authService.getActiveUserData).toHaveBeenCalledWith('user-1');
  });
});
