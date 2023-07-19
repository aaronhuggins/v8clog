# V8 Clog

A [webapp front-end](https://v8clog.deno.dev) for the V8 Changelog. Because the
blog release posts are discontinued and changelogs aren't great reading for
humans.

## Features

- Most recent releases (Home)
- Release archive (Clog)
- Release posts (ClogEntry)
- RSS feed (RSS)
- API Changes (Clog entries and RSS feed)
- Tagged posts
- Tag archive (Tag)
- Tag RSS feeds

## Roadmap

- Next 12 months
  - Linkbacks to the V8.dev blog and Chrome Status from Clog posts
  - Consumer for performance improvement blog posts
  - Renderer for performance blog post linkbacks

## Deployment Strategy

- Build V8 database periodically
- Push to Github repository and land in Deno Deploy
- Serve assets via application on demand
