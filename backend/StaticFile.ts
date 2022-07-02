import { lookup } from "https://deno.land/x/media_types@v3.0.3/mod.ts";

export class StaticFile {
  isStatic: boolean;
  path: string;

  constructor(url: string | URL) {
    const { pathname } = typeof url === "string" ? new URL(url) : url;
    this.isStatic = pathname.startsWith("/static");
    this.path = "." + pathname;
  }

  response(): Promise<Response> {
    return Deno.readFile(this.path)
      .then(
        (result) => {
          return new Response(result, {
            headers: {
              "Content-Type": lookup(this.path) ?? "text/plain",
            },
          });
        },
        () => {
          return new Response("404: File not found.", {
            status: 404,
            headers: {
              "Content-Type": "text/html",
            },
          });
        },
      );
  }
}
