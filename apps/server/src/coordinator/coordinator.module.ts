import { Module } from '@nestjs/common';
import { CoordinatorKpiController } from './coordinator-kpi.controller';
import { CoordinatorKpiService } from './coordinator-kpi.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [CoordinatorKpiController],
  providers: [CoordinatorKpiService],
  exports: [CoordinatorKpiService],
})
export class CoordinatorModule {}
