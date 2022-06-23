import { ChromstatusAPI } from "./chromestatus/API.ts"
import { database } from "./Databases.ts"
import { IS_DENO_DEPLOY } from "./constants.ts"
import type { ChannelDetails, MilestoneDetail, V8ChannelDetails, V8MilestoneDetail } from "./chromestatus/ChannelDetails.ts"
import { FeatureDetail, FeatureDetails } from "./chromestatus/FeatureDetails.ts";

export class V8Metadata {
  #categories = [
    "JavaScript",
    "WebAssembly"
  ]

  toVersion (version: string): number {
    const ver = Number.parseFloat(version)

    return ver * 10
  }

  toV8Version (version: number | string): string {
    const strVersion = version.toString()
    if ((/\d+\.\d/).test(strVersion)) return strVersion

    const ver = Number.parseFloat(strVersion)

    return (ver / 10).toFixed(1)
  }

  toV8Milestone (detail: MilestoneDetail): V8MilestoneDetail {
    return {
      ...detail,
      mstone: this.toV8Version(detail.mstone)
    }
  }

  toV8ChannelDetails (details: ChannelDetails): V8ChannelDetails {
    return {
      canary: this.toV8Milestone(details.canary),
      canary_asan: this.toV8Milestone(details.canary_asan),
      dev: this.toV8Milestone(details.dev),
      beta: this.toV8Milestone(details.beta),
      stable: this.toV8Milestone(details.stable)
    }
  }

  toV8Features (features: FeatureDetails | null): FeatureDetails | null {
    if (features === null) return null

    const mapper = (f: FeatureDetail) => this.#categories.includes(f.category)

    return {
      "Browser Intervention": features["Browser Intervention"].filter(mapper),
      Deprecated: features.Deprecated.filter(mapper),
      "Enabled by default": features["Enabled by default"].filter(mapper),
      "In developer trial (Behind a flag)": features["In developer trial (Behind a flag)"].filter(mapper),
      "Origin trial": features["Origin trial"].filter(mapper),
      Removed: features.Removed.filter(mapper)
    }
  }

  async channelDetails (): Promise<V8ChannelDetails> {
    const channels = database.collection.get("channels")
    let latest = await channels.get<V8ChannelDetails>("latest")

    if (!IS_DENO_DEPLOY) {
      const api = new ChromstatusAPI()
      const newest = this.toV8ChannelDetails(await api.channels())

      if (newest && newest.stable.mstone !== latest.stable.mstone) {
        const record = database.record.create("latest", newest)

        await channels.upsertAndReplace(record)

        latest = record
      }
    }

    return latest
  }

  async milestone (version: string): Promise<V8MilestoneDetail> {
    const channels = database.collection.get("channels")
    const detail = await channels.get<V8MilestoneDetail>(version)

    if (!detail && !IS_DENO_DEPLOY) {
      const ver = this.toVersion(version)
      const api = new ChromstatusAPI()
      const details = await api.channels({ start: ver - 1, end: ver })
      const newDetail = this.toV8Milestone(details[ver])
      const record = database.record.create(newDetail.mstone, newDetail)

      await channels.put(record)

      return newDetail
    }

    return detail
  }

  async milestonesInRange (range: MilestoneRange): Promise<MilestoneDetail[]> {
    const channels = database.collection.get<MilestoneDetail>("channels")
    const details = await channels.find({
      selector: {
        _id: {
          $gte: range.start,
          $lte: range.end
        }
      }
    })

    return details.docs
  }

  async features (version: string): Promise<FeatureDetails> {
    const features = database.collection.get("features")
    const details = await features.get<FeatureDetails>(version)

    if (!details && !IS_DENO_DEPLOY) {
      const ver = this.toVersion(version)
      const api = new ChromstatusAPI()
      const newDetails = this.toV8Features(await api.features({ milestone: ver }))

      if (newDetails) {
        const record = database.record.create(version, newDetails)

        await features.put(record)
      }
    }

    return details
  }

  async featuresInRange (range: MilestoneRange): Promise<FeatureDetails[]> {
    const features = database.collection.get<FeatureDetails>("features")
    const details = await features.find({
      selector: {
        _id: {
          $gte: range.start,
          $lte: range.end
        }
      }
    })

    return details.docs
  }

  async seed (previous = 40) {
    const api = new ChromstatusAPI()
    const channels = database.collection.get("channels")
    const features = database.collection.get("features")
    const releases = await api.channels()
    const { mstone: stable } = releases.stable
    const upcoming = stable + 4
    const historical = stable - previous
    const milestones = await api.channels({ start: historical, end: upcoming })
    const entries = Object.entries(milestones)
      .map<[number, MilestoneDetail]>(([milestone, details]) => [Number.parseFloat(milestone), details])
      .sort(([a], [b]) => {
        if (a > b) return 1
        if (a < b) return -1
        return 0
      })

    for (const [milestone, detail] of entries) {
      const version = this.toV8Version(milestone)
      const feature = await api.features({ milestone })
      const v8detail = this.toV8Milestone(detail)
      const v8feature = this.toV8Features(feature)

      channels.upsertAndReplace(database.record.create(version, v8detail))
      features.upsertAndReplace(database.record.create(version, v8feature))
      await new Promise<void>(resolve => setTimeout(() => resolve(), 300))
    }

    await channels.upsertAndReplace(database.record.create("latest", releases))
  }
}

export interface MilestoneRange {
  start: string;
  end: string
}
