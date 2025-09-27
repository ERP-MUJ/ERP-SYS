import { z } from "zod";

export const QcReportKpiOptionSchema = z.object({
  id: z.string().uuid("Invalid KPI template id"),
  kpi_number: z.number().int().nonnegative(),
  kpi_metric_name: z.string().min(1, "KPI metric name is required"),
});
