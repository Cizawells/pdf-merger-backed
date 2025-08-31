// src/merge/merge.module.ts
import { Module } from '@nestjs/common';
import { MergeController } from './merge.controller';
import { MergeService } from './merge.service';

@Module({
  controllers: [MergeController],
  providers: [MergeService],
})
export class MergeModule {}
