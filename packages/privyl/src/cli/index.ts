import { runProxy } from "./proxy.js";
import { run, type Io } from "./run.js";

const color = Boolean(process.stdout.isTTY) && !process.env["NO_COLOR"];
const io: Io = {
  out: (text) => console.log(text),
  err: (text) => console.error(text),
  cwd: process.cwd(),
  color,
};
const argv = process.argv.slice(2);

if (argv[0] === "proxy") {
  // Long-running: the process stays alive while the server listens.
  void runProxy(argv.slice(1), io).then((code) => {
    if (code !== undefined) process.exitCode = code;
  });
} else {
  process.exitCode = run(argv, io);
}
