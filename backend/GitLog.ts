import { parse } from "https://deno.land/std@0.146.0/encoding/yaml.ts";

export class GitLog {
  #format =
    '- author:%n    name: "%aN"%n    email: "%aE"%n    date: "%aI"%n  commiter:%n    name: "%cN"%n    email: "%cE"%n    date: "%cI"%n  subject: |-%n%w(0,4,4)%s%w(0,0,0)%n  sanitized_subject_line: %f%n  body: |%n%w(0,4,4)>%b%n';
  #repo: string;
  #dir: string;

  constructor(repo: string) {
    this.#repo = repo;
    const split = repo.split("/");
    this.#dir = split[split.length - 1];
  }

  /** Perform a bare clone filtering out blobs. */
  async clone(config: [key: string, value: string][] = []): Promise<string> {
    const decoder = new TextDecoder();
    const configs: string[] = [];

    for (const [key, value] of config) {
      configs.push("--config", `${key}=${value}`);
    }

    const cmd = Deno.run({
      cmd: [
        "git",
        "clone",
        "--bare",
        "--filter=blob:none",
        ...configs,
        this.#repo,
      ],
      stdout: "piped",
      stderr: "piped",
    });
    const [status, stdout, stderr] = await Promise.all([
      cmd.status(),
      cmd.output(),
      cmd.stderrOutput(),
    ]);

    cmd.close();

    if (status.code > 0) throw decoder.decode(stderr);

    return stdout.byteLength === 0
      ? decoder.decode(stderr)
      : decoder.decode(stdout);
  }

  /** Get the log according to the revision spec */
  async commits(
    { author, revision, files = [] }: LogOptions = {},
  ): Promise<Commit[]> {
    const decoder = new TextDecoder();
    const cmd = Deno.run({
      cmd: [
        "git",
        `--git-dir=${this.#dir}`,
        "--no-pager",
        "log",
        `--pretty=format:${this.#format}`,
        "--no-merges",
        "--perl-regexp",
        ...(author ? [`--author=${author}`] : []),
        ...(revision ? [revision] : []),
        ...(files.length > 0 ? ["--"] : []),
        ...files,
      ],
      stdout: "piped",
      stderr: "piped",
    });
    const [status, yaml = new Uint8Array(0), stderr = new Uint8Array(0)] =
      await Promise.all([
        cmd.status(),
        cmd.output(),
        cmd.stderrOutput(),
      ]);

    cmd.close();

    if (status.code > 0) throw decoder.decode(stderr);

    return ((parse(decoder.decode(yaml)) ?? []) as Commit[])
      .map((commit) => ({
        ...commit,
        body: commit.body.substring(1),
      }));
  }

  async destroy() {
    await Deno.remove(this.#dir, { recursive: true });
  }
}

export interface LogOptions {
  author?: string;
  revision?: string;
  files?: string[];
}

export interface Commit {
  author: Entity;
  commiter: Entity;
  subject: string;
  sanitized_subject_line: string;
  body: string;
}

export interface Entity {
  name: string;
  email: string;
  date: string;
}
