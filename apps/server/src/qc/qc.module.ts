import { Module } from '@nestjs/common';
import { PillarController } from './pillar/pillar.controller';
import { PillarService } from './pillar/pillar.service';
import { KpiController } from './kpi/kpi.controller';
import { KpiService } from './kpi/kpi.service';
import { DepartmentAssignmentController } from './department-assignment/department-assignment.controller';
import { DepartmentAssignmentService } from './department-assignment/department-assignment.service';
import { QcDashboardController } from './dashboard/qc-dashboard.controller';
import { QcDashboardService } from './dashboard/qc-dashboard.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  controllers: [PillarController, KpiController, DepartmentAssignmentController, QcDashboardController],
  providers: [PillarService, KpiService, DepartmentAssignmentService, QcDashboardService],
  imports: [PrismaModule],
})
export class QcModule {}
