// src/merge/merge.service.ts
import { BadRequestException, Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import ConvertApi from 'convertapi';

export interface MergeRequest {
  fileIds: string[];
  outputName?: string;
}

@Injectable()
export class MergeService {
  private readonly uploadsPath = './uploads';
  private readonly tempPath = './temp';
  private convertApi: ConvertApi;

  constructor() {
    // Initialize ConvertAPI with your secret key
    // You should set CONVERTAPI_SECRET in your environment variables
    const apiSecret = process.env.CONVERTAPI_SECRET;
    if (!apiSecret) {
      throw new Error('CONVERTAPI_SECRET environment variable is required');
    }
    this.convertApi = new ConvertApi(apiSecret);
  }

  async mergePDFs(mergeRequest: MergeRequest): Promise<string | undefined> {
    const { fileIds, outputName } = mergeRequest;

    if (!fileIds || fileIds.length < 2) {
      throw new BadRequestException(
        'At least 2 PDF files required for merging',
      );
    }

    try {
      // Verify all files exist before proceeding
      const filePaths: string[] = [];
      for (const fileId of fileIds) {
        const filePath = path.join(this.uploadsPath, fileId);

        if (!fs.existsSync(filePath)) {
          throw new BadRequestException(`File not found: ${fileId}`);
        }

        filePaths.push(filePath);
      }

      // Generate output filename
      const outputFileName = outputName || `merged-${uuidv4()}.pdf`;
      const outputPath = path.join(this.tempPath, outputFileName);

      // Ensure temp directory exists
      if (!fs.existsSync(this.tempPath)) {
        fs.mkdirSync(this.tempPath, { recursive: true });
      }

      // Use the exact syntax from ConvertAPI docs
      const result = await this.convertApi.convert(
        'merge',
        {
          Files: filePaths,
        },
        'pdf',
      );

      // Use the file property and save method (like your working convert function)
      await result.file.save(outputPath);

      // Clean up original files (optional)
      this.scheduleCleanup(fileIds, outputFileName);

      return outputFileName;
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestException(`Failed to merge PDFs: ${error.message}`);
      }
    }
  }

  private scheduleCleanup(fileIds: string[], outputFileName: string) {
    // Clean up uploaded files after 1 hour
    setTimeout(
      () => {
        fileIds.forEach((fileId) => {
          const filePath = path.join(this.uploadsPath, fileId);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        });

        // Clean up merged file after 2 hours
        setTimeout(
          () => {
            const outputPath = path.join(this.tempPath, outputFileName);
            if (fs.existsSync(outputPath)) {
              fs.unlinkSync(outputPath);
            }
          },
          2 * 60 * 60 * 1000,
        ); // 2 hours
      },
      60 * 60 * 1000,
    ); // 1 hour
  }

  getFileInfo(fileName: string) {
    const filePath = path.join(this.tempPath, fileName);

    if (!fs.existsSync(filePath)) {
      throw new BadRequestException('File not found');
    }

    const stats = fs.statSync(filePath);
    return {
      fileName,
      size: stats.size,
      createdAt: stats.birthtime,
    };
  }
}
