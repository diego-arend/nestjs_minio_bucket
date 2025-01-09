import { ConfigService } from '@nestjs/config';
import ConfigClientConnectS3Minio from './minio-s3';

describe('ConfigClientConnectS3Minio', () => {
  let configService: ConfigService;

  beforeEach(() => {
    configService = new ConfigService();
    jest.spyOn(configService, 'getOrThrow').mockImplementation((key) => {
      switch (key) {
        case 'ENV':
          return 'development';
        case 'S3_ENDPOINT':
          return 'localhost';
        case 'S3_ACCESS_KEY':
          return 'minio-access-key';
        case 'S3_SECRET_KEY':
          return 'minio-secret-key';
        case 'S3_REGION':
          return 'us-east-1';
        default:
          return '';
      }
    });
  });

  it('should return Minio config for development environment', () => {
    const config = ConfigClientConnectS3Minio(configService);

    expect(config).toEqual({
      endPoint: 'localhost',
      port: 9000,
      useSSL: false,
      accessKey: 'minio-access-key',
      secretKey: 'minio-secret-key',
    });
  });
});
