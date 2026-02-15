import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { configureApp } from '../src/setup';
import serverlessExpress from '@codegenie/serverless-express';
import { Callback, Context, Handler } from 'aws-lambda';

let server: Handler;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configureApp(app);
  await app.init();

  const expressApp = app.getHttpAdapter().getInstance();
  return serverlessExpress({ app: expressApp });
}

export default async function handler(
  event: any,
  context: Context,
  callback: Callback,
) {
  server = server ?? (await bootstrap());
  return server(event, context, callback);
}

export const config = {
  api: {
    bodyParser: false,
  },
};
