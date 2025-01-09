import { Test, TestingModule } from '@nestjs/testing';
import { FileBucketService } from './fileBucket.service';
import { MINIO_TOKEN } from '../providers/minio/minio.decorator';
import * as Minio from 'minio';
import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { initializeConfig } from './configs/configConstants';
import { UploadedImage } from './interface/interfaces';

describe('FileBucketService', () => {
  let service: FileBucketService;
  let s3Client: jest.Mocked<Minio.Client>;
  let configService: ConfigService;

  beforeEach(async () => {
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

    initializeConfig(configService);

    s3Client = {
      putObject: jest.fn(),
      bucketExists: jest.fn(),
      makeBucket: jest.fn(),
      removeObject: jest.fn(),
    } as unknown as jest.Mocked<Minio.Client>;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FileBucketService,
        {
          provide: MINIO_TOKEN,
          useValue: s3Client,
        },
        {
          provide: ConfigService,
          useValue: configService,
        },
      ],
    }).compile();

    service = module.get<FileBucketService>(FileBucketService);
  });

  it('should upload an image successfully', async () => {
    const mockFile = {
      originalname: 'test.jpg',
      buffer: Buffer.from('test'),
      mimetype: 'image/jpeg',
      size: 4,
    } as Express.Multer.File;

    s3Client.bucketExists.mockResolvedValue(true);
    s3Client.putObject.mockResolvedValue({ etag: 'test-etag' } as any);

    const result = (await service.uploadImage(mockFile)) as UploadedImage;
    expect(result).toBeDefined();
    expect(result.url).toBeDefined();
    expect(result.etag).toBe('test-etag');
  });

  it('should throw BadRequestException if upload fails', async () => {
    const mockFile = {
      originalname: 'test.jpg',
      buffer: Buffer.from('test'),
      mimetype: 'image/jpeg',
      size: 4,
    } as Express.Multer.File;

    s3Client.bucketExists.mockResolvedValue(true);
    s3Client.putObject.mockRejectedValue(new Error('Upload failed'));

    await expect(service.uploadImage(mockFile)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should throw InternalServerErrorException if bucket check fails', async () => {
    const mockFile = {
      originalname: 'test.jpg',
      buffer: Buffer.from('test'),
      mimetype: 'image/jpeg',
    } as Express.Multer.File;

    s3Client.bucketExists.mockRejectedValue(new Error('Bucket check failed'));

    await expect(service.uploadImage(mockFile)).rejects.toThrow(
      InternalServerErrorException,
    );
  });

  it('should throw BadRequestException if the file upload fails', async () => {
    const mockFile = {
      originalname: 'test.jpg',
      buffer: Buffer.from('test'),
      mimetype: 'image/jpeg',
    } as Express.Multer.File;

    s3Client.bucketExists.mockResolvedValue(true);
    s3Client.putObject.mockRejectedValue(new Error('Upload failed'));

    await expect(service.uploadImage(mockFile)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should successfully create a bucket', async () => {
    const bucketName = 'test-bucket';
    const bucketRegion = 'us-east-1';

    s3Client.makeBucket.mockResolvedValue();

    await expect(
      service.makeBucket(bucketName, bucketRegion),
    ).resolves.not.toThrow();
  });

  it('should throw InternalServerErrorException if makeBucket fails', async () => {
    const bucketName = 'test-bucket';
    const bucketRegion = 'us-east-1';

    s3Client.makeBucket.mockRejectedValue(new Error('Failed to create bucket'));

    await expect(service.makeBucket(bucketName, bucketRegion)).rejects.toThrow(
      InternalServerErrorException,
    );
  });

  it('should throw InternalServerErrorException if makeBucket fails with a specific error message', async () => {
    const bucketName = 'test-bucket';
    const bucketRegion = 'us-east-1';

    s3Client.makeBucket.mockRejectedValue(new Error('Failed to create bucket'));

    await expect(service.makeBucket(bucketName, bucketRegion)).rejects.toThrow(
      'Bucket server error',
    );
  });

  it('should throw InternalServerErrorException if makeBucket fails with a network error', async () => {
    const bucketName = 'test-bucket';
    const bucketRegion = 'us-east-1';

    s3Client.makeBucket.mockRejectedValue(new Error('Network error'));

    await expect(service.makeBucket(bucketName, bucketRegion)).rejects.toThrow(
      'Bucket server error',
    );
  });

  it('should delete an image successfully', async () => {
    const fileName = 'test-file.jpg';

    s3Client.bucketExists.mockResolvedValue(true);
    s3Client.removeObject.mockResolvedValue();

    await expect(service.deleteImage(fileName)).resolves.not.toThrow();
    expect(s3Client.removeObject).toHaveBeenCalledWith(
      service['bucket'],
      fileName,
    );
  });

  it('should throw BadRequestException if bucket does not exist', async () => {
    const fileName = 'test-file.jpg';

    s3Client.bucketExists.mockResolvedValue(false);

    await expect(service.deleteImage(fileName)).rejects.toThrow(
      BadRequestException,
    );
    expect(s3Client.removeObject).not.toHaveBeenCalled();
  });

  it('should throw InternalServerErrorException if file deletion fails', async () => {
    const fileName = 'test-file.jpg';

    s3Client.bucketExists.mockResolvedValue(true);
    s3Client.removeObject.mockRejectedValue(new Error('Deletion failed'));

    await expect(service.deleteImage(fileName)).rejects.toThrow(
      InternalServerErrorException,
    );
    expect(s3Client.removeObject).toHaveBeenCalledWith(
      service['bucket'],
      fileName,
    );
  });
});
