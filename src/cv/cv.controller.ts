import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  ParseFilePipe,
  MaxFileSizeValidator,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { CvService } from './cv.service';

@Controller('cv')
export class CvController {
  constructor(private readonly cvService: CvService) {}

  @Post('ingest')
  @UseInterceptors(FileInterceptor('file'))
  async ingestCv(
    @UploadedFile(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 10 * 1024 * 1024 }), // 10MB
        ],
      }),
    )
    file: Express.Multer.File,
    @Res() res: Response,
  ) {
    const embeddings = await this.cvService.processCv(file);

    // Creamos el JSON descargable
    const jsonBuffer = Buffer.from(
      JSON.stringify(embeddings, null, 2),
      'utf-8',
    );

    res.set({
      'Content-Type': 'application/json',
      'Content-Disposition': `attachment; filename="cv-embeddings-${Date.now()}.json"`,
      'Content-Length': jsonBuffer.length,
    });

    res.send(jsonBuffer);
  }
}
