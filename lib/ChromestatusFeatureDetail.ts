export interface Created {
  by: string;
  when: string;
}

export interface Updated {
  by: string;
  when: string;
}

export interface Status {
  text: string;
  val: number;
}

export interface Maturity {
  text: string;
  short_text: string;
  val: number;
}

export interface Standards {
  spec: string;
  status: Status;
  maturity: Maturity;
}

export interface Resources {
  docs: string[];
}

export interface Status2 {
  text: string;
  val: number;
  milestone_str: string;
}

export interface Chrome {
  bug: string;
  blink_components: string[];
  owners: string[];
  origintrial: boolean;
  intervention: boolean;
  prefixed: boolean;
  flag: boolean;
  status: Status2;
  desktop: number;
  android: number;
  webview: number;
}

export interface View {
  text: string;
  val: number;
  url?: string;
  notes?: string;
}

export interface Browser {
  view: View;
}

export interface Browsers {
  chrome: Chrome;
  ff: Browser;
  edge: Browser;
  safari: Browser;
  webdev: Browser;
  other: Browser;
}

export interface ChromestatusFeatureDetail {
  activation_risks: string;
  all_platforms: boolean;
  all_platforms_descr: string;
  api_spec: boolean;
  category: string;
  comments: string;
  debuggability: string;
  deleted: boolean;
  ergonomics_risks: string;
  experiment_extension_reason: string;
  experiment_goals: string;
  experiment_risks: string;
  explainer_links: string[];
  feature_type: string;
  flag_name: string;
  intent_stage: string;
  interop_compat_risks: string;
  launch_bug_url: string;
  measurement: string;
  motivation: string;
  name: string;
  ongoing_constraints: string;
  privacy_review_status: string;
  requires_embedder_support: boolean;
  security_review_status: string;
  security_risks: string;
  star_count: number;
  summary: string;
  tag_review: string;
  tag_review_status: string;
  unlisted: boolean;
  wpt: boolean;
  wpt_descr: string;
  is_released: boolean;
  id: number;
  feature_type_int: number;
  intent_stage_int: number;
  created: Created;
  updated: Updated;
  standards: Standards;
  resources: Resources;
  browsers: Browsers;
}
