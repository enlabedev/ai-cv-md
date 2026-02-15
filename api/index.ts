import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/setup';

let app: any;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configureApp(app);
  await app.init();
  return app.getHttpAdapter().getInstance();
}

export default async function handler(req: any, res: any) {
  if (!app) {
    app = await bootstrap();
  }
  return app(req, res);
}

export const config = {
  api: {
    bodyParser: false,
  },
};
