import { ConfigService } from '@nestjs/config';

function ConfigClientConnectS3Minio(configService: ConfigService) {
  if (configService.getOrThrow('ENV') === 'development') {
    // Check if environment is development and config service for MINIO Container
    return {
      endPoint: configService.getOrThrow('S3_ENDPOINT'),
      port: 9000,
      useSSL: false,
      accessKey: configService.getOrThrow('S3_ACCESS_KEY'),
      secretKey: configService.getOrThrow('S3_SECRET_KEY'),
    };
  }
  // Environment is production and config service for AWS-S3
  return {
    endPoint: configService.getOrThrow('S3_ENDPOINT'),
    accessKey: configService.getOrThrow('S3_ACCESS_KEY'),
    secretKey: configService.getOrThrow('S3_SECRET_KEY'),
  };
}

export default ConfigClientConnectS3Minio;
