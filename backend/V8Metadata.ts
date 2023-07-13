import { ChromstatusAPI } from "./chromestatus/API.ts";
import { database } from "./jsondb/JSONDB.ts";
import { IS_DENO_DEPLOY } from "./constants.ts";
import type {
  ChannelDetails,
  MilestoneDetail,
  V8ChannelDetails,
  V8MilestoneDetail,
} from "./chromestatus/ChannelDetails.ts";
import {
  FeatureDetail,
  FeatureDetails,
} from "./chromestatus/FeatureDetails.ts";
import { FeatureData } from "./FeatureData.ts";
import { Commit } from "./GitLog.ts";
import {
  DiffEntry,
  Entity,
  Gitiles,
} from "https://codeberg.org/aaronhuggins/gitiles_client/raw/tag/0.2.0/mod.ts";

export class V8Metadata {
  #categories = [
    "JavaScript",
    "WebAssembly",
  ];

  static start = "7.0";
  static end = "";

  static toVersion(version: string): number {
    const ver = Number.parseFloat(version);

    return ver * 10;
  }

  get toVersion() {
    return V8Metadata.toVersion;
  }

  static toV8Version(version: number | string): string {
    const strVersion = version.toString();
    if ((/\d+\.\d/).test(strVersion)) return strVersion;

    const ver = Number.parseFloat(strVersion);

    return (ver / 10).toFixed(1);
  }

  get toV8Version() {
    return V8Metadata.toV8Version;
  }

  toV8Milestone(detail: MilestoneDetail): V8MilestoneDetail {
    return {
      ...detail,
      mstone: this.toV8Version(detail.mstone),
    };
  }

  toV8ChannelDetails(details: ChannelDetails): V8ChannelDetails {
    return {
      canary: this.toV8Milestone(details.canary),
      canary_asan: this.toV8Milestone(details.canary_asan),
      dev: this.toV8Milestone(details.dev),
      beta: this.toV8Milestone(details.beta),
      stable: this.toV8Milestone(details.stable),
    };
  }

  async toV8Features(
    api: ChromstatusAPI,
    features: FeatureDetails | null | undefined,
  ): Promise<FeatureDetails | null> {
    if (features === null || features === undefined) return null;

    const mapper = async (details?: FeatureDetail[]) => {
      if (!details) return [];
      const verbose: Exclude<Awaited<ReturnType<typeof api.feature>>, null>[] =
        [];
      for (const partial of details) {
        const detail = await api.feature(partial.id);
        if (detail && this.#categories.includes(detail.category)) {
          verbose.push(detail);
        }
      }
      return verbose;
    };

    const [
      browser,
      deprecated,
      enabled,
      devTrial,
      originTrial,
      removed,
    ] = await Promise.all([
      mapper(features["Browser Intervention"]),
      mapper(features.Deprecated),
      mapper(features["Enabled by default"]),
      mapper(features["In developer trial (Behind a flag)"]),
      mapper(features["Origin trial"]),
      mapper(features.Removed),
    ]);

    return {
      "Browser Intervention": browser,
      Deprecated: deprecated,
      "Enabled by default": enabled,
      "In developer trial (Behind a flag)": devTrial,
      "Origin trial": originTrial,
      Removed: removed,
    };
  }

  async channelDetails(): Promise<V8ChannelDetails> {
    const channels = database.get<V8ChannelDetails>("channels");
    let latest = await channels.get("latest");

    if (!IS_DENO_DEPLOY) {
      const api = new ChromstatusAPI();
      const newest = this.toV8ChannelDetails(await api.channels());

      if (newest && newest.stable?.mstone !== latest.stable?.mstone) {
        const record = channels.document("latest", newest);

        await channels.put(record);
        await channels.commit();

        latest = record;
      }
    }

    V8Metadata.end = this.toV8Version(
      this.toVersion(latest.stable?.mstone ?? "0") + 4,
    );

    return latest;
  }

  async milestone(version: string): Promise<V8MilestoneDetail> {
    const channels = database.get<V8MilestoneDetail>("channels");
    const detail = await channels.get(version);

    if (!detail && !IS_DENO_DEPLOY) {
      const ver = this.toVersion(version);
      const api = new ChromstatusAPI();
      const details = await api.channels({ start: ver - 1, end: ver });
      const newDetail = this.toV8Milestone(details[ver]);
      const record = channels.document(newDetail.mstone, newDetail);

      await channels.put(record);
      await channels.commit();

      return newDetail;
    }

    return detail;
  }

  async allMilestoneEntries(): Promise<MilestoneEntry[]> {
    const channels = database.get<V8MilestoneDetail>("channels");
    const features = database.get<FeatureDetails>("features");
    const api_changes = database.get<APIChanges>("api_changes");
    const pairs: MilestoneEntry[] = [];

    for await (const detail of channels.getAll()) {
      if (detail._id === "latest") continue;
      const data = new FeatureData(await features.get(detail._id));
      const apiChanges = await api_changes.getSafely(detail._id);

      pairs.push({ detail, features: data, apiChanges });
    }

    // deno-lint-ignore no-explicit-any
    return pairs.sort((a: any, b: any) => {
      if (Number.parseFloat(a.detail._id) > Number.parseFloat(b.detail._id)) {
        return -1;
      }
      if (Number.parseFloat(a.detail._id) < Number.parseFloat(b.detail._id)) {
        return 1;
      }
      return 0;
    });
  }

  async milestonesInRange(range: MilestoneRange): Promise<V8MilestoneDetail[]> {
    const channels = database.get<V8MilestoneDetail>("channels");
    const details = await channels.query((doc) => {
      if (
        Number.parseFloat(doc._id) >= Number.parseFloat(range.start) &&
        Number.parseFloat(doc._id) <= Number.parseFloat(range.end)
      ) {
        return doc;
      }
    });

    return details.sort((a, b) => {
      if (Number.parseFloat(a._id) > Number.parseFloat(b._id)) return -1;
      if (Number.parseFloat(a._id) < Number.parseFloat(b._id)) return 1;
      return 0;
    });
  }

  async features(version: string): Promise<FeatureData> {
    const features = database.get<FeatureDetails>("features");
    const details = await features.get(version);

    if (!details && !IS_DENO_DEPLOY) {
      const ver = this.toVersion(version);
      const api = new ChromstatusAPI();
      const newDetails = await this.toV8Features(
        api,
        (await api.features({ milestone: ver }))?.features_by_type,
      );

      if (newDetails) {
        const record = features.document(version, newDetails);

        await features.put(record);
        await features.commit();

        return new FeatureData(newDetails);
      }
    }

    return new FeatureData(details);
  }

  async featuresInRange(range: MilestoneRange): Promise<FeatureData[]> {
    const features = database.get<FeatureDetails>("features");
    const details = await features.query((doc) => {
      if (
        Number.parseFloat(doc._id) >= Number.parseFloat(range.start) &&
        Number.parseFloat(doc._id) <= Number.parseFloat(range.end)
      ) {
        return doc;
      }
    });

    return details.sort((a, b) => {
      if (Number.parseFloat(a._id) > Number.parseFloat(b._id)) return -1;
      if (Number.parseFloat(a._id) < Number.parseFloat(b._id)) return 1;
      return 0;
    }).map((val) => new FeatureData(val));
  }

  async apiChanges(version: string): Promise<APIChanges | undefined> {
    const api_changes = database.get<APIChanges>("api_changes");

    return await api_changes.getSafely(version);
  }

  async apiChangesInRange(range: MilestoneRange): Promise<APIChanges[]> {
    const api_changes = database.get<APIChanges>("api_changes");
    const details = await api_changes.query((doc) => {
      if (
        Number.parseFloat(doc._id) >= Number.parseFloat(range.start) &&
        Number.parseFloat(doc._id) <= Number.parseFloat(range.end)
      ) {
        return doc;
      }
    });

    return details.sort((a, b) => {
      if (Number.parseFloat(a._id) > Number.parseFloat(b._id)) return -1;
      if (Number.parseFloat(a._id) < Number.parseFloat(b._id)) return 1;
      return 0;
    });
  }

  async allDetailsInRange(range: MilestoneRange): Promise<MilestoneEntry[]> {
    const details = await this.milestonesInRange(range);
    const features = await this.featuresInRange(range);
    const api_changes = await this.apiChangesInRange(range);
    const result: MilestoneEntry[] = [];

    for (const [index, detail] of details.entries()) {
      result.push({
        detail,
        features: features[index],
        apiChanges: api_changes[index],
      });
    }

    return result;
  }

  async seedGitLog(start: number, end: number) {
    const url = "https://chromium.googlesource.com/v8/v8.git";
    const client = new Gitiles({ url, rate: 3 });
    const api_changes = database.get("api_changes");
    const revSpec = (startVer: string, endVer: string) =>
      `branch-heads/${startVer}..branch-heads/${endVer}`;
    const isAuthor = (author: Entity) =>
      !(/^(V8 Autoroll|v8-ci-autoroll-builder).*$/gui).test(author.name);
    const isV8 = (diffs: DiffEntry[]) =>
      diffs.some((diff) => {
        return (/^include\/v8.*\.h$/gui).test(diff.old_path) ||
          (/^include\/v8.*\.h$/gui).test(diff.new_path);
      });
    const splitAt = (str: string, char: string) => {
      const index = str.indexOf(char);
      return [str.slice(0, index), str.slice(index + 1)] as const;
    };
    const commits = async (startVer: string, endVer: string) => {
      const ref = revSpec(startVer, endVer);
      const commits: Commit[] = [];
      const logs = client.getLogs(ref, {
        limit: 200,
        treeDiff: true,
        noMerges: true,
      });
      for await (const log of logs) {
        if (
          isAuthor(log.author) &&
          isV8(log.tree_diff)
        ) {
          const [subject, body] = splitAt(log.message, "\n");
          commits.push({
            author: {
              email: log.author.email,
              name: log.author.name,
              date: new Date(log.author.time).toISOString(),
            },
            committer: {
              email: log.committer.email,
              name: log.committer.name,
              date: new Date(log.committer.time).toISOString(),
            },
            subject,
            body,
          });
        }
      }
      return [endVer, commits] as const;
    };
    const promises = [];

    for (let i = start - 1; i < end; i++) {
      const startVer = this.toV8Version(i);
      const endVer = this.toV8Version(i + 1);
      promises.push(
        commits(startVer, endVer).then(async ([key, commits]) => {
          await api_changes.put(api_changes.document(key, { commits }));
        }),
      );
    }

    await Promise.all(promises);
  }

  async seedChromestatus(
    api: ChromstatusAPI,
    releases: ChannelDetails,
    historical = 70,
  ) {
    const channels = database.get("channels");
    const features = database.get("features");
    const { mstone: stable } = releases.stable;
    const upcoming = stable + 4;
    const milestones = await api.channels({ start: historical, end: upcoming });
    const entries = Object.entries(milestones)
      .map<[number, MilestoneDetail]>((
        [milestone, details],
      ) => [Number.parseFloat(milestone), details])
      .sort(([a], [b]) => {
        if (a > b) return 1;
        if (a < b) return -1;
        return 0;
      });

    for (const [milestone, detail] of entries) {
      const version = this.toV8Version(milestone);
      const feature = await api.features({ milestone });
      const v8detail = this.toV8Milestone(detail);
      const v8feature = await this.toV8Features(api, feature?.features_by_type);

      channels.put(channels.document(version, v8detail));
      features.put(features.document(version, v8feature ?? {}));
      await new Promise<void>((resolve) => setTimeout(() => resolve(), 300));
    }

    await channels.put(
      channels.document("latest", this.toV8ChannelDetails(releases)),
    );
  }

  async seed(historical = 70) {
    const api = new ChromstatusAPI();
    const releases = await api.channels();

    await Promise.all([
      (() => this.seedChromestatus(api, releases, historical))(),
      (() => this.seedGitLog(historical, releases.stable.mstone))(),
    ]);

    await database.commit();
  }
}

export interface APIChanges {
  commits: Commit[];
}

export interface MilestoneRange {
  start: string;
  end: string;
}

export interface MilestoneEntry {
  detail: V8MilestoneDetail;
  features: FeatureData;
  apiChanges?: APIChanges;
}
