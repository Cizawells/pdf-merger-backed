// src/pdf_to_word/pdf-to-word.service.ts
import { BadRequestException, Injectable } from '@nestjs/common';
import ConvertApi from 'convertapi';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface ConvertRequest {
  fileId: string;
  outputName?: string;
}

@Injectable()
export class PdfToWordService {
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

  async splitPdf(convertRequest: ConvertRequest): Promise<string | undefined> {
    const { fileId, outputName } = convertRequest;

    if (!fileId) {
      throw new BadRequestException('File ID is required for conversion');
    }

    try {
      const filePath = path.join(this.uploadsPath, fileId);

      if (!fs.existsSync(filePath)) {
        throw new BadRequestException(`File not found: ${fileId}`);
      }

      // Generate output filename
      const outputFileName = outputName || `converted-${uuidv4()}.docx`;
      const outputPath = path.join(this.tempPath, outputFileName);

      // Ensure temp directory exists
      if (!fs.existsSync(this.tempPath)) {
        fs.mkdirSync(this.tempPath, { recursive: true });
      }

      // Convert PDF to Word using ConvertAPI
      const result = await this.convertApi.convert(
        'docx',
        {
          File: filePath,
        },
        'pdf',
      );

      // Save the converted file
      await result.files[0].save(outputPath);

      // Clean up original file (optional)
      this.scheduleCleanup([fileId], outputFileName);

      return outputFileName;
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestException(
          `Failed to convert PDF to Word: ${error.message}`,
        );
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

        // Clean up converted file after 2 hours
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
