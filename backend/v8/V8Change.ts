import { CommitDetail, Entity } from "../deps.ts";

const NO_COMMITS = "NO_COMMITS" as const;

export class V8Change
  implements Omit<CommitDetail, "tree" | "message" | "parents" | "tree_diff"> {
  static none(milestone: number) {
    const commit = new V8Change();
    commit.milestone = milestone;
    commit.subject = NO_COMMITS;
    return commit;
  }

  static isNone(commit: V8Change): boolean {
    return commit.subject === NO_COMMITS;
  }

  author!: Entity;
  commit!: string;
  committer!: Entity;
  subject!: string;
  milestone!: number;

  constructor(
    commitLike?: Omit<V8Change, "subject"> & {
      subject?: string;
      message?: string;
    },
  ) {
    if (commitLike) {
      this.author = { ...commitLike.author };
      this.commit = commitLike.commit;
      this.committer = { ...commitLike.committer };
      this.subject = commitLike.subject ??
        commitLike.message!.split("\n")[0].trim();
      this.milestone = commitLike.milestone;
    }
  }
}
