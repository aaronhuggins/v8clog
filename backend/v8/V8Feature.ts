const NO_FEATURES = "NO_FEATURES" as const;

export class V8Feature {
  static none(milestone: number) {
    const feat = new V8Feature();
    feat.milestone = milestone;
    feat.name = NO_FEATURES;
    return feat;
  }

  static isNone(feature: V8Feature): boolean {
    return feature.name === NO_FEATURES;
  }

  category!: "JavaScript" | "WebAssembly";
  flag_name!: string;
  id!: number;
  milestone!: number;
  name!: string;
  summary!: string;

  constructor(featureLike?: V8Feature) {
    if (featureLike) {
      this.category = featureLike.category;
      this.flag_name = featureLike.flag_name;
      this.id = featureLike.id;
      this.milestone = featureLike.milestone;
      this.name = featureLike.name;
      this.summary = featureLike.summary;
    }
  }
}
