import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { CvModule } from './cv/cv.module';
import { ConfigModule } from '@nestjs/config';
import { validate } from './config/env.validation';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true, validate }), CvModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
