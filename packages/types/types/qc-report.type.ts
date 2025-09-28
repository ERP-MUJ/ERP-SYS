import { z } from "zod";
import { QcReportKpiOptionSchema } from "../schema/qc-report.schema";

export type QcReportKpiOption = z.infer<typeof QcReportKpiOptionSchema>;
