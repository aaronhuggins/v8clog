import { z } from "https://deno.land/x/zod@v3.21.4/mod.ts";

export type FeatureType = z.infer<typeof FeatureType>;
export const FeatureType = z.union([z.literal("Enabled by default"), z.literal("Deprecated"), z.literal("Removed"), z.literal("Browser Intervention"), z.literal("Origin trial"), z.literal("In developer trial (Behind a flag)")])

export type TimeRecord = z.infer<typeof TimeRecord>;
export const TimeRecord = z.object({
  by: z.string(),
  when: z.string(),
})

export type Standards = z.infer<typeof Standards>;
export const Standards = z.object({
  spec: z.string(),
  status: z.object({
    text: z.string(),
    val: z.number(),
  }),
  maturity: z.object({
    text: z.string(),
    short_text: z.string(),
    val: z.number(),
  }),
})

export type Chrome = z.infer<typeof Chrome>;
export const Chrome = z.object({
  bug: z.string(),
  blink_components: z.array(z.string()),
  owners: z.array(z.string()),
  origintrial: z.boolean(),
  intervention: z.boolean(),
  prefixed: z.boolean(),
  flag: z.boolean(),
  status: z.object({
    text: z.string(),
    val: z.number(),
    milestone_str: z.string(),
  }),
  desktop: z.number(),
  android: z.number(),
  webview: z.number(),
})

export type Browser = z.infer<typeof Browser>;
export const Browser = z.object({
  view: z.object({
    text: z.string(),
    val: z.number(),
    url: z.string().optional(),
    notes: z.string().optional(),
  }),
})

export type FeatureDetail = z.infer<typeof FeatureDetail>;
export const FeatureDetail = z.object({
  activation_risks: z.string(),
  all_platforms: z.boolean(),
  all_platforms_descr: z.string(),
  api_spec: z.boolean(),
  category: z.string(),
  comments: z.string(),
  debuggability: z.string(),
  deleted: z.boolean(),
  ergonomics_risks: z.string(),
  experiment_extension_reason: z.string(),
  experiment_goals: z.string(),
  experiment_risks: z.string(),
  explainer_links: z.array(z.string()),
  feature_type: z.string(),
  flag_name: z.string(),
  intent_stage: z.string(),
  interop_compat_risks: z.string(),
  launch_bug_url: z.string(),
  measurement: z.string(),
  motivation: z.string(),
  name: z.string(),
  ongoing_constraints: z.string(),
  privacy_review_status: z.string(),
  requires_embedder_support: z.boolean(),
  security_review_status: z.string(),
  security_risks: z.string(),
  star_count: z.number(),
  summary: z.string(),
  tag_review: z.string(),
  tag_review_status: z.string(),
  unlisted: z.boolean(),
  wpt: z.boolean(),
  wpt_descr: z.string(),
  is_released: z.boolean(),
  id: z.number(),
  feature_type_int: z.number(),
  intent_stage_int: z.number(),
  created: TimeRecord,
  updated: TimeRecord,
  standards: Standards,
  resources: z.object({
    docs: z.array(z.string()),
  }),
  browsers: z.object({
    chrome: Chrome,
    ff: Browser,
    edge: Browser,
    safari: Browser,
    webdev: Browser,
    other: Browser,
  }),
})

export type FeatureDetails = z.infer<typeof FeatureDetails>;
export const FeatureDetails = z.record(FeatureType, z.array(FeatureDetail))

export type FeatureDetailResponse = z.infer<typeof FeatureDetailResponse>;
export const FeatureDetailResponse = z.object({
  features_by_type: FeatureDetails,
  total_count: z.number()
})
