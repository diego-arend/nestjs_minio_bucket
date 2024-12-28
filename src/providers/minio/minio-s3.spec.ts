import { ConfigService } from '@nestjs/config';
import ConfigClientConnectS3Minio from './minio-s3';

jest.mock('@nestjs/config', () => ({
  ConfigService: jest.fn().mockImplementation(() => ({
    getOrThrow: (key: string) => {
      switch (key) {
        case 'ENV': return 'development';
        case 'S3_ENDPOINT': return 'localhost';
        case 'S3_ACCESS_KEY': return 'minio-access-key';
        case 'S3_SECRET_KEY': return 'minio-secret-key';
        default: return '';
      }
    }
  }))
}));

describe('ConfigClientConnectS3Minio', () => {
  it('should return Minio config for development environment', () => {
    const config = ConfigClientConnectS3Minio();

    const expectedConfig = {
      endPoint: 'localhost',
      port: 9000,
      useSSL: false,
      accessKey: 'minio-access-key',
      secretKey: 'minio-secret-key',
    };

    expect(config).toEqual(expectedConfig);
  });
});