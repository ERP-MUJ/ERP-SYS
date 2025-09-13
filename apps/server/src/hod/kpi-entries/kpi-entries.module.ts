import { Module } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { KpiEntriesController } from '../controllers/kpi-entries.controller';
import { KpiEntriesService } from '../services/kpi-entries.service';

@Module({
  controllers: [KpiEntriesController],
  providers: [KpiEntriesService, PrismaService],
})
export class KpiEntriesModule {}
