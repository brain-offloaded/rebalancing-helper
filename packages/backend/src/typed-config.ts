import { createTypedConfig } from 'nestjs-typed-config';
import * as Joi from 'joi';

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
