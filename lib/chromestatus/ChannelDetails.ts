export type Channel = "canary_asan" | "canary" | "dev" | "beta" | "stable"

export type ChannelDetails = Record<Channel, MilestoneDetail>

export type MilestoneDetails = Record<number, MilestoneDetail>

export interface MilestoneDetail {
  branch_point: string;
  earliest_beta: string;
  earliest_beta_ios: string;
  final_beta: string;
  final_beta_cut: string;
  late_stable_date: string;
  latest_beta: string;
  mstone: number;
  stable_cut: string;
  stable_cut_ios: string;
  stable_date: string;
  stable_refresh_first: string;
  version?: number;
}

export type V8ChannelDetails = Record<Channel, V8MilestoneDetail>

export interface V8MilestoneDetail extends Omit<MilestoneDetail, "mstone"> {
  mstone: string
}
