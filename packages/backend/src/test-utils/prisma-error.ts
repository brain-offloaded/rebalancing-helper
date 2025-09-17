import { Prisma } from '@prisma/client';

type KnownErrorConstructor = new (
  message: string,
  options: { code: string; clientVersion: string },
) => Prisma.PrismaClientKnownRequestError;

let cachedConstructor: KnownErrorConstructor | null = null;

const ensureConstructor = (): KnownErrorConstructor => {
  if (cachedConstructor) {
    return cachedConstructor;
  }

  const prismaNamespace = Prisma as unknown as {
    PrismaClientKnownRequestError?: KnownErrorConstructor;
  };

  if (typeof prismaNamespace.PrismaClientKnownRequestError === 'function') {
    cachedConstructor = prismaNamespace.PrismaClientKnownRequestError;
    return cachedConstructor;
  }

  class PrismaClientKnownRequestErrorShim extends Error {
    code: string;
    clientVersion: string;

    constructor(
      message: string,
      options: { code: string; clientVersion: string },
    ) {
      super(message);
      this.code = options.code;
      this.clientVersion = options.clientVersion;
      Object.setPrototypeOf(this, new.target.prototype);
    }
  }

  prismaNamespace.PrismaClientKnownRequestError =
    PrismaClientKnownRequestErrorShim as unknown as KnownErrorConstructor;
  cachedConstructor = prismaNamespace.PrismaClientKnownRequestError;
  return cachedConstructor;
};

export const createPrismaKnownRequestError = (
  code: string,
): Prisma.PrismaClientKnownRequestError => {
  const ctor = ensureConstructor();
  return new ctor('Prisma error', { code, clientVersion: 'test' });
};
