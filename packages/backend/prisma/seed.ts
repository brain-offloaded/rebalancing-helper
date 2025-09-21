import { PrismaClient } from '@prisma/client';
import { hashSync } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const demoPasswordHash = hashSync('changeme123', 10);

  const user = await prisma.user.upsert({
    where: { email: 'demo@example.com' },
    update: {},
    create: {
      email: 'demo@example.com',
      passwordHash: demoPasswordHash,
    },
  });

  const defaultTags = [
    {
      name: 'S&P 500',
      description: 'S&P 500 ETFs and related funds',
      color: '#007bff',
    },
    {
      name: 'International',
      description: 'International stock funds',
      color: '#28a745',
    },
    {
      name: 'Bonds',
      description: 'Bond funds and fixed income',
      color: '#ffc107',
    },
  ];

  for (const tag of defaultTags) {
    await prisma.tag.upsert({
      where: {
        userId_name: {
          userId: user.id,
          name: tag.name,
        },
      },
      update: {
        description: tag.description,
        color: tag.color,
      },
      create: {
        name: tag.name,
        description: tag.description,
        color: tag.color,
        userId: user.id,
      },
    });
  }

  const defaultBrokers = [
    {
      code: 'KB_SEC',
      name: 'KB증권',
      description: 'KB증권 표준 API',
      apiBaseUrl: 'https://api.kbsec.com',
    },
    {
      code: 'NH_INV',
      name: 'NH투자증권',
      description: 'NH투자증권 Open API',
      apiBaseUrl: 'https://openapi.nhqv.com',
    },
  ];

  for (const broker of defaultBrokers) {
    await prisma.broker.upsert({
      where: { code: broker.code },
      update: {
        name: broker.name,
        description: broker.description,
        apiBaseUrl: broker.apiBaseUrl,
      },
      create: {
        code: broker.code,
        name: broker.name,
        description: broker.description,
        apiBaseUrl: broker.apiBaseUrl,
      },
    });
  }
}

main()
  .catch(error => {
    console.error('Failed to seed database', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
