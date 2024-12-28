import {
  Controller,
  // Get,
  Post,
  // Body,
  // Patch,
  // Param,
  // Delete,
  UseInterceptors,
  UploadedFile,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
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

  // @Get()
  // findAll() {
  //   return this.uploadService.findAll();
  // }

  // @Get(':id')
  // findOne(@Param('id') id: string) {
  //   return this.uploadService.findOne(+id);
  // }

  // @Patch(':id')
  // update(@Param('id') id: string, @Body() updateUploadDto: UpdateUploadDto) {
  //   return this.uploadService.update(+id, updateUploadDto);
  // }

  // @Delete(':id')
  // remove(@Param('id') id: string) {
  //   return this.uploadService.remove(+id);
  // }
}
