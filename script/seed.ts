import { BACKEND_TYPE } from "../backend/constants.ts";
import { V8ChangeLog } from "../backend/v8/V8ChangeLog.ts";

const v8clog = new V8ChangeLog(BACKEND_TYPE);
await v8clog.getLatest();
await v8clog.getAllData(v8clog.earliest, v8clog.latest + 3);
await v8clog.commit();
