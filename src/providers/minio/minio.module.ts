import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MINIO_TOKEN } from './minio.decorator';
import * as Minio from 'minio';
import ConfigClientConnectS3Minio from './minio-s3';

@Global()
@Module({
  exports: [MINIO_TOKEN],
  providers: [
    {
      inject: [ConfigService],
      provide: MINIO_TOKEN,
      useFactory: async (
        configService: ConfigService,
      ): Promise<Minio.Client> => {
        const client = new Minio.Client(
          ConfigClientConnectS3Minio(configService),
        );
        return client;
      },
    },
  ],
})
export class MinioModule {}
