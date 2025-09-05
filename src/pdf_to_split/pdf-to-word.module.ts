// src/pdf_to_word/pdf-to-word.module.ts
import { Module } from '@nestjs/common';
import { PdfToWordController } from './pdf-to-word.controller';
import { PdfToWordService } from './pdf-to-word.service';

@Module({
  controllers: [PdfToWordController],
  providers: [PdfToWordService],
})
export class PdfToWordModule {}
