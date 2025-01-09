import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';
import { ConfigService } from '@nestjs/config';

describe('AppController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    const mockConfigService = {
      getOrThrow: jest.fn((key) => {
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
      }),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ConfigService)
      .useValue(mockConfigService)
      .compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  it('/ (GET)', () => {
    return request(app.getHttpServer())
      .get('/')
      .expect(200)
      .expect('Hello World!');
  });
});
