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

## Deployment Strategy

- Build V8 database once every 8 hours (this should catch things like bugfixes, emrgency releases, etc.)
- Deploy all assets statically to Deno Deploy
- Serve assets via application on demand
