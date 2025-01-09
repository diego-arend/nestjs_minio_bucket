import { ConfigService } from '@nestjs/config';

let configService: ConfigService;

export const initializeConfig = (config: ConfigService) => {
  configService = config;
};

export const BUCKET = {
  NAME: 'image',
  REGION: () => configService.getOrThrow('S3_REGION'),
  IMAGES_FILE_SIZE: 100000,
  IMAGE_FILE_TYPE: 'image/jpeg',
};
