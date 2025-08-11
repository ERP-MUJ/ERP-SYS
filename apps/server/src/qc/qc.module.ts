import { Module } from '@nestjs/common';
import { PillarController } from './pillar/pillar.controller';
import { PillarService } from './pillar/pillar.service';
import { KpiController } from './kpi/kpi.controller';
import { KpiService } from './kpi/kpi.service';
import { DepartmentAssignmentController } from './department-assignment/department-assignment.controller';
import { DepartmentAssignmentService } from './department-assignment/department-assignment.service';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  controllers: [PillarController, KpiController, DepartmentAssignmentController],
  providers: [PillarService, KpiService, DepartmentAssignmentService],
  imports: [PrismaModule],
})
export class QcModule {}
