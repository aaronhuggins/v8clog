#! /bin/bash

# The following commands are the minimum required to pull down just the logs so that they can be parsed into YAML format for consumption
REPO="https://chromium.googlesource.com/v8/v8.git"
YAML='- author: %n    name: "%aN"%n    email: "%aE"%n    date: "%aI"%n  commiter:%n    name: "%cN"%n    email: "%cE"%n    date: "%cI"%n  subject: "%s"%n  sanitized_subject_line: "%f"%n  body: |%n%w(0,4,4)%b%n'
AUTHOR='^((?!(V8 Autoroll|v8-ci-autoroll-builder)).*)$'

rev_range () {
  echo -n branch-heads/${1}..branch-heads/${2}
}

git clone --bare --config remote.origin.fetch=+refs/branch-heads/\*:refs/remotes/branch-heads/\* --filter=blob:none $REPO

git --git-dir=v8.git --no-pager log --pretty=format:"${YAML}" --no-merges -P --author="${AUTHOR}" $(rev_range 9.1 9.2) include/v8\*.h #> log.yml

rm -rf ./v8.git
