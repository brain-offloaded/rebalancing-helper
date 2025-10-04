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
    {
      code: 'SAMSUNG_SEC',
      name: '삼성증권',
      description: '삼성증권 Open API',
      apiBaseUrl: 'https://api.samsungsec.com',
    },
    {
      code: 'NH_BANK',
      name: 'NH농협은행',
      description: 'NH농협은행 오픈 API',
      apiBaseUrl: 'https://openapi.nonghyup.com',
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

  const defaultMarkets = [
    {
      code: 'US',
      displayName: '미국',
      yahooSuffix: null,
      yahooMarketIdentifiers: 'us_market',
    },
    {
      code: 'NYSE',
      displayName: '뉴욕 증권거래소',
      yahooSuffix: null,
      yahooMarketIdentifiers: 'us_market',
    },
    {
      code: 'NASDAQ',
      displayName: '나스닥',
      yahooSuffix: null,
      yahooMarketIdentifiers: 'us_market',
    },
    {
      code: 'AMEX',
      displayName: '아멕스',
      yahooSuffix: null,
      yahooMarketIdentifiers: 'us_market',
    },
    {
      code: 'KOSPI',
      displayName: '코스피',
      yahooSuffix: '.KS',
      yahooMarketIdentifiers: 'kr_market',
    },
    {
      code: 'KOSDAQ',
      displayName: '코스닥',
      yahooSuffix: '.KQ',
      yahooMarketIdentifiers: 'kr_market',
    },
  ];

  for (const market of defaultMarkets) {
    await prisma.market.upsert({
      where: { code: market.code },
      update: {
        displayName: market.displayName,
        yahooSuffix: market.yahooSuffix,
        yahooMarketIdentifiers: market.yahooMarketIdentifiers,
      },
      create: {
        code: market.code,
        displayName: market.displayName,
        yahooSuffix: market.yahooSuffix,
        yahooMarketIdentifiers: market.yahooMarketIdentifiers,
      },
    });
  }

  const defaultSecurities = [
    {
      market: 'US',
      symbol: 'VOO',
      name: 'Vanguard S&P 500 ETF',
      currency: 'USD',
      currentPrice: 412.35,
    },
    {
      market: 'US',
      symbol: 'SPY',
      name: 'SPDR S&P 500 ETF Trust',
      currency: 'USD',
      currentPrice: 430.4,
    },
    {
      market: 'US',
      symbol: 'QQQ',
      name: 'Invesco QQQ Trust',
      currency: 'USD',
      currentPrice: 360.1,
    },
    {
      market: 'KOSDAQ',
      symbol: '035720',
      name: 'Kakao Corp',
      currency: 'KRW',
      currentPrice: 51000,
    },
  ];

  for (const security of defaultSecurities) {
    await prisma.marketSecurity.upsert({
      where: {
        market_symbol: {
          market: security.market,
          symbol: security.symbol,
        },
      },
      update: {
        name: security.name,
        currency: security.currency,
        currentPrice: security.currentPrice,
      },
      create: {
        market: security.market,
        symbol: security.symbol,
        name: security.name,
        currency: security.currency,
        currentPrice: security.currentPrice,
      },
    });
  }
}

main()
  .catch((error) => {
    console.error('Failed to seed database', error);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
