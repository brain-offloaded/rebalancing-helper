import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { GraphQLSchemaHost } from '@nestjs/graphql';
import { printSchema } from 'graphql';
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';

async function main() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: false,
  });
  try {
    const { schema } = app.get(GraphQLSchemaHost);
    const sdl = printSchema(schema);
    const outPath = join(process.cwd(), 'schema.graphql');
    writeFileSync(outPath, sdl, 'utf8');
    console.log(`Schema written to ${outPath}`);
  } finally {
    await app.close();
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
