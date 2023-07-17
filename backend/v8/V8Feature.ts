export class V8Feature {
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
