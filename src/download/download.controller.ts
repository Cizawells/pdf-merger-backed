import { Controller, Get, Param, Res } from '@nestjs/common';
import { Response } from 'express';
import { DownloadService } from './download.service';

@Controller('download')
export class DownloadController {
  constructor(private readonly downloadService: DownloadService) {}

  @Get(':fileName')
  downloadFile(
    @Param('fileName') fileName: string,
    @Res() res: Response,
  ): void {
    this.downloadService.downloadFile(fileName, res);
  }

  @Get('info/:fileName')
  getFileInfo(@Param('fileName') fileName: string) {
    return this.downloadService.getFileInfo(fileName);
  }
}
