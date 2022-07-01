# V8 Clog

A [webapp front-end](https://v8clog.deno.dev) for the V8 Changelog. Because the blog release posts are discontinued and
changelogs aren't great reading for humans.

## Features

- Most recent releases (Home)
- Release archive (Clog)
- Release posts (ClogEntry)
- RSS feed (RSS)

## To-do

- Automate the release deployment on a regular interval via Github actions

## Roadmap

- Next 4 weeks
  - `/tags/:tagname` route for filtering clog posts
  - `/tags/:tagname/rss.xml` route for filtered rss feeds
- Next 8 weeks
  - Consumer for API changes from the official V8 git log
  - Renderer for API changes
  - API changes to RSS feeds
  - Tag for API changes
- Next 12 weeks
  - Linkbacks to the V8.dev blog and Chrome Status from Clog posts
  - Consumer for performance improvement blog posts
  - Renderer for performance blog post linkbacks


## Deployment Strategy

- Build V8 database once every 8 hours (this should catch things like bugfixes, emrgency releases, etc.)
- Deploy all assets statically to Deno Deploy
- Serve assets via application on demand
