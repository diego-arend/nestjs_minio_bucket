import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MinioModule } from '../providers/minio/minio.module';
import { FileBucketService } from './fileBucket.service';
import { FileBucketController } from './fileBucket.controller';
import { initializeConfig } from './configs/configConstants';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    MinioModule,
  ],
  controllers: [FileBucketController],
  providers: [
    FileBucketService,
    {
      provide: 'CONFIG_INIT',
      useFactory: (config: ConfigService) => {
        initializeConfig(config);
        return true;
      },
      inject: [ConfigService],
    },
  ],
})
export class FileBucketModule {}
