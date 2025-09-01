// src/upload/upload.controller.ts
import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Get,
  Param,
  Res,
  UploadedFiles,
} from '@nestjs/common';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { Express, Response } from 'express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs';

@Controller('upload')
export class UploadController {
  @Post('pdf')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
          cb(null, uniqueName);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (file.mimetype !== 'application/pdf') {
          return cb(new BadRequestException('Only PDF files allowed'), false);
        }
        cb(null, true);
      },
      limits: {
        fileSize: 5 * 1024 * 1024, // 50MB
      },
    }),
  )
  uploadPDF(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    return {
      message: 'File uploaded successfully',
      fileId: file.filename,
      originalName: file.originalname,
      size: file.size,
      path: file.path,
    };
  }

  // NEW: Multiple PDF upload endpoint
  @Post('pdfs')
  @UseInterceptors(
    FilesInterceptor('files', 10, {
      // Allow up to 10 files at once
      storage: diskStorage({
        destination: './uploads',
        filename: (req, file, cb) => {
          const uniqueName = `${uuidv4()}${extname(file.originalname)}`;
          cb(null, uniqueName);
        },
      }),
      fileFilter: (req, file, cb) => {
        if (file.mimetype !== 'application/pdf') {
          return cb(new BadRequestException('Only PDF files allowed'), false);
        }
        cb(null, true);
      },
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB per file
        files: 10, // Maximum 10 files
      },
    }),
  )
  uploadMultiplePDFs(@UploadedFiles() files: Express.Multer.File[]) {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files uploaded');
    }

    // Validate that all files are PDFs
    const nonPdfFiles = files.filter(
      (file) => file.mimetype !== 'application/pdf',
    );
    if (nonPdfFiles.length > 0) {
      throw new BadRequestException('All files must be PDF format');
    }

    // Return array of uploaded file info
    const uploadedFiles = files.map((file) => ({
      fileId: file.filename,
      originalName: file.originalname,
      size: file.size,
      path: file.path,
    }));

    return {
      message: `${files.length} files uploaded successfully`,
      files: uploadedFiles,
      totalFiles: files.length,
      totalSize: files.reduce((sum, file) => sum + file.size, 0),
    };
  }

  @Get('file/:fileId')
  getFile(@Param('fileId') fileId: string, @Res() res: Response) {
    const filePath = join(process.cwd(), 'uploads', fileId);

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }

    res.sendFile(filePath);
  }
}
