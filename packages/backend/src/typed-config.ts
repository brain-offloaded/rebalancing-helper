import { createTypedConfig } from 'nestjs-typed-config';
import * as Joi from 'joi';

const schema = {
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production', 'staging')
    .default('development'),
  PORT: Joi.number().port().default(3000),
  DATABASE_URL: Joi.string().min(1).default('file:./prisma/dev.db'),
  JWT_SECRET: Joi.string().min(1).default('local-dev-secret'),
  // 테스트 환경(CI 포크 PR 등)에서는 시크릿이 없을 수 있으므로 안전하지만 고정된 더미 키를 기본값으로 제공
  BROKER_CREDENTIAL_ENCRYPTION_KEY: Joi.string()
    .min(1)
    .default(
      process.env.CI === 'true'
        ? 'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA='
        : undefined,
    )
    .required(),
} satisfies Joi.SchemaMap;

const { TypedConfigService: TypedConfigServiceClass, TypedConfigModule } =
  createTypedConfig(schema);

export { TypedConfigModule };

export const TypedConfigService = TypedConfigServiceClass;
export type TypedConfigService = InstanceType<typeof TypedConfigServiceClass>;
