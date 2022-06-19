# V8 Clog

A webapp front-end for the V8 Changelog. Because the blog is discontinued and
changelogs aren't great reading for humans.

## Features

None yet

## To-do

- Parse and display the changelog
- Break-out changes by
  - Release schedule and current version
  - New JavaScript or WebAssembly features
  - Notable performance improvements
  - API changes
- Detect and proxy new version changelogs
- Cache parsed content
- Display changes as pretty and beautiful human-readable posts
- Provide an RSS feed over the underlying data, with links back to the Clog

## Deployment Strategy

- Build V8 database once every 8 hours (this should catch things like bugfixes, emrgency releases, etc.)
- Deploy all assets statically to Deno Deploy
- Serve assets via application on demand