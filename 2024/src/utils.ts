import { resolve } from "node:path";
import { performance } from "node:perf_hooks";
import { constants as fsconst, readFile, stat } from "node:fs/promises";
import k from "kleur";

/** Parses the given input file and returns its lines (if splitRegex is left on its default) */
export async function getInputLines(day: number, suffix: string | number | undefined = undefined, allowEmptyLines = false, splitRegex = /\n/gm) {
  const lines = (await getInput(day, suffix))
    .split(splitRegex);

  return allowEmptyLines
    ? lines
    : lines.filter(l => l.length > 0);
}

/** Reads the input file for the given day and returns it as a plain string */
export async function getInput(day: number, suffix: string | number | undefined = undefined) {
  const inputPath = resolve(`./src/days/${day}/input${suffix ?? ""}.txt`);

  if(isNaN(day) || !(await fileExists(inputPath)))
    throw new Error(`Can't get input${suffix ?? ""}.txt for day ${day} as file doesn't exist. Expected path: '${inputPath}'`);

  return String(await readFile(inputPath));
}

/**
 * Executes the passed async functions sequentially
 */
export async function runSequentially(...promises: ((() => Promise<unknown>) | Promise<unknown>)[]) {
  for(const prom of promises)
    if(typeof prom === "function")
      await prom();
    else
      await prom;
}

/** Returns whether the file exists and is accessible using the provided mode (read-only by default). */
export async function fileExists(path: string, mode = fsconst.R_OK) {
  try {
    const stats = await stat(path);
    if(stats.isFile() && (stats.mode & mode) === mode)
      return true;
    return false;
  }
  catch {
    return false;
  }
}

/** Measures performance from instantiation to execution of `allDone()` */
export class PerfMeter {
  public startTs;
  public fsTs = 0;
  public remapTs = 0;
  public allDoneTs = 0;

  readonly decimals;

  /** Measures performance from instantiation to execution of `allDone()` */
  constructor(decimals = 3) {
    this.startTs = performance.now();
    this.decimals = decimals;
  }

  /** Call to measure when all file system stuff is done */
  public fsDone() {
    this.fsTs = performance.now();
  }

  /** Call to measure when data remapping is done */
  public remapDone() {
    this.remapTs = performance.now();
  }

  /** Call to measure when everything is done */
  public allDone() {
    this.allDoneTs = performance.now();
  }

  /** Prints the measured times in seconds */
  public print() {
    console.log(k.gray([
      "> Performance",
      `>   No FS:    ${this.fsTs > 0 ? this.formatOffsetTS(this.allDoneTs - this.fsTs) : "--- "}s`,
      `>   No Remap: ${this.remapTs > 0 ? this.formatOffsetTS(this.allDoneTs - this.remapTs) : "--- "}s`,
      `>   Total:    ${this.formatOffsetTS(this.allDoneTs - this.startTs)}s`,
    ].join("\n")));
  }

  private formatOffsetTS(timestamp: number) {
    return parseFloat((timestamp / 1000).toFixed(this.decimals));
  }
}
