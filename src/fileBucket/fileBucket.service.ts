import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import * as Minio from 'minio';
import { randomUUID } from 'crypto';
import { ErrorHandler } from '@nestjs/common/interfaces';
import { UploadedImage } from './interface/interfaces';
import { BUCKET } from './configs/configConstants';
import { InjectMinio } from '../providers/minio/minio.decorator';

@Injectable()
export class FileBucketService {
  private readonly bucket = BUCKET.NAME;
  private readonly bucketRegion = BUCKET.REGION();

  constructor(@InjectMinio() private readonly s3Client: Minio.Client) {}

  async bucketExists(bucketName: string): Promise<boolean | ErrorHandler> {
    try {
      return await this.s3Client.bucketExists(bucketName);
    } catch (err) {
      if (err) {
        throw new InternalServerErrorException('Bucket server error');
      }
      throw new InternalServerErrorException('Bucket server error');
    }
  }

  async makeBucket(
    bucketName: string,
    bucketRegion: string,
  ): Promise<void | ErrorHandler> {
    try {
      await this.s3Client.makeBucket(bucketName, bucketRegion);
    } catch (err) {
      if (err) {
        throw new InternalServerErrorException('Bucket server error');
      }
      throw new InternalServerErrorException('Bucket server error');
    }
  }

  async uploadImage(
    file: Express.Multer.File,
  ): Promise<UploadedImage | ErrorHandler> {
    const fileUploadName = `${randomUUID().toString()}.${file.originalname}`;

    if (!(await this.bucketExists(this.bucket))) {
      await this.makeBucket(this.bucket, this.bucketRegion);
    }

    try {
      const upload = await this.s3Client.putObject(
        this.bucket,
        fileUploadName,
        file.buffer,
        file.size,
      );

      return {
        url: `http://localhost:9000/${BUCKET.NAME}/${fileUploadName}`,
        etag: upload.etag,
      };
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestException('File not uploaded');
      }
      throw new BadRequestException('File not uploaded');
    }
  }

  async deleteImage(fileName: string): Promise<void> {
    try {
      // Check if the bucket exists
      if (!(await this.bucketExists(this.bucket))) {
        throw new BadRequestException('Bucket does not exist');
      }

      // Delete the file from the bucket
      await this.s3Client.removeObject(this.bucket, fileName);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error; // Re-throw BadRequestException
      }
      throw new InternalServerErrorException('Failed to delete file');
    }
  }
}
