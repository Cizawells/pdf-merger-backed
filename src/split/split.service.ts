// src/split/split.service.ts
import { BadRequestException, Injectable } from '@nestjs/common';
import * as archiver from 'archiver';

import ConvertApi from 'convertapi';
import * as fs from 'fs';
import * as path from 'path';
import { Readable } from 'stream';
import { v4 as uuidv4 } from 'uuid';

export interface SplitByPatternRequest {
  fileId: string;
  splitByPattern: string;
  outputName?: string;
  options: {
    pages: [];
  };
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

export interface SplitResult {
  files: string[];
  zipFile?: string; // Optional ZIP file name
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

  /**
   * Creates a ZIP file from existing files and returns the ZIP as a stream
   */
  async createZipStream(
    fileNames: string[],
  ): Promise<{ stream: Readable; filename: string }> {
    const zipFileName = `split-files-${Date.now()}.zip`;
    const archive = archiver('zip', {
      zlib: { level: 9 },
    });

    // Add each PDF file to the ZIP
    fileNames.forEach((fileName) => {
      const filePath = path.join(this.tempPath, fileName);
      if (fs.existsSync(filePath)) {
        archive.file(filePath, { name: fileName });
      }
    });

    await archive.finalize();

    return {
      stream: archive,
      filename: zipFileName,
    };
  }

  private async createZipFromFiles(
    fileNames: string[],
    zipBaseName: string,
  ): Promise<string> {
    console.log('in the createZipFromFiles', fileNames, zipBaseName);
    return new Promise((resolve, reject) => {
      const zipFileName = `${zipBaseName}.zip`;
      const zipPath = path.join(this.tempPath, zipFileName);
      const output = fs.createWriteStream(zipPath);
      const archive = archiver('zip', {
        zlib: { level: 9 }, // Maximum compression
      });

      output.on('close', () => {
        console.log(
          `ZIP file created: ${zipFileName} (${archive.pointer()} total bytes)`,
        );
        resolve(zipFileName);
      });

      archive.on('error', (err) => {
        reject(err);
      });

      archive.pipe(output);

      // Add each PDF file to the ZIP
      fileNames.forEach((fileName) => {
        const filePath = path.join(this.tempPath, fileName);
        if (fs.existsSync(filePath)) {
          archive.file(filePath, { name: fileName });
        }
      });

      archive.finalize();
    });
  }

  async splitByPattern(
    request: SplitByPatternRequest,
    createZip: boolean = true,
  ): Promise<SplitResult> {
    console.log('splittitng', request, createZip);
    const { fileId, splitByPattern, outputName } = request;

    if (!fileId || !splitByPattern) {
      throw new BadRequestException('File ID and split pattern are required');
    }

    const filePath = path.join(this.uploadsPath, fileId);
    if (!fs.existsSync(filePath)) {
      throw new BadRequestException(`File not found: ${fileId}`);
    }

    try {
      console.log('starting try');
      // Ensure temp directory exists
      if (!fs.existsSync(this.tempPath)) {
        fs.mkdirSync(this.tempPath, { recursive: true });
      }
      console.log('before splitting try');

      const result = await this.convertApi.convert(
        'split',
        {
          File: filePath,
          SplitByPattern: splitByPattern,
        },
        'pdf',
      );
      console.log('after splitting try, result', result);

      const outputFiles: string[] = [];
      const baseOutputName = outputName || `split-${uuidv4()}`;
      console.log('before saving', result);
      // Handle multiple output files from split operation
      if (result.files && result.files.length > 0) {
        console.log('insideee', result);

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

      console.log('about to zippp', createZip, outputFiles.length);

      let zipFile: string | undefined;
      if (createZip && outputFiles.length > 1) {
        console.log('zip filllesss', outputFiles.length);
        zipFile = await this.createZipFromFiles(
          outputFiles,
          `${baseOutputName}-archive`,
        );
      }

      // Schedule cleanup
      // this.scheduleCleanup([fileId], outputFiles);

      return { files: outputFiles, zipFile };
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
