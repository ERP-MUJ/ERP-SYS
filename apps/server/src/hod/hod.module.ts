import { Module } from '@nestjs/common';
import { DepartmentInfoController } from './department-info/department-info.controller';
import { DepartmentInfoService } from './department-info/department-info.service';
import { CoordinatorController } from './coordinator.controller';
import { CoordinatorService } from './coordinator.service';
import { HodKpiController } from './kpi-management/kpi-management.controller';
import { HodKpiService } from './kpi-management/kpi-management.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { HodCoordinatorWorkflowController } from './coordinator-workflow.controller';
import { HodCoordinatorWorkflowService } from './hod-coordinator-workflow.service';
import { HodDashboardModule } from './dashboard/hod-dashboard.module';
import { ExcelService } from 'src/services/excel.service';
import { KpiEntriesModule } from './kpi-entries/kpi-entries.module';
import { QcReviewService } from 'src/qc/review/qc-review.service';

@Module({
  controllers: [DepartmentInfoController, CoordinatorController, HodKpiController, HodCoordinatorWorkflowController],
  providers: [
    DepartmentInfoService,
    CoordinatorService,
    HodKpiService,
    HodCoordinatorWorkflowService,
    ExcelService,
    QcReviewService,
  ],
  imports: [PrismaModule, HodDashboardModule, KpiEntriesModule],
})
export class HodModule {}
