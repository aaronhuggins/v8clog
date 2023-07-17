import { BACKEND_TYPE } from "../backend/constants.ts";
import { V8ChangeLog } from "../backend/v8/V8ChangeLog.ts";

const v8clog = new V8ChangeLog(BACKEND_TYPE);
const latest = await v8clog.getLatest();
await Promise.all(
  (await v8clog.getRange(v8clog.earliest, latest.milestone + 3)).map(
    async (release) => {
      const [features, changes] = await Promise.all([
        release.features(),
        release.changes(),
      ]);
      return {
        release,
        features,
        changes,
      };
    },
  ),
);
await v8clog.commit();
