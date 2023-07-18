export class V8Tag {
  name: string;
  milestones: number[];

  constructor(tag: string | V8Tag) {
    if (typeof tag === "string") {
      this.name = tag;
      this.milestones = [];
    } else {
      this.name = tag.name;
      this.milestones = tag.milestones;
    }
  }

  add(...milestones: number[]) {
    this.milestones = Array.from(
      new Set([
        ...this.milestones,
        ...milestones,
      ]),
    );
  }
}
