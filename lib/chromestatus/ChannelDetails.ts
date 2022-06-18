export interface ChannelDetails {
  "canary_asan": MilestoneDetail
  "canary": MilestoneDetail
  "dev": MilestoneDetail
  "beta": MilestoneDetail
  "stable": MilestoneDetail
}

export type MilestoneDetails = Record<number, MilestoneDetail>

export interface MilestoneDetail {
  branch_point: string;
  earliest_beta: string;
  earliest_beta_ios: string;
  final_beta: string;
  final_beta_cut: string;
  late_stable_string: string;
  latest_beta: string;
  mstone: number;
  stable_cut: string;
  stable_cut_ios: string;
  stable_string: string;
  stable_refresh_first: string;
  version: number;
}
