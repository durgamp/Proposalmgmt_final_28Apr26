import { dal } from '../clients/dal.client';
import type { ActivityFeedItem } from '../clients/dal.client';

interface KpiSummary {
  totalProposals: number;
  draftCount: number;
  reviewCount: number;
  sentCount: number;
  closedCount: number;
  avgCompletionPercentage: number;
}

interface StageDistribution {
  stage: string;
  stageNumber: number;
  count: number;
}

interface TemplateDistribution {
  templateType: string;
  count: number;
}

interface MonthlyTrend {
  month: string;
  created: number;
  sent: number;
}

interface CostSummary {
  totalBudget: number;
  avgProposalValue: number;
  byCategory: { category: string; total: number }[];
}

export class AnalyticsService {
  async getKpis(filters?: { year?: number; month?: number; templateType?: string; proposalManager?: string }): Promise<KpiSummary> {
    return dal.getAnalyticsKpis({
      year:            filters?.year,
      month:           filters?.month,
      templateType:    filters?.templateType,
      proposalManager: filters?.proposalManager,
    }) as Promise<KpiSummary>;
  }

  async getStageDistribution(): Promise<StageDistribution[]> {
    return dal.getStageDistribution() as Promise<StageDistribution[]>;
  }

  async getTemplateDistribution(): Promise<TemplateDistribution[]> {
    return dal.getTemplateDistribution() as Promise<TemplateDistribution[]>;
  }

  async getMonthlyTrends(year?: number): Promise<MonthlyTrend[]> {
    return dal.getMonthlyTrends(year) as Promise<MonthlyTrend[]>;
  }

  async getCostSummary(): Promise<CostSummary> {
    return dal.getCostSummary() as Promise<CostSummary>;
  }

  async getRecentActivity(limit = 20): Promise<ActivityFeedItem[]> {
    return dal.getRecentActivity(limit);
  }
}

export const analyticsService = new AnalyticsService();
