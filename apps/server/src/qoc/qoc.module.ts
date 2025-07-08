import { Module } from '@nestjs/common';
import { QocService } from './qoc.service';
import { QocController } from './qoc.controller';

@Module({
  providers: [QocService],
  controllers: [QocController],
})
export class QocModule {}
