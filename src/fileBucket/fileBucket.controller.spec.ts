import { Test, TestingModule } from '@nestjs/testing';
import { FileBucketController } from './fileBucket.controller';
import { FileBucketService } from './fileBucket.service';
import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

jest.mock('@nestjs/config'); // Mock the entire ConfigService module

describe('FileBucketController', () => {
    let controller: FileBucketController;
    let service: FileBucketService;

    beforeEach(async () => {
        // Set up ConfigService mock
        (ConfigService as jest.Mock).mockImplementation(() => ({
            getOrThrow: jest.fn((key) => {
                if (key === 'S3_REGION') return 'us-east-1';
                throw new Error(`Configuration key "${key}" does not exist`);
            }),
        }));

        const module: TestingModule = await Test.createTestingModule({
            controllers: [FileBucketController],
            providers: [
                {
                    provide: FileBucketService,
                    useValue: {
                        uploadImage: jest.fn(),
                    },
                },
            ],
        }).compile();

        controller = module.get<FileBucketController>(FileBucketController);
        service = module.get<FileBucketService>(FileBucketService);
    });

    it('should upload an image successfully', async () => {
        const mockFile = {
            originalname: 'test.png',
            buffer: Buffer.from('test'),
            size: 123,
        } as Express.Multer.File;

        jest.spyOn(service, 'uploadImage').mockResolvedValue({
            url: 'http://localhost:9000/image/test.png',
            etag: 'mock-etag',
        });

        const result = await controller.upload(mockFile);

        expect(result).toEqual({
            url: 'http://localhost:9000/image/test.png',
            etag: 'mock-etag',
        });
        expect(service.uploadImage).toHaveBeenCalledWith(mockFile);
    });

    it('should throw BadRequestException if upload fails', async () => {
        const mockFile = {
            originalname: 'test.png',
            buffer: Buffer.from('test'),
            size: 123,
        } as Express.Multer.File;

        jest.spyOn(service, 'uploadImage').mockRejectedValue(new BadRequestException('Upload failed'));

        await expect(controller.upload(mockFile)).rejects.toThrow(BadRequestException);
    });
});