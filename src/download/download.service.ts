import { Injectable, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import * as mime from 'mime-types';

@Injectable()
export class DownloadService {
  private readonly tempDir = path.join(process.cwd(), 'temp');

  downloadFile(fileName: string, res: Response): void {
    const filePath = path.join(this.tempDir, fileName);

    if (!fs.existsSync(filePath)) {
      res.status(404).json({ message: 'File not found' });
      return;
    }

    // Get file stats for additional info
    const stats = fs.statSync(filePath);

    // Determine MIME type based on file extension
    const lookupResult = mime.lookup(fileName);
    const mimeType: string =
      typeof lookupResult === 'string'
        ? lookupResult
        : 'application/octet-stream';
    // Set headers for file download
    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', stats.size.toString());

    // Send file
    res.sendFile(filePath);
  }

  getFileInfo(fileName: string) {
    const filePath = path.join(this.tempDir, fileName);

    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('File not found');
    }

    const stats = fs.statSync(filePath);
    const mimeType: string =
      mime.lookup(fileName) || 'application/octet-stream';
    const fileExtension = path.extname(fileName).toLowerCase();

    return {
      fileName,
      filePath,
      size: stats.size,
      mimeType,
      extension: fileExtension,
      created: stats.birthtime,
      modified: stats.mtime,
      isFile: stats.isFile(),
    };
  }

  listFiles() {
    if (!fs.existsSync(this.tempDir)) {
      return [];
    }

    const files = fs.readdirSync(this.tempDir);
    return files.map((fileName) => {
      const filePath = path.join(this.tempDir, fileName);
      const stats = fs.statSync(filePath);
      const mimeType: string =
        mime.lookup(fileName) || 'application/octet-stream';

      return {
        fileName,
        size: stats.size,
        mimeType,
        extension: path.extname(fileName).toLowerCase(),
        created: stats.birthtime,
        modified: stats.mtime,
      };
    });
  }
}
