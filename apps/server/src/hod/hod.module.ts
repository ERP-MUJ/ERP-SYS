import { Module } from '@nestjs/common';
import { DepartmentInfoController } from './department-info/department-info.controller';
import { DepartmentInfoService } from './department-info/department-info.service';
import { CoordinatorController } from './coordinator.controller';
import { CoordinatorService } from './coordinator.service';
import { HodKpiController } from './kpi-management/kpi-management.controller';
import { HodKpiService } from './kpi-management/kpi-management.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  controllers: [DepartmentInfoController, CoordinatorController, HodKpiController],
  providers: [DepartmentInfoService, CoordinatorService, HodKpiService],
  imports: [PrismaModule],
})
export class HodModule {}
