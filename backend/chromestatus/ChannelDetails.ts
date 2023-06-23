import { z } from 'https://deno.land/x/zod@v3.21.4/mod.ts'

export type Channel = z.infer<typeof Channel>;
export const Channel = z.union([z.literal("canary_asan"), z.literal("canary"), z.literal("dev"), z.literal("beta"), z.literal("stable")])

export type MilestoneDetail = z.infer<typeof MilestoneDetail>
export const MilestoneDetail = z.object({
  branch_point: z.string(),
  earliest_beta: z.string(),
  earliest_beta_ios: z.string(),
  final_beta: z.string(),
  final_beta_cut: z.string(),
  late_stable_date: z.string(),
  latest_beta: z.string(),
  mstone: z.number(),
  stable_cut: z.string(),
  stable_cut_ios: z.string(),
  stable_date: z.string(),
  stable_refresh_first: z.string(),
  version: z.number().optional(),
})

export type ChannelDetails = Record<Channel, MilestoneDetail>;
export const ChannelDetails = z.record(Channel, MilestoneDetail)

export type MilestoneDetails = Record<number, MilestoneDetail>;
export const MilestoneDetails = z.record(z.number(), MilestoneDetail)

export type V8MilestoneDetail = z.infer<typeof V8MilestoneDetail>
export const V8MilestoneDetail = MilestoneDetail.omit({ mstone: true }).and(z.object({
  mstone: z.string()
}))

export type V8ChannelDetails = z.infer<typeof V8ChannelDetails>
export const V8ChannelDetails = z.record(Channel, V8MilestoneDetail)
