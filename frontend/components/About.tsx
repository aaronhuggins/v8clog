/** @jsx h */
/// <reference no-default-lib="true"/>
/// <reference lib="dom" />
/// <reference lib="dom.asynciterable" />
/// <reference lib="deno.ns" />

import { h } from "../jsx.ts";
import { Meta } from "./Meta.tsx";

export function About({ origin }: { origin: string }) {
  const name = "About the Clog";
  return (
    <div class="uk-container">
      <Meta origin={origin} name={name} path="/about" />
      <div class="uk-card uk-card-body uk-card-default uk-background-secondary uk-light">
        <h3 class="uk-light">{name}</h3>
        <p class="uk-text-meta uk-margin-remove-top">
          Author: <a href="https://github.com/aaronhuggins">Aaron Huggins</a>
        </p>
        <p class="uk-light">
          On June 17, the V8 team at Google{" "}
          <a href="https://v8.dev/blog/discontinuing-release-posts">
            announced they would be discontinuing release posts
          </a>{" "}
          via their blog and Twitter. The recommended way of getting at
          changelogs for V8? Look at the{" "}
          <a href="https://chromestatus.com/roadmap">Chrome Status website</a>
          {" "}
          for all Chrome changes, and check out the git repository logs. For
          reasons that I feel are obvious, not everyone who uses the V8
          JavaScript engine cares about Google Chrome.
        </p>
        <p class="uk-light">
          <blockquote class="twitter-tweet">
            <p lang="en" dir="ltr">
              🛑 We are discontinuing release blog posts for V8 releases. But
              don&#39;t worry, you can still get all the information you&#39;re
              used to about new releases! Read on for where to look:{" "}
              <a href="https://t.co/JeQreN6Aaa">https://t.co/JeQreN6Aaa</a>
            </p>&mdash; V8 (@v8js){" "}
            <a href="https://twitter.com/v8js/status/1537857497825824768?ref_src=twsrc%5Etfw">
              June 17, 2022
            </a>
          </blockquote>{" "}
          <script
            async
            src="https://platform.twitter.com/widgets.js"
            charset="utf-8"
          >
          </script>
        </p>
        <p class="uk-light">
          Naturally, there are a lot of projects which benefit from V8 and which
          don't touch Google Chrome itself; Node.js, Deno, Cloudflare, to name a
          few. When looking at runtimes on top of the engine, the biggest
          concern I have is "what is the latest changes to V8 that is included
          with this version?" Knowing that prepares me, at least partly, to
          understand the impact to my code running on top of the engine.
        </p>
        <p class="uk-light">
          <blockquote class="twitter-tweet">
            <p lang="en" dir="ltr">
              I am that interested, but I do *not* want to have to wade through
              all the other changes for Chromium just for V8.<br />
              <br />Hopefully, I have time next week to look at whipping up a
              changelog scraper... Might end up being my first Deno Deploy app.
            </p>&mdash; Aaron Huggins 🙏 🇺🇦 (@AaronHugginsDev){" "}
            <a href="https://twitter.com/AaronHugginsDev/status/1537888710317834242?ref_src=twsrc%5Etfw">
              June 17, 2022
            </a>
          </blockquote>{" "}
          <script
            async
            src="https://platform.twitter.com/widgets.js"
            charset="utf-8"
          >
          </script>
        </p>
        <p class="uk-light">
          There you have it.
        </p>
        <p class="uk-light">
          I chose the name "V8 Clog" because the word "clog" actually has a
          history of use referring to changelogs. That, and also because I felt
          that the team was "clogging up the works" by no longer making release
          blog posts. Do please try to have a sense of humor, folks.
        </p>
        <p class="uk-light">
          Please don't harrass the V8 team because of my personal opinions
          stated here, and <a href="/rss.xml">subscribe to the RSS feed!</a>
        </p>
      </div>
    </div>
  );
}
