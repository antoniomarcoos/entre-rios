import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const [command, ...args] = process.argv.slice(2);
if (!["dev", "build"].includes(command)) throw new Error("Expected dev or build.");
const reactApp = spawnSync(process.execPath, [fileURLToPath(new URL("./build-react-app.mjs", import.meta.url))], { stdio: "inherit" });
if (reactApp.status !== 0) process.exit(reactApp.status ?? 1);
const cli = new URL("../node_modules/vinext/dist/cli.js", import.meta.url);
process.argv = [process.execPath, fileURLToPath(cli), command, ...args];
await import(cli.href);
