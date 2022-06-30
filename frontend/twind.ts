import { setup } from "https://cdn.skypack.dev/twind@0.16.17?dts"
// @deno-types="https://cdn.skypack.dev/-/twind@v0.16.17-je93RqjPGfVdZEy8P06H/dist=es2019,mode=types/sheets/sheets.d.ts"
import { virtualSheet } from "https://cdn.skypack.dev/-/twind@v0.16.17-je93RqjPGfVdZEy8P06H/dist=es2019,mode=raw/sheets/sheets.js"

export const sheet = virtualSheet()

setup({
  theme: {
    fontFamily: {
      sans: ["Helvetica", "sans-serif"],
      serif: ["Times", "serif"],
    },
  },
  sheet,
});

export { tw } from "https://cdn.skypack.dev/twind@0.16.17?dts"
// @deno-types="https://cdn.skypack.dev/-/twind@v0.16.17-je93RqjPGfVdZEy8P06H/dist=es2019,mode=types/sheets/sheets.d.ts"
export { getStyleTag } from "https://cdn.skypack.dev/-/twind@v0.16.17-je93RqjPGfVdZEy8P06H/dist=es2019,mode=raw/sheets/sheets.js"
