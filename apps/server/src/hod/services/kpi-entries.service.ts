import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import type { KpiFormResponses } from '@workspace/types/types';

@Injectable()
export class KpiEntriesService {
  constructor(private prisma: PrismaService) {}

  async getKpiEntriesCount(kpiNumber: string): Promise<number> {
    const kpi = await this.prisma.departmentKpi.findFirst({
      where: {
        kpi_number: Number(kpiNumber),
      },
    });

    if (!kpi) return 0;

    const formResponses = kpi.form_responses as KpiFormResponses;
    const entries = formResponses?.entries || [];
    const coordinatorEntries = formResponses?.coordinator_workflow?.coordinator_submission?.data || [];

    return entries.length + coordinatorEntries.length;
  }
}
