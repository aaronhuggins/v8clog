// deno-lint-ignore-file no-explicit-any
import { ChromestatusFeatureDetail } from "./ChromestatusFeatureDetail.ts";

export class ChromstatusAPI {
  #base = "https://chromestatus.com/api"
  #version = "v0"
  #XSSI_PREFIX = ")]}'\n"

  #url (path: string, params?: any) {
    if (params) {
      const paramStr = new URLSearchParams(params).toString()
      return new URL(`${path}?${paramStr}`, `${this.#base}/${this.#version}/`).toString()
    }

    return new URL(path, `${this.#base}/${this.#version}`).toString()
  }

  #safeParse (text: string) {
    return new Promise<any>((resolve, reject) => {
      if (!text) resolve(null)
      if (text.startsWith(this.#XSSI_PREFIX)) {
        return resolve(JSON.parse(text.substring(this.#XSSI_PREFIX.length)))
      }
  
      try {
        resolve(JSON.parse(text))
      } catch (error) {
        reject(error)
      }
    })
  }

  async #request (path: string, expectStatus: number, params?: any, method = "GET") {
    const resp = await fetch(this.#url(path, params), { method })

    if (resp.status === expectStatus) {
      return await resp.text().then((text) => this.#safeParse(text))
    }

    console.log(resp.status, resp.statusText)

    return null
  }

  async channels (params?: ChannelsParams) {
    return await this.#request("channels", 200, params)
  }

  async features (params: FeaturesParams): Promise<FeatureDetails | null> {
    return await this.#request("features", 200, params)
  }
}

interface ChannelsParams {
  start: number
  end: number
}

interface FeaturesParams {
  milestone: number
}

interface FeatureDetails {
  "Enabled by default": ChromestatusFeatureDetail[]
  Deprecated: ChromestatusFeatureDetail[]
  Removed: ChromestatusFeatureDetail[]
  "Browser Intervention": ChromestatusFeatureDetail[]
  "Origin trial": ChromestatusFeatureDetail[]
  "In developer trial (Behind a flag)": ChromestatusFeatureDetail[]
}
