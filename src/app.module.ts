// src/app.module.ts
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { UploadModule } from './upload/upload.module';
import { MergeModule } from './merge/merge.module';
import { PdfToWordModule } from './pdf_to_word/pdf-to-word.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    UploadModule,
    MergeModule,
    PdfToWordModule,
  ],
})
export class AppModule {}
