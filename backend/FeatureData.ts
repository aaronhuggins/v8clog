import type {
  FeatureDetail,
  FeatureDetails,
} from "./chromestatus/FeatureDetails.ts";

export class FeatureData {
  details: FeatureDetails;

  constructor(details: FeatureDetails) {
    this.details = details;
  }

  get tags(): string[] {
    const tags = new Set<string>();
    const features = [
      ...this.enabled,
      ...this.deprecated,
      ...this.removed,
      ...this.browserIntervention,
      ...this.originTrial,
      ...this.developerTrial,
    ];

    for (const { category } of features) {
      if (category) tags.add(category);
    }

    return Array.from(tags).sort();
  }

  get hasFeatures(): boolean {
    return this.hasEnabled ||
      this.hasDeprecated ||
      this.hasRemoved ||
      this.hasBrowserIntervention ||
      this.hasOriginTrial ||
      this.hasDeveloperTrial;
  }

  get enabled(): FeatureDetail[] {
    return this.details["Enabled by default"] ?? [];
  }

  get deprecated(): FeatureDetail[] {
    return this.details.Deprecated ?? [];
  }

  get removed(): FeatureDetail[] {
    return this.details.Removed ?? [];
  }

  get browserIntervention(): FeatureDetail[] {
    return this.details["Browser Intervention"] ?? [];
  }

  get originTrial(): FeatureDetail[] {
    return this.details["Origin trial"] ?? [];
  }

  get developerTrial(): FeatureDetail[] {
    return this.details["In developer trial (Behind a flag)"] ?? [];
  }

  get hasEnabled(): boolean {
    return this.enabled.length > 0;
  }

  get hasDeprecated(): boolean {
    return this.deprecated.length > 0;
  }

  get hasRemoved(): boolean {
    return this.removed.length > 0;
  }

  get hasBrowserIntervention(): boolean {
    return this.browserIntervention.length > 0;
  }

  get hasOriginTrial(): boolean {
    return this.originTrial.length > 0;
  }

  get hasDeveloperTrial(): boolean {
    return this.developerTrial.length > 0;
  }
}
