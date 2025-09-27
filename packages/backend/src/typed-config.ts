import { createTypedConfig } from 'nestjs-typed-config';
import * as Joi from 'joi';

// CI 환경(예: 공개 PR)의 경우에는 암호화 키 시크릿이 존재하지 않을 수 있으므로
// 안전한 고정 더미 값을 미리 주입해 검증 단계가 실패하지 않도록 한다.
if (
  !process.env.BROKER_CREDENTIAL_ENCRYPTION_KEY &&
  process.env.CI === 'true'
) {
  process.env.BROKER_CREDENTIAL_ENCRYPTION_KEY =
    'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=';
}

const schema = {
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production', 'staging')
    .default('development'),
  PORT: Joi.number().port().default(3000),
  DATABASE_URL: Joi.string().min(1).default('file:./prisma/dev.db'),
  JWT_SECRET: Joi.string().min(1).default('local-dev-secret'),
  BROKER_CREDENTIAL_ENCRYPTION_KEY: Joi.string().min(1).required(),
} satisfies Joi.SchemaMap;

const { TypedConfigService: TypedConfigServiceClass, TypedConfigModule } =
  createTypedConfig(schema);

export { TypedConfigModule };

export const TypedConfigService = TypedConfigServiceClass;
export type TypedConfigService = InstanceType<typeof TypedConfigServiceClass>;
