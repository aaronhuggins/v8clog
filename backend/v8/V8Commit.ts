import {
  CommitDetail,
  Entity,
} from "https://codeberg.org/aaronhuggins/gitiles_client/raw/tag/0.3.0/mod.ts";

const NO_COMMITS = "NO_COMMITS" as const;

export class V8Commit
  implements Omit<CommitDetail, "tree" | "parents" | "tree_diff"> {
  static none(milestone: number) {
    const commit = new V8Commit();
    commit.milestone = milestone;
    commit.message = NO_COMMITS;
    return commit;
  }

  static isNone(commit: V8Commit): boolean {
    return commit.message === NO_COMMITS;
  }

  author!: Entity;
  commit!: string;
  committer!: Entity;
  message!: string;
  milestone!: number;

  constructor(commitLike?: Omit<V8Commit, "subject" | "body">) {
    if (commitLike) {
      this.author = { ...commitLike.author };
      this.commit = commitLike.commit;
      this.committer = { ...commitLike.committer };
      this.message = commitLike.message;
      this.milestone = commitLike.milestone;
    }
  }

  get subject(): string {
    const index = this.message.indexOf("\n");
    return this.message.slice(0, index).trim();
  }

  get body(): string {
    const index = this.message.indexOf("\n");
    return this.message.slice(index, index + 1).trim();
  }
}
