// src/split/split.service.ts
import { BadRequestException, Injectable } from '@nestjs/common';
import ConvertApi from 'convertapi';
import * as fs from 'fs';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';

export interface SplitByPatternRequest {
  fileId: string;
  splitByPattern: string;
  outputName?: string;
}

export interface SplitByRangeRequest {
  fileId: string;
  splitByRange: string;
  outputName?: string;
}

export interface SplitByTextPatternRequest {
  fileId: string;
  splitByTextPattern: string;
  outputName?: string;
}

export interface SplitByBookmarkRequest {
  fileId: string;
  splitByBookmark: boolean;
  outputName?: string;
}

export interface ExtractPagesRequest {
  fileId: string;
  extractPages: string;
  outputName?: string;
}

@Injectable()
export class SplitService {
  private readonly uploadsPath = './uploads';
  private readonly tempPath = './temp';
  private convertApi: ConvertApi;

  constructor() {
    // Initialize ConvertAPI with your secret key
    const apiSecret = process.env.CONVERTAPI_SECRET;
    if (!apiSecret) {
      throw new Error('CONVERTAPI_SECRET environment variable is required');
    }
    this.convertApi = new ConvertApi(apiSecret);
  }

  async splitByPattern(request: SplitByPatternRequest): Promise<string[]> {
    const { fileId, splitByPattern, outputName } = request;

    if (!fileId || !splitByPattern) {
      throw new BadRequestException('File ID and split pattern are required');
    }

    const filePath = path.join(this.uploadsPath, fileId);
    if (!fs.existsSync(filePath)) {
      throw new BadRequestException(`File not found: ${fileId}`);
    }

    try {
      // Ensure temp directory exists
      if (!fs.existsSync(this.tempPath)) {
        fs.mkdirSync(this.tempPath, { recursive: true });
      }

      const result = await this.convertApi.convert(
        'split',
        {
          File: filePath,
          SplitByPattern: splitByPattern,
        },
        'pdf',
      );

      const outputFiles: string[] = [];
      const baseOutputName = outputName || `split-${uuidv4()}`;

      // Handle multiple output files from split operation
      if (result.files && result.files.length > 0) {
        for (let i = 0; i < result.files.length; i++) {
          const outputFileName = `${baseOutputName}-${i + 1}.pdf`;
          const outputPath = path.join(this.tempPath, outputFileName);
          await result.files[i].save(outputPath);
          outputFiles.push(outputFileName);
        }
      } else if (result.file) {
        // Single file output
        const outputFileName = `${baseOutputName}.pdf`;
        const outputPath = path.join(this.tempPath, outputFileName);
        await result.file.save(outputPath);
        outputFiles.push(outputFileName);
      }

      // Schedule cleanup
      this.scheduleCleanup([fileId], outputFiles);

      return outputFiles;
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestException(`Failed to split PDF: ${error.message}`);
      }
      throw new BadRequestException('Failed to split PDF');
    }
  }

  async splitByRange(request: SplitByRangeRequest): Promise<string[]> {
    const { fileId, splitByRange, outputName } = request;

    if (!fileId || !splitByRange) {
      throw new BadRequestException('File ID and split range are required');
    }

    const filePath = path.join(this.uploadsPath, fileId);
    if (!fs.existsSync(filePath)) {
      throw new BadRequestException(`File not found: ${fileId}`);
    }

    try {
      if (!fs.existsSync(this.tempPath)) {
        fs.mkdirSync(this.tempPath, { recursive: true });
      }

      const result = await this.convertApi.convert(
        'split',
        {
          File: filePath,
          SplitByRange: splitByRange,
        },
        'pdf',
      );

      const outputFiles: string[] = [];
      const baseOutputName = outputName || `split-range-${uuidv4()}`;

      if (result.files && result.files.length > 0) {
        for (let i = 0; i < result.files.length; i++) {
          const outputFileName = `${baseOutputName}-${i + 1}.pdf`;
          const outputPath = path.join(this.tempPath, outputFileName);
          await result.files[i].save(outputPath);
          outputFiles.push(outputFileName);
        }
      } else if (result.file) {
        const outputFileName = `${baseOutputName}.pdf`;
        const outputPath = path.join(this.tempPath, outputFileName);
        await result.file.save(outputPath);
        outputFiles.push(outputFileName);
      }

      this.scheduleCleanup([fileId], outputFiles);
      return outputFiles;
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestException(`Failed to split PDF: ${error.message}`);
      }
      throw new BadRequestException('Failed to split PDF');
    }
  }

  async splitByTextPattern(
    request: SplitByTextPatternRequest,
  ): Promise<string[]> {
    const { fileId, splitByTextPattern, outputName } = request;

    if (!fileId || !splitByTextPattern) {
      throw new BadRequestException('File ID and text pattern are required');
    }

    const filePath = path.join(this.uploadsPath, fileId);
    if (!fs.existsSync(filePath)) {
      throw new BadRequestException(`File not found: ${fileId}`);
    }

    try {
      if (!fs.existsSync(this.tempPath)) {
        fs.mkdirSync(this.tempPath, { recursive: true });
      }

      const result = await this.convertApi.convert(
        'split',
        {
          File: filePath,
          SplitByTextPattern: splitByTextPattern,
        },
        'pdf',
      );

      const outputFiles: string[] = [];
      const baseOutputName = outputName || `split-text-${uuidv4()}`;

      if (result.files && result.files.length > 0) {
        for (let i = 0; i < result.files.length; i++) {
          const outputFileName = `${baseOutputName}-${i + 1}.pdf`;
          const outputPath = path.join(this.tempPath, outputFileName);
          await result.files[i].save(outputPath);
          outputFiles.push(outputFileName);
        }
      } else if (result.file) {
        const outputFileName = `${baseOutputName}.pdf`;
        const outputPath = path.join(this.tempPath, outputFileName);
        await result.file.save(outputPath);
        outputFiles.push(outputFileName);
      }

      this.scheduleCleanup([fileId], outputFiles);
      return outputFiles;
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestException(`Failed to split PDF: ${error.message}`);
      }
      throw new BadRequestException('Failed to split PDF');
    }
  }

  async splitByBookmark(request: SplitByBookmarkRequest): Promise<string[]> {
    const { fileId, splitByBookmark, outputName } = request;

    if (!fileId || splitByBookmark === undefined) {
      throw new BadRequestException('File ID and bookmark flag are required');
    }

    const filePath = path.join(this.uploadsPath, fileId);
    if (!fs.existsSync(filePath)) {
      throw new BadRequestException(`File not found: ${fileId}`);
    }

    try {
      if (!fs.existsSync(this.tempPath)) {
        fs.mkdirSync(this.tempPath, { recursive: true });
      }

      const result = await this.convertApi.convert(
        'split',
        {
          File: filePath,
          SplitByBookmark: splitByBookmark,
        },
        'pdf',
      );

      const outputFiles: string[] = [];
      const baseOutputName = outputName || `split-bookmark-${uuidv4()}`;

      if (result.files && result.files.length > 0) {
        for (let i = 0; i < result.files.length; i++) {
          const outputFileName = `${baseOutputName}-${i + 1}.pdf`;
          const outputPath = path.join(this.tempPath, outputFileName);
          await result.files[i].save(outputPath);
          outputFiles.push(outputFileName);
        }
      } else if (result.file) {
        const outputFileName = `${baseOutputName}.pdf`;
        const outputPath = path.join(this.tempPath, outputFileName);
        await result.file.save(outputPath);
        outputFiles.push(outputFileName);
      }

      this.scheduleCleanup([fileId], outputFiles);
      return outputFiles;
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestException(`Failed to split PDF: ${error.message}`);
      }
      throw new BadRequestException('Failed to split PDF');
    }
  }

  async extractPages(request: ExtractPagesRequest): Promise<string[]> {
    const { fileId, extractPages, outputName } = request;

    if (!fileId || !extractPages) {
      throw new BadRequestException(
        'File ID and pages to extract are required',
      );
    }

    const filePath = path.join(this.uploadsPath, fileId);
    if (!fs.existsSync(filePath)) {
      throw new BadRequestException(`File not found: ${fileId}`);
    }

    try {
      if (!fs.existsSync(this.tempPath)) {
        fs.mkdirSync(this.tempPath, { recursive: true });
      }

      const result = await this.convertApi.convert(
        'split',
        {
          File: filePath,
          ExtractPages: extractPages,
        },
        'pdf',
      );

      const outputFiles: string[] = [];
      const baseOutputName = outputName || `extract-${uuidv4()}`;

      if (result.files && result.files.length > 0) {
        for (let i = 0; i < result.files.length; i++) {
          const outputFileName = `${baseOutputName}-${i + 1}.pdf`;
          const outputPath = path.join(this.tempPath, outputFileName);
          await result.files[i].save(outputPath);
          outputFiles.push(outputFileName);
        }
      } else if (result.file) {
        const outputFileName = `${baseOutputName}.pdf`;
        const outputPath = path.join(this.tempPath, outputFileName);
        await result.file.save(outputPath);
        outputFiles.push(outputFileName);
      }

      this.scheduleCleanup([fileId], outputFiles);
      return outputFiles;
    } catch (error) {
      if (error instanceof Error) {
        throw new BadRequestException(
          `Failed to extract pages: ${error.message}`,
        );
      }
      throw new BadRequestException('Failed to extract pages');
    }
  }

  private scheduleCleanup(inputFileIds: string[], outputFileNames: string[]) {
    // Clean up uploaded files after 1 hour
    setTimeout(
      () => {
        inputFileIds.forEach((fileId) => {
          const filePath = path.join(this.uploadsPath, fileId);
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
        });

        // Clean up output files after 2 hours
        setTimeout(
          () => {
            outputFileNames.forEach((fileName) => {
              const outputPath = path.join(this.tempPath, fileName);
              if (fs.existsSync(outputPath)) {
                fs.unlinkSync(outputPath);
              }
            });
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
