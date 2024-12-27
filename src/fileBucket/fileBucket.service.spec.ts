import { Test, TestingModule } from '@nestjs/testing';
import { FileBucketService } from './fileBucket.service';
import Minio from 'minio';
import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { UploadedImage } from './interface/interfaces';

interface UploadedObjectInfo {
  etag: string;
  versionId: string;
}

describe('FileBucketService', () => {
  let service: FileBucketService;
  let s3Client: jest.Mocked<Minio.Client>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FileBucketService,
        {
          provide: 'MINIO_CLIENT',
          useValue: {
            bucketExists: jest.fn(),
            makeBucket: jest.fn(),
            putObject: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<FileBucketService>(FileBucketService);
    s3Client = module.get('MINIO_CLIENT');
  });

  it('should upload an image successfully', async () => {
    const mockFile = {
      originalname: 'test.png',
      buffer: Buffer.from('test'),
      size: 123,
    } as Express.Multer.File;

    const mockUploadedImage: UploadedImage = {
      url: 'http://localhost:9000/test-bucket/test-uuid.png',
      etag: 'mock-etag',
    };
    s3Client.bucketExists.mockResolvedValue(true);
    s3Client.putObject.mockResolvedValue({
      etag: 'mock-etag',
      versionId: 'mock-version-id',
    } as UploadedObjectInfo);

    const result = await service.uploadImage(mockFile);

    expect(result).toEqual(mockUploadedImage);
    expect(s3Client.bucketExists).toHaveBeenCalledWith('test-bucket');
    expect(s3Client.putObject).toHaveBeenCalledWith(
      'test-bucket',
      expect.stringContaining('.png'),
      mockFile.buffer,
      mockFile.size,
    );
  });

  it('should throw BadRequestException if upload fails', async () => {
    const mockFile = {
      originalname: 'test.png',
      buffer: Buffer.from('test'),
      size: 123,
    } as Express.Multer.File;

    s3Client.bucketExists.mockResolvedValue(true);
    s3Client.putObject.mockRejectedValue(new Error('Upload failed'));

    await expect(service.uploadImage(mockFile)).rejects.toThrow(
      BadRequestException,
    );
  });

  it('should create bucket if it does not exist', async () => {
    const mockFile = {
      originalname: 'test.png',
      buffer: Buffer.from('test'),
      size: 123,
    } as Express.Multer.File;

    s3Client.bucketExists.mockResolvedValue(false);
    s3Client.makeBucket.mockResolvedValue(undefined);
    s3Client.putObject.mockResolvedValue({
      etag: 'mock-etag',
      versionId: 'mock-version-id', // Include the required property
    } as UploadedObjectInfo);

    await service.uploadImage(mockFile);

    expect(s3Client.makeBucket).toHaveBeenCalledWith(
      'test-bucket',
      'test-region',
    );
  });

  it('should throw InternalServerErrorException if bucket check fails', async () => {
    const mockFile = {
      originalname: 'test.png',
      buffer: Buffer.from('test'),
      size: 123,
    } as Express.Multer.File;

    s3Client.bucketExists.mockRejectedValue(new Error('Bucket check failed'));

    await expect(service.uploadImage(mockFile)).rejects.toThrow(
      InternalServerErrorException,
    );
  });
});
