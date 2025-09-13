import { Controller, Get, Param } from '@nestjs/common';
import { KpiEntriesService } from '../services/kpi-entries.service';

@Controller('hod/dashboard/kpi-entries')
export class KpiEntriesController {
  constructor(private readonly kpiEntriesService: KpiEntriesService) {}

  @Get(':kpiNumber')
  async getKpiEntries(@Param('kpiNumber') kpiNumber: string) {
    const total = await this.kpiEntriesService.getKpiEntriesCount(kpiNumber);
    return { total };
  }
}
