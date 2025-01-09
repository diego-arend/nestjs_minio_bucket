import {
  Controller,
  Post,
  Delete,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
  Param,
} from '@nestjs/common';
import { FileBucketService } from './fileBucket.service';
import { FileInterceptor } from '@nestjs/platform-express';
import { BUCKET } from '../fileBucket/configs/configConstants';

@Controller('upload')
export class FileBucketController {
  constructor(private readonly uploadService: FileBucketService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: BUCKET.IMAGES_FILE_SIZE }),
          new FileTypeValidator({ fileType: BUCKET.IMAGE_FILE_TYPE }),
        ],
      }),
    )
    file: Express.Multer.File,
  ) {
    return this.uploadService.uploadImage(file);
  }

  @Delete(':fileName') // Add parameter placeholder
  async deleteImage(@Param('fileName') fileName: string) {
    return this.uploadService.deleteImage(fileName);
  }
}
