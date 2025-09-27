import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto';

import { Injectable } from '@nestjs/common';
import { TypedConfigService } from '../typed-config';

export type EncryptedPayload = {
  cipher: string;
  iv: string;
  authTag: string;
};

const AES_ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 12;

@Injectable()
export class CredentialCryptoService {
  private readonly key: Buffer;

  constructor(private readonly configService: TypedConfigService) {
    const rawKey = this.configService.get('BROKER_CREDENTIAL_ENCRYPTION_KEY');

    if (!rawKey) {
      throw new Error(
        'BROKER_CREDENTIAL_ENCRYPTION_KEY must be configured for credential encryption.',
      );
    }

    this.key = this.normalizeKey(rawKey);
    if (this.key.length !== KEY_LENGTH) {
      throw new Error(
        `BROKER_CREDENTIAL_ENCRYPTION_KEY must decode to ${KEY_LENGTH} bytes.`,
      );
    }
  }

  encrypt(plain: string): EncryptedPayload {
    const iv = randomBytes(IV_LENGTH);
    const cipher = createCipheriv(AES_ALGORITHM, this.key, iv);
    const encrypted = Buffer.concat([
      cipher.update(plain, 'utf8'),
      cipher.final(),
    ]);
    const authTag = cipher.getAuthTag();

    return {
      cipher: encrypted.toString('base64'),
      iv: iv.toString('base64'),
      authTag: authTag.toString('base64'),
    };
  }

  decrypt(payload: EncryptedPayload): string {
    const iv = Buffer.from(payload.iv, 'base64');
    const decipher = createDecipheriv(AES_ALGORITHM, this.key, iv);
    decipher.setAuthTag(Buffer.from(payload.authTag, 'base64'));

    const decrypted = Buffer.concat([
      decipher.update(Buffer.from(payload.cipher, 'base64')),
      decipher.final(),
    ]);

    return decrypted.toString('utf8');
  }

  private normalizeKey(rawKey: string): Buffer {
    const trimmed = rawKey.trim();

    if (/^[0-9a-fA-F]+$/.test(trimmed) && trimmed.length === KEY_LENGTH * 2) {
      return Buffer.from(trimmed, 'hex');
    }

    try {
      return Buffer.from(trimmed, 'base64');
    } catch {
      throw new Error(
        'BROKER_CREDENTIAL_ENCRYPTION_KEY must be a 32-byte key encoded in hex or base64.',
      );
    }
  }
}
