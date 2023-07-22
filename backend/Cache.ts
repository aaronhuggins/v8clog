/**
 * A dead-simple, no bells and whistles, very, very naive Cache API
 * implementation based on URL keys only.
 */
export class WebApiCache {
  #store = new Map<string, [Request, Response]>();
  #isUrl(input: URL | RequestInfo): input is URL | string {
    return typeof input === "string" || "href" in input;
  }
  #createRequest(input: URL | RequestInfo): Request {
    return this.#isUrl(input) ? new Request(input) : input;
  }
  #createKey(input: URL | RequestInfo): string {
    const request = this.#createRequest(input);
    const key = `${request.method}${request.url}`;
    return key;
  }
  #matchRequests(
    req1: Request,
    req2: Request,
    options?: CacheQueryOptions,
  ): boolean {
    const url1 = new URL(req1.url);
    const url2 = new URL(req2.url);
    if (options?.ignoreSearch) {
      url1.search = "";
      url2.search = "";
    }
    const urlMatch = url1.toString() === url2.toString();
    return options?.ignoreMethod
      ? urlMatch
      : urlMatch && req1.method === req2.method;
  }
  *#entries(
    input?: URL | RequestInfo,
    options?: CacheQueryOptions | undefined,
  ) {
    const request = input ? this.#createRequest(input) : undefined;
    for (const value of this.#store.values()) {
      if (!request || this.#matchRequests(request, value[0], options)) {
        yield value;
      }
    }
  }
  async add(input: URL | RequestInfo): Promise<void> {
    const request = this.#createRequest(input);
    const response = await fetch(request);
    if (!response.ok) {
      throw new TypeError("bad response status");
    }
    this.#store.set(this.#createKey(request), [request, response]);
  }
  async addAll(requests: RequestInfo[]): Promise<void> {
    await Promise.all(requests.map((request) => this.add(request)));
  }
  delete(
    input: URL | RequestInfo,
    options?: CacheQueryOptions | undefined,
  ): Promise<boolean> {
    return new Promise<boolean>((resolve) => {
      const request = this.#createRequest(input);
      if (options && Object.keys(options).length > 0) {
        let isDeleted = false;
        for (const [req] of this.#entries(input, options)) {
          const key = this.#createKey(req);
          if (!isDeleted && this.#store.delete(key)) {
            isDeleted = true;
          }
        }
        resolve(isDeleted);
      } else {
        const key = this.#createKey(request);
        resolve(this.#store.delete(key));
      }
    });
  }
  keys(
    input?: URL | RequestInfo | undefined,
    options?: CacheQueryOptions | undefined,
  ): Promise<readonly Request[]> {
    return new Promise<readonly Request[]>((resolve) => {
      const results: Request[] = [];
      for (const [req] of this.#entries(input, options)) {
        results.push(req);
      }
      return resolve(Object.freeze(results));
    });
  }
  match(
    input: URL | RequestInfo,
    options?: CacheQueryOptions | undefined,
  ): Promise<Response | undefined> {
    return new Promise<Response | undefined>((resolve) => {
      if (options) {
        for (const [_, res] of this.#entries(input, options)) {
          resolve(res);
          return;
        }
        resolve(undefined);
      } else {
        const key = this.#createKey(input);
        resolve(this.#store.get(key)?.[1]);
      }
    });
  }
  matchAll(
    input?: URL | RequestInfo | undefined,
    options?: CacheQueryOptions | undefined,
  ): Promise<readonly Response[]> {
    return new Promise<readonly Response[]>((resolve) => {
      const results: Response[] = [];
      for (const [_, res] of this.#entries(input, options)) {
        results.push(res);
      }
      return resolve(Object.freeze(results));
    });
  }
  put(input: URL | RequestInfo, response: Response): Promise<void> {
    return new Promise<void>((resolve) => {
      const request = this.#createRequest(input);
      const key = this.#createKey(request);
      this.#store.set(key, [request, response]);
      resolve();
    });
  }
}
