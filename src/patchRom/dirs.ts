import os from "node:os";
import path from "node:path";

export function tmpDir(romZipFile: string) {
  return path.resolve(os.tmpdir(), path.basename(romZipFile, ".zip"));
}

export function romTmpDir(romZipFile: string) {
  return path.resolve(tmpDir(romZipFile), "rom");
}

export function asmTmpDir(romZipFile: string) {
  return path.resolve(tmpDir(romZipFile), "asm");
}

// TODO: genericize this
export const PROM_FILE_NAME = "234-p1.p1";
