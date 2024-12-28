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
  private readonly bucketRegion = BUCKET.REGION;

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

    const upload = await this.s3Client.putObject(
      this.bucket,
      fileUploadName,
      file.buffer,
      file.size,
      (error: Error | null, objInfo: { etag: string }) => {
        if (error) {
          return new Error('file not uploaded');
        } else {
          return objInfo;
        }
      },
    );

    if (upload instanceof Error) {
      throw new BadRequestException(upload.message);
    }

    const fileUploaded: UploadedImage = {
      url: `http://localhost:9000/${BUCKET.NAME}/${fileUploadName}`,
      etag: upload.etag,
    };

    return fileUploaded;
  }
}
