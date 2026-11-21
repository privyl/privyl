import { run } from "./run.js";

const color = Boolean(process.stdout.isTTY) && !process.env["NO_COLOR"];

process.exitCode = run(process.argv.slice(2), {
  out: (text) => console.log(text),
  err: (text) => console.error(text),
  cwd: process.cwd(),
  color,
});
