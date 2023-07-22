import { RequestMeasure } from "./RequestMeasure.ts";
import { lookup } from "./deps.ts";

const encoder = new TextEncoder();
const errorText = encoder.encode("404: File not found.");

export class StaticFile {
  isStatic: boolean;
  path: string;
  status?: number;
  content?: Uint8Array;
  contentType?: string;

  constructor(url: string | URL) {
    const { pathname } = typeof url === "string" ? new URL(url) : url;
    this.isStatic = pathname.startsWith("/static");
    this.path = "." + pathname;
  }

  async response(measures?: RequestMeasure[]): Promise<Response> {
    try {
      this.content = this.content ?? await Deno.readFile(this.path);
      this.contentType = this.contentType ?? lookup(this.path) ?? "text/plain";
      this.status = this.status ?? 200;
    } catch (_err) {
      this.content = errorText;
      this.contentType = "text/html";
      this.status = 404;
    }

    return new Response(this.content, {
      status: 200,
      headers: {
        "Content-Type": this.contentType,
        "Server-Timing": measures?.map((measure) =>
          measure.serverTime()
        ).join(", ") ?? "noMetrics",
      },
    });
  }
}
