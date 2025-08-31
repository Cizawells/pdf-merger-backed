// src/main.ts
import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend
  app.enableCors({
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Enable validation pipes
  app.useGlobalPipes(new ValidationPipe());

  // Set global prefix
  app.setGlobalPrefix('api');

  const port = process.env.PORT || 3001;
  await app.listen(port);

  console.log(`🚀 PDF Merger API is running on: http://localhost:${port}`);
  console.log(`📚 Available endpoints:`);
  console.log(`   POST /api/upload/pdf - Upload PDF files`);
  console.log(`   POST /api/merge - Merge PDF files`);
  console.log(`   GET  /api/merge/download/:fileName - Download merged PDF`);
}

bootstrap();
