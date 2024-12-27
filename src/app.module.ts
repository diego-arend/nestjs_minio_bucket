import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { FileBucketModule } from './fileBucket/fileBucket.module';

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), FileBucketModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
