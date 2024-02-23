import path from "node:path";
import fsp from "node:fs/promises";
import mkdirp from "mkdirp";
import { execSync } from "node:child_process";
import {
  PROM1_FILE_NAME,
  PROM2_FILE_NAME,
  asmTmpDir,
  romTmpDir,
  tmpDir,
} from "./dirs";
import {
  AddressPromPatch,
  CromBuffer,
  CromPatch,
  Patch,
  PatchDescription,
  PatchJSON,
  StringPromPatch,
} from "./types";
import { doPromPatch } from "./doPromPatch";

process
  .on("unhandledRejection", (reason, p) => {
    console.error(reason, "Unhandled Rejection at Promise", p);
  })
  .on("uncaughtException", (err) => {
    console.error(err, "Uncaught Exception thrown");
    process.exit(1);
  });

// Place subroutines starting at the very end of the prom and working
// backwards from there
const SUBROUTINE_STARTING_INSERT_END = 0x80000;

function usage() {
  console.error(
    "usage: ts-node src/patchRom/main.ts <rom-zip> ...<patch-json>"
  );
  process.exit(1);
}

async function getProms(
  zipPath: string
): Promise<{ prom1: Buffer; prom2: Buffer }> {
  execSync(`unzip -o ${zipPath} -d ${romTmpDir(zipPath)}`);

  const prom1 = await fsp.readFile(
    path.resolve(romTmpDir(zipPath), PROM1_FILE_NAME)
  );
  const prom2 = await fsp.readFile(
    path.resolve(romTmpDir(zipPath), PROM2_FILE_NAME)
  );

  return { prom1, prom2 };
}

async function getCrom(zipPath: string, cromFile: string): Promise<CromBuffer> {
  execSync(`unzip -o ${zipPath} -d ${romTmpDir}`);

  return {
    fileName: cromFile,
    data: Array.from(
      await fsp.readFile(path.resolve(romTmpDir(zipPath), cromFile))
    ),
  };
}

function flipBytes(data: number[]): number[] {
  for (let i = 0; i < data.length; i += 2) {
    const byte = data[i];
    data[i] = data[i + 1];
    data[i + 1] = byte;
  }

  return data;
}

function isPatchDescription(obj: unknown): obj is PatchDescription {
  if (!obj) {
    return false;
  }

  if (typeof obj !== "object") {
    return false;
  }

  const p = obj as PatchDescription;

  return typeof p.patchDescription === "string";
}

function isStringPatch(obj: unknown): obj is StringPromPatch {
  if (!obj) {
    return false;
  }

  if (typeof obj !== "object") {
    return false;
  }

  const p = obj as StringPromPatch;

  return p.string === true && typeof p.value === "string";
}

function isAddressPatch(obj: unknown): obj is AddressPromPatch {
  if (!obj) {
    return false;
  }

  if (typeof obj !== "object") {
    return false;
  }

  const p = obj as AddressPromPatch;

  return Array.isArray(p.patchAsm);
}

function isCromPatch(obj: unknown): obj is CromPatch {
  if (!obj) {
    return false;
  }

  if (typeof obj !== "object") {
    return false;
  }

  const p = obj as CromPatch;

  return (
    typeof p.destStartingIndex === "string" &&
    typeof p.imgFile === "string" &&
    typeof p.paletteFile === "string"
  );
}

function isPatch(obj: unknown): obj is Patch {
  if (!obj) {
    return false;
  }

  if (typeof obj !== "object") {
    return false;
  }

  const p = obj as Patch;

  return isStringPatch(p) || isAddressPatch(p) || isCromPatch(p);
}

function isPatchJSON(obj: unknown): obj is PatchJSON {
  if (!obj) {
    return false;
  }

  if (!Array.isArray(obj)) {
    return false;
  }

  if (obj.length < 2) {
    return false;
  }

  return obj.every((e, i) => {
    if (i === 0) {
      return isPatchDescription(e);
    } else {
      return isPatch(e);
    }
  });
}

async function writePatchedZip(
  romZipFile: string,
  prom1Data: number[],
  prom2Data: number[],
  cromBuffers: CromBuffer[],
  outputPath: string
): Promise<void> {
  await fsp.writeFile(
    path.resolve(romTmpDir(romZipFile), PROM1_FILE_NAME),
    new Uint8Array(prom1Data)
  );

  await fsp.writeFile(
    path.resolve(romTmpDir(romZipFile), PROM2_FILE_NAME),
    new Uint8Array(prom2Data)
  );

  for (const cromBuffer of cromBuffers) {
    await fsp.writeFile(
      path.resolve(romTmpDir(romZipFile), cromBuffer.fileName),
      new Uint8Array(cromBuffer.data)
    );
  }

  const cmd = `zip ${romZipFile} *`;
  console.log("about to execute", cmd);
  const output = execSync(cmd, { cwd: romTmpDir(romZipFile) });
  console.log(output.toString());

  const cpCmd = `cp ${romZipFile} ${outputPath}`;
  console.log("about to execute", cpCmd);
  const output2 = execSync(cpCmd, { cwd: romTmpDir(romZipFile) });
  console.log(output2.toString());
}

