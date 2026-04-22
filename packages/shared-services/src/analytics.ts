import type { WardrowbeApi } from "./types";

export interface ColorDistribution {
  color: string;
  count: number;
  percentage: number;
}

export interface TypeDistribution {
  type: string;
  count: number;
  percentage: number;
}

export interface WearStats {
  id: string;
  name: string | null;
  type: string;
  primary_color: string | null;
  thumbnail_path: string | null;
  thumbnail_url: string | null;
  wear_count: number;
  last_worn_at: string | null;
}

export interface AcceptanceRateTrend {
  period: string;
  total: number;
  accepted: number;
  rejected: number;
  rate: number;
}

export interface WardrobeStats {
  total_items: number;
  items_by_status: Record<string, number>;
  total_outfits: number;
  outfits_this_week: number;
  outfits_this_month: number;
  acceptance_rate: number | null;
  average_rating: number | null;
  total_wears: number;
}

export interface AnalyticsData {
  wardrobe: WardrobeStats;
  color_distribution: ColorDistribution[];
  type_distribution: TypeDistribution[];
  most_worn: WearStats[];
  least_worn: WearStats[];
  never_worn: WearStats[];
  acceptance_trend: AcceptanceRateTrend[];
  insights: string[];
}

export function getAnalytics(api: WardrowbeApi, days = 30): Promise<AnalyticsData> {
  return api.get<AnalyticsData>("/analytics", { params: { days: String(days) } });
}
