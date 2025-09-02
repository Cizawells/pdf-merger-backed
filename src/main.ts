// src/main.ts
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });

  // Enable validation pipes
  app.useGlobalPipes(new ValidationPipe());

  // Set global prefix
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 5001;
  await app.listen(port);

  console.log(`🚀 PDF Merger API is running on: http://localhost:${port}`);
  console.log(`📚 Available endpoints:`);
  console.log(`   POST /api/upload/pdf - Upload PDF files`);
  console.log(`   POST /api/merge - Merge PDF files`);
  console.log(`   GET  /api/merge/download/:fileName - Download merged PDF`);
}

bootstrap();
