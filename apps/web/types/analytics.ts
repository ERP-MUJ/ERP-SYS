export interface PillarAnalytics {
  id: string;
  name: string;
  completion: number;
  total: number;
  completed: number;
  departments: {
    name: string;
    completion: number;
    kpis: number;
  }[];
  recentActivity: {
    kpi: string;
    department: string;
    status: string;
    date: string;
  }[];
  trend: string;
}

export interface AnalyticsData {
  kpiCompletionRate: {
    overall: number;
    byPillar: PillarAnalytics[];
  };
  onTimeSubmission: {
    rate: number;
    trend: "up" | "down";
    monthlyData: {
      month: string;
      rate: number;
    }[];
  };
  underperformingKpis: {
    name: string;
    pillar: string;
    completion: number;
    target: number;
    department: string;
    lastUpdated: string;
  }[];
  recheckRate: {
    rate: number;
    trend: "up" | "down";
    reasons: {
      reason: string;
      count: number;
      percentage: number;
    }[];
  };
}
