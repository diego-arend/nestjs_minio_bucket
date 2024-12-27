import { ConfigService } from '@nestjs/config';

const configService = new ConfigService();

export const BUCKET = {
  NAME: 'image',
  REGION: configService.getOrThrow('S3_REGION'),
  IMAGES_FILE_SIZE: 100000,
  IMAGE_FILE_TYPE: 'image/jpeg',
};
