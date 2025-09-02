// src/main.ts
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Enable CORS for frontend
  app.enableCors({
    origin: ['http://localhost:5000', 'http://localhost:5001'],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // Enable validation pipes
  app.useGlobalPipes(new ValidationPipe());

  // Enable CORS
  app.enableCors({
    origin: [
      'https://pdf-merger-frontend-ivory.vercel.app', // your frontend domain
    ],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true, // if you send cookies or auth headers
  });

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
