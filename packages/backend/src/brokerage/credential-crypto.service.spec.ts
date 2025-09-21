import { ConfigService } from '@nestjs/config';
import { CredentialCryptoService, EncryptedPayload } from './credential-crypto.service';

const BASE64_KEY = Buffer.alloc(32, 1).toString('base64');
const HEX_KEY = Buffer.alloc(32, 2).toString('hex');

describe('CredentialCryptoService', () => {
  const createService = (key: string | undefined) =>
    new CredentialCryptoService({
      get: jest.fn().mockReturnValue(key),
    } as unknown as ConfigService);

  it('encrypt와 decrypt가 원문을 보존한다', () => {
    const service = createService(BASE64_KEY);
    const plaintext = 'broker-secret-token';

    const encrypted = service.encrypt(plaintext);
    expect(encrypted.cipher).toBeDefined();

    const decrypted = service.decrypt(encrypted);
    expect(decrypted).toBe(plaintext);
  });

  it('매 호출마다 다른 IV를 생성한다', () => {
    const service = createService(BASE64_KEY);

    const first = service.encrypt('value-1');
    const second = service.encrypt('value-1');

    expect(first.iv).not.toBe(second.iv);
  });

  it('복호화 시 인증 태그가 변조되면 에러를 던진다', () => {
    const service = createService(BASE64_KEY);
    const encrypted = service.encrypt('secure-value');
    const tampered: EncryptedPayload = {
      ...encrypted,
      authTag: Buffer.alloc(16, 3).toString('base64'),
    };

    expect(() => service.decrypt(tampered)).toThrow();
  });

  it('16진수 키도 허용한다', () => {
    const service = createService(HEX_KEY);

    const encrypted = service.encrypt('hex-key-value');
    expect(service.decrypt(encrypted)).toBe('hex-key-value');
  });

  it('키가 누락되면 에러를 던진다', () => {
    expect(() => createService(undefined)).toThrow(
      'BROKER_CREDENTIAL_ENCRYPTION_KEY must be configured for credential encryption.',
    );
  });

  it('키 길이가 32바이트가 아니면 에러를 던진다', () => {
    const shortKey = Buffer.alloc(8).toString('base64');

    expect(() => createService(shortKey)).toThrow(
      'BROKER_CREDENTIAL_ENCRYPTION_KEY must decode to 32 bytes.',
    );
  });

  it('지원되지 않는 키 포맷이면 에러를 던진다', () => {
    const spy = jest
      .spyOn(Buffer, 'from')
      .mockImplementation(() => {
        throw new Error('invalid base64');
      });

    try {
      expect(() => createService('@@@')).toThrow(
        'BROKER_CREDENTIAL_ENCRYPTION_KEY must be a 32-byte key encoded in hex or base64.',
      );
    } finally {
      spy.mockRestore();
    }
  });
});
