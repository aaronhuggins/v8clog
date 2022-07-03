import { ChromstatusAPI } from "./chromestatus/API.ts";
import { database } from "./JSONDB.ts";
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
import { Commit, GitLog } from "./GitLog.ts";

export class V8Metadata {
  #categories = [
    "JavaScript",
    "WebAssembly",
  ];

  toVersion(version: string): number {
    const ver = Number.parseFloat(version);

    return ver * 10;
  }

  toV8Version(version: number | string): string {
    const strVersion = version.toString();
    if ((/\d+\.\d/).test(strVersion)) return strVersion;

    const ver = Number.parseFloat(strVersion);

    return (ver / 10).toFixed(1);
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

  toV8Features(features: FeatureDetails | null): FeatureDetails | null {
    if (features === null) return null;

    const mapper = (f: FeatureDetail) => this.#categories.includes(f.category);

    return {
      "Browser Intervention": features["Browser Intervention"].filter(mapper),
      Deprecated: features.Deprecated.filter(mapper),
      "Enabled by default": features["Enabled by default"].filter(mapper),
      "In developer trial (Behind a flag)":
        features["In developer trial (Behind a flag)"].filter(mapper),
      "Origin trial": features["Origin trial"].filter(mapper),
      Removed: features.Removed.filter(mapper),
    };
  }

  async channelDetails(): Promise<V8ChannelDetails> {
    const channels = database.get<V8ChannelDetails>("channels");
    let latest = await channels.get("latest");

    if (!IS_DENO_DEPLOY) {
      const api = new ChromstatusAPI();
      const newest = this.toV8ChannelDetails(await api.channels());

      if (newest && newest.stable.mstone !== latest.stable.mstone) {
        const record = channels.document("latest", newest);

        await channels.put(record);
        await channels.commit();

        latest = record;
      }
    }

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
      const apiChanges = await api_changes.getSafely(detail._id)

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
      const newDetails = this.toV8Features(
        await api.features({ milestone: ver }),
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
    })
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
        apiChanges: api_changes[index]
      });
    }

    return result;
  }

  async seedGitLog(start: number, end: number) {
    const gitlog = new GitLog("https://chromium.googlesource.com/v8/v8.git");
    const api_changes = database.get("api_changes");

    await gitlog.clone([[
      "remote.origin.fetch",
      "+refs/branch-heads/*:refs/remotes/branch-heads/*",
    ]]);

    const author = "^((?!(V8 Autoroll|v8-ci-autoroll-builder)).*)$";
    const files = ["include/v8*.h"];
    const revSpec = (startVer: string, endVer: string) =>
      `branch-heads/${startVer}..branch-heads/${endVer}`;
    const commits = async (
      startVer: string,
      endVer: string,
    ): Promise<[string, Commit[]]> => [
      endVer,
      await gitlog.commits({
        author,
        revision: revSpec(startVer, endVer),
        files,
      }),
    ];
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

    await gitlog.destroy();
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
      const v8feature = this.toV8Features(feature);

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
  commits: Commit[]
}

export interface MilestoneRange {
  start: string;
  end: string;
}

export interface MilestoneEntry {
  detail: V8MilestoneDetail;
  features: FeatureData;
  apiChanges?: APIChanges
}
