// src/split/split.controller.ts
import { Body, Controller, Get, Param, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import {
  ExtractPagesRequest,
  SplitByBookmarkRequest,
  SplitByPatternRequest,
  SplitByRangeRequest,
  SplitByTextPatternRequest,
  SplitService,
} from './split.service';

@Controller('split')
export class SplitController {
  constructor(private readonly splitService: SplitService) {}

  @Post('pattern')
  async splitByPattern(@Body() request: SplitByPatternRequest) {
    console.log('Splitting PDF by pattern:', request);
    const fileNames = await this.splitService.splitByPattern(request);

    return {
      message: 'PDF split by pattern successfully',
      files: fileNames,
      downloadUrls: fileNames.map((fileName) => `/split/download/${fileName}`),
    };
  }

  @Post('range')
  async splitByRange(@Body() request: SplitByRangeRequest) {
    console.log('Splitting PDF by range:', request);
    const fileNames = await this.splitService.splitByRange(request);

    return {
      message: 'PDF split by range successfully',
      files: fileNames,
      downloadUrls: fileNames.map((fileName) => `/split/download/${fileName}`),
    };
  }

  @Post('text-pattern')
  async splitByTextPattern(@Body() request: SplitByTextPatternRequest) {
    console.log('Splitting PDF by text pattern:', request);
    const fileNames = await this.splitService.splitByTextPattern(request);

    return {
      message: 'PDF split by text pattern successfully',
      files: fileNames,
      downloadUrls: fileNames.map((fileName) => `/split/download/${fileName}`),
    };
  }

  @Post('bookmark')
  async splitByBookmark(@Body() request: SplitByBookmarkRequest) {
    console.log('Splitting PDF by bookmark:', request);
    const fileNames = await this.splitService.splitByBookmark(request);

    return {
      message: 'PDF split by bookmark successfully',
      files: fileNames,
      downloadUrls: fileNames.map((fileName) => `/split/download/${fileName}`),
    };
  }

  @Post('extract')
  async extractPages(@Body() request: ExtractPagesRequest) {
    console.log('Extracting pages from PDF:', request);
    const fileNames = await this.splitService.extractPages(request);

    return {
      message: 'Pages extracted successfully',
      files: fileNames,
      downloadUrls: fileNames.map((fileName) => `/split/download/${fileName}`),
    };
  }

  @Get('download/:fileName')
  downloadSplitPDF(@Param('fileName') fileName: string, @Res() res: Response) {
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
    return this.splitService.getFileInfo(fileName);
  }
}
