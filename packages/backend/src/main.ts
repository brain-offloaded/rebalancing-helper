import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PrismaService } from './prisma/prisma.service';
import { TypedConfigService } from './typed-config';

export async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  app.enableCors({
    origin: ['http://localhost:5173'],
    credentials: true,
    allowedHeaders: ['Content-Type', 'Authorization'],
    methods: ['GET', 'POST', 'OPTIONS'],
  });
  const prismaService = app.get(PrismaService);
  prismaService.enableShutdownHooks(app);
  const configService = app.get(TypedConfigService);
  const port = configService.get('PORT');
  await app.listen(port);
}
if (process.env.NODE_ENV !== 'test') {
  void bootstrap();
}
