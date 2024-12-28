import { Test, TestingModule } from '@nestjs/testing';
import { FileBucketService } from './fileBucket.service';
import { MINIO_TOKEN } from '../providers/minio/minio.decorator';
import * as Minio from 'minio';
import { BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

// Mock the ConfigService module
jest.mock('@nestjs/config');

describe('FileBucketService', () => {
  let service: FileBucketService;
  let s3Client: jest.Mocked<Minio.Client>;

  beforeEach(async () => {
    // Set up ConfigService mock
    (ConfigService as jest.Mock).mockImplementation(() => ({
      getOrThrow: jest.fn((key) => {
        if (key === 'S3_REGION') return 'us-east-1';
        throw new Error(`Configuration key "${key}" does not exist`);
      }),
    }));

    const mockedMinioClient = {
      bucketExists: jest.fn(),
      makeBucket: jest.fn(),
      putObject: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FileBucketService,
        {
          provide: MINIO_TOKEN,
          useValue: mockedMinioClient,
        },
      ],
    }).compile();

    service = module.get<FileBucketService>(FileBucketService);
    s3Client = module.get(MINIO_TOKEN) as jest.Mocked<Minio.Client>;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should upload an image successfully', async () => {
    const mockFile = {
      originalname: 'test.png',
      buffer: Buffer.from('test'),
      size: 123,
    } as Express.Multer.File;
  
    s3Client.bucketExists.mockResolvedValue(true);
    s3Client.putObject.mockImplementation((bucket, name, buffer, size) => {
      return Promise.resolve({
        etag: 'mock-etag',
        versionId: 'mock-version-id',
      });
    });
  
    const result = await service.uploadImage(mockFile);
  
    expect(result).toEqual({
      url: expect.stringMatching(/^http:\/\/localhost:9000\/image\/.+\.test\.png$/),
      etag: 'mock-etag',
    });
  });

  it('should throw BadRequestException if upload fails', async () => {
    const mockFile = {
      originalname: 'test.png',
      buffer: Buffer.from('test'),
      size: 123,
    } as Express.Multer.File;

    s3Client.bucketExists.mockResolvedValue(true);
    s3Client.putObject.mockRejectedValue(new BadRequestException('Upload failed'));

    await expect(service.uploadImage(mockFile)).rejects.toThrow(BadRequestException);
  });

  it('should throw InternalServerErrorException if bucket check fails', async () => {
    const mockFile = {
      originalname: 'test.png',
      buffer: Buffer.from('test'),
      size: 123,
    } as Express.Multer.File;

    s3Client.bucketExists.mockRejectedValue(new Error('Bucket check failed'));

    await expect(service.uploadImage(mockFile)).rejects.toThrow(InternalServerErrorException);
  });
});