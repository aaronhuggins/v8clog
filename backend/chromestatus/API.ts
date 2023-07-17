// deno-lint-ignore-file no-explicit-any
import { ChannelDetails, MilestoneDetails } from "./ChannelDetails.ts";
import { FeatureDetail, FeatureDetailResponse } from "./FeatureDetails.ts";

export class ChromestatusAPI {
  #base = "https://chromestatus.com/api";
  #version = "v0";
  #XSSI_PREFIX = ")]}'\n";

  #url(path: string, params?: any) {
    if (params) {
      const paramStr = new URLSearchParams(params).toString();
      return new URL(`${path}?${paramStr}`, `${this.#base}/${this.#version}/`)
        .toString();
    }

    return new URL(path, `${this.#base}/${this.#version}/`).toString();
  }

  #safeParse(text: string) {
    return new Promise<any>((resolve, reject) => {
      if (!text) resolve(null);
      if (text.startsWith(this.#XSSI_PREFIX)) {
        return resolve(JSON.parse(text.substring(this.#XSSI_PREFIX.length)));
      }

      try {
        resolve(JSON.parse(text));
      } catch (error) {
        reject(error);
      }
    });
  }

  async #request(
    path: string,
    expectStatus: number,
    params?: any,
    method = "GET",
  ) {
    const resp = await fetch(this.#url(path, params), { method });

    if (resp.status === expectStatus) {
      return await resp.text().then((text) => this.#safeParse(text));
    }

    return null;
  }

  async channels(): Promise<ChannelDetails>;
  async channels(params: ChannelsParams): Promise<MilestoneDetails>;
  async channels(params?: ChannelsParams) {
    return await this.#request("channels", 200, params);
  }

  async features(
    params: FeaturesParams,
  ): Promise<FeatureDetailResponse | null> {
    return await this.#request("features", 200, params);
  }

  async feature(id: number): Promise<FeatureDetail | null> {
    return await this.#request(`features/${id}`, 200);
  }

  async featuresByQuery(
    query: string,
    limit = 500,
  ): Promise<{ total_count: number; features: FeatureDetail[] }> {
    return await this.#request("features", 200, { q: query, num: limit });
  }
}

export interface ChannelsParams {
  start: number;
  end: number;
}

export interface FeaturesParams {
  milestone: number;
}