async function main(romZipFile: string, patchJsonPaths: string[]) {
  try {
    await fsp.rm(tmpDir(romZipFile), {
      recursive: true,
      force: true,
      maxRetries: 5,
      retryDelay: 1000,
    });
    await mkdirp(romTmpDir(romZipFile));
    await mkdirp(asmTmpDir(romZipFile));

    const { prom1: flippedProm1Buffer, prom2: flippedProm2Buffer } =
      await getProms(path.resolve(romZipFile));

    const flippedProm1Data = Array.from(flippedProm1Buffer);
    const prom1Data = flipBytes(flippedProm1Data);

    const flippedProm2Data = Array.from(flippedProm2Buffer);
    const prom2Data = flipBytes(flippedProm2Data);

    let patchedProm1Data = [...prom1Data];
    let patchedProm2Data = [...prom2Data];

    let symbolTable: Record<string, number> = {};

    let subroutineInsertEnd = SUBROUTINE_STARTING_INSERT_END;

    for (const patchJsonPath of patchJsonPaths) {
      console.log("Starting patch", patchJsonPath);

      let patchJson;
      try {
        patchJson = require(patchJsonPath);
      } catch (e) {
        console.error("Error occured loading the patch", e);
      }

      if (!isPatchJSON(patchJson)) {
        console.error(
          "The JSON at",
          patchJsonPath,
          ", is not a valid patch file"
        );
        usage();
      }

      console.log(patchJson.shift().patchDescription);

      for (const patch of patchJson) {
        if (patch.skip) {
          console.log("SKIPPING!", patch.description);
          continue;
        }

        try {
          if (patch.type === "prom") {
            const result = await doPromPatch(
              romZipFile,
              symbolTable,
              patchedProm1Data,
              patchedProm2Data,
              subroutineInsertEnd,
              patch
            );
            patchedProm1Data = result.patchedProm1Data;
            patchedProm2Data = result.patchedProm2Data;
            // TODO: subroutineInsertEnd only works for prom1
            subroutineInsertEnd = result.subroutineInsertEnd;
            symbolTable = result.symbolTable;
          } else if (patch.type === "crom") {
            throw new Error("crom patches not supported");
            //   console.log(patch.description);
            //   console.log("creating crom bytes for", patch.imgFile);
            //   const { oddCromBytes, evenCromBytes } = createCromBytes(
            //     path.resolve(jsonDir, patch.imgFile),
            //     path.resolve(jsonDir, patch.paletteFile)
            //   );

            //   const startingCromTileIndex = parseInt(patch.destStartingIndex, 16);
            //   const tileIndexes: number[] = [];
            //   const tileCount = oddCromBytes.length / 64;
            //   for (let t = 0; t < tileCount; ++t) {
            //     tileIndexes.push(startingCromTileIndex + t);
            //   }

            //   console.log(
            //     "inserting crom data into croms at tile indexes:",
            //     tileIndexes.map((ti) => ti.toString(16)).join(",")
            //   );
            //   cromBuffers = await insertIntoCrom(
            //     oddCromBytes,
            //     evenCromBytes,
            //     parseInt(patch.destStartingIndex, 16),
            //     cromBuffers
            //   );

            //   console.log("\n\n");
          } else {
            throw new Error("unknown patch type: " + patch.type);
          }
        } catch (e) {
          console.error(e);
          process.exit(1);
        }

        console.log("\n\n");
      }
    }

    const flippedBackProm1Data = flipBytes(patchedProm1Data);
    const flippedBackProm2Data = flipBytes(patchedProm2Data);

    const mameDir = process.env.MAME_ROM_DIR;

    if (!mameDir?.trim()) {
      throw new Error("MAME_ROM_DIR env variable is not set");
    }

    const writePath = path.resolve(mameDir, romZipFile);
    await writePatchedZip(
      romZipFile,
      flippedBackProm1Data,
      flippedBackProm2Data,
      [],
      writePath
    );

    console.log("wrote patched rom to", writePath);
  } catch (e) {
    console.log("error", e);
  }
}

const [_tsnode, _main, romZipFile, ...patchJsonInputPaths] = process.argv;

if (!romZipFile || !patchJsonInputPaths?.length) {
  usage();
}

const finalPatchJsonPaths = patchJsonInputPaths.map((pjip) =>
  path.resolve(process.cwd(), pjip)
);

main(romZipFile, finalPatchJsonPaths).catch((e) => console.error);

export { isStringPatch, isCromPatch };
