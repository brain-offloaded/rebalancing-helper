import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
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
      where: { name: tag.name },
      update: {
        description: tag.description,
        color: tag.color,
      },
      create: {
        name: tag.name,
        description: tag.description,
        color: tag.color,
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
