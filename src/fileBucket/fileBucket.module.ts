import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MinioModule } from 'src/providers/minio/minio.module';
import { FileBucketService } from './fileBucket.service';
import { FileBucketController } from './fileBucket.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MinioModule,
  ],
  controllers: [FileBucketController],
  providers: [FileBucketService],
})
export class FileBucketModule {}
