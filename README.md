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

## Roadmap

- Next 6 weeks
  - `/tags/:tagname` route for filtering clog posts
  - `/tags/:tagname/rss.xml` route for filtered rss feeds
  - Tag for API changes
- Next 12 weeks
  - Linkbacks to the V8.dev blog and Chrome Status from Clog posts
  - Consumer for performance improvement blog posts
  - Renderer for performance blog post linkbacks

## Deployment Strategy

- Build V8 database once every 24 hours
- Deploy all assets statically to Deno Deploy
- Serve assets via application on demand
