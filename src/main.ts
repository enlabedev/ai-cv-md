import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';
import { configureApp } from './setup';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  const app = await NestFactory.create(AppModule);
  /*
  // Legacy code removed
  */
  configureApp(app);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);
  logger.log(`Application is running on: ${await app.getUrl()}`);
}
void bootstrap();
