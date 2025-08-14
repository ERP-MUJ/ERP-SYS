import { Module } from '@nestjs/common';
import { QcDashboardController } from './qc-dashboard.controller';
import { QcDashboardService } from './qc-dashboard.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [QcDashboardController],
  providers: [QcDashboardService],
})
export class QcDashboardModule {}
