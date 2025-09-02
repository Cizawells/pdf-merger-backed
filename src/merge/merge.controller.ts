// src/merge/merge.controller.ts
import { Body, Controller, Get, Param, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { MergeRequest, MergeService } from './merge.service';

@Controller('merge')
export class MergeController {
  constructor(private readonly mergeService: MergeService) {}

  @Post()
  async mergePDFs(@Body() mergeRequest: MergeRequest) {
    console.log('mergggging', mergeRequest);
    const fileName = await this.mergeService.mergePDFs(mergeRequest);

    return {
      message: 'PDFs merged successfully',
      fileName,
      downloadUrl: `/merge/download/${fileName}`,
    };
  }

  @Get('download/:fileName')
  downloadMergedPDF(@Param('fileName') fileName: string, @Res() res: Response) {
    const filePath = path.join(process.cwd(), 'temp', fileName);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }

    // Set headers for file download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);

    // Send file
    res.sendFile(filePath);
  }

  @Get('info/:fileName')
  getFileInfo(@Param('fileName') fileName: string) {
    return this.mergeService.getFileInfo(fileName);
  }
}
