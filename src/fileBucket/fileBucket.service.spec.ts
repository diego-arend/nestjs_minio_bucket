import { Test, TestingModule } from '@nestjs/testing';
import { FileBucketService } from './fileBucket.service';
import { Client } from 'minio';

// Mock the Minio Client
const mockMinioClient = {
  bucketExists: jest.fn(),
  makeBucket: jest.fn(),
  putObject: jest.fn(),
};

// Mock the configConstants module
jest.mock('src/configs/configConstants', () => ({
  BUCKET: {
    NAME: 'test-bucket',
    REGION: 'us-east-1',
  },
}));

// Mock the minio.decorator module
jest.mock('src/providers/minio/minio.decorator', () => ({
  InjectMinio: () => jest.fn(),
}));

describe('FileBucketService', () => {
  let service: FileBucketService;
  let s3Client: jest.Mocked<Client>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FileBucketService,
        {
          provide: 'MinioClient',
          useValue: mockMinioClient,
        },
      ],
    }).compile();

    service = module.get<FileBucketService>(FileBucketService);
    s3Client = module.get<Client>('MinioClient') as jest.Mocked<Client>;
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('bucketExists', () => {
    it('should return true if bucket exists', async () => {
      s3Client.bucketExists.mockResolvedValue(true);
    });
  });

  it('should upload an image successfully', async () => {
    const mockFile = {
      originalname: 'test.jpg',
      buffer: Buffer.from('test'),
      size: 1234,
    } as Express.Multer.File;

    s3Client.bucketExists.mockResolvedValue(true);
    s3Client.putObject.mockResolvedValue({
      etag: 'mock-etag',
      versionId: 'mock-version-id',
    });

    const result = await service.uploadImage(mockFile);

    expect(result).toEqual({
      url: 'http://localhost:9000/test-bucket/mock-uuid-test.jpg',
      etag: 'mock-etag',
    });

    expect(s3Client.putObject).toHaveBeenCalledWith(
      'test-bucket',
      expect.stringContaining('mock-uuid-test.jpg'),
      mockFile.buffer,
      mockFile.size,
      expect.any(Function),
    );
  });
});
