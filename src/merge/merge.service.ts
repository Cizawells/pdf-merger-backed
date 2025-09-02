// src/merge/merge.service.ts
import { BadRequestException, Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { PDFDocument } from 'pdf-lib';
import { v4 as uuidv4 } from 'uuid';

export interface MergeRequest {
  fileIds: string[];
  outputName?: string;
}

@Injectable()
export class MergeService {
  private readonly uploadsPath = './uploads';
  private readonly tempPath = './temp';

  async mergePDFs(mergeRequest: MergeRequest): Promise<string | undefined> {
    const { fileIds, outputName } = mergeRequest;

    if (!fileIds || fileIds.length < 2) {
      throw new BadRequestException(
        'At least 2 PDF files required for merging',
      );
    }

    try {
      // Create new PDF document
      const mergedPDF = await PDFDocument.create();

      // Process each file in order
      for (const fileId of fileIds) {
        const filePath = path.join(this.uploadsPath, fileId);

        if (!fs.existsSync(filePath)) {
          throw new BadRequestException(`File not found: ${fileId}`);
        }

        // Read PDF file
        const pdfBytes = fs.readFileSync(filePath);

        // Load PDF
        const pdf = await PDFDocument.load(pdfBytes);

        // Get all pages
        const pages = await mergedPDF.copyPages(pdf, pdf.getPageIndices());

        // Add pages to merged document
        pages.forEach((page) => mergedPDF.addPage(page));
      }

      // Generate output filename
      const outputFileName = outputName || `merged-${uuidv4()}.pdf`;
      const outputPath = path.join(this.tempPath, outputFileName);

      // Ensure temp directory exists
      if (!fs.existsSync(this.tempPath)) {
        fs.mkdirSync(this.tempPath, { recursive: true });
      }

      // Save merged PDF
      const mergedPDFBytes = await mergedPDF.save();
      fs.writeFileSync(outputPath, mergedPDFBytes);

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
