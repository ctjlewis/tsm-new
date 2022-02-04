import test from "ava";

import { promises as fs } from "fs";
import { resolve } from "path";
import { killShell, shell } from "await-shell";
import { tmpdir } from "os";

const testModuleDir = resolve(tmpdir(), "test-module");

await fs.rm(testModuleDir, { recursive: true, force: true });

test.serial("[create] should generate TS module package", async (t) => {
  process.chdir(tmpdir());

  /**
   * Create the test TS module.
   */
  await shell(`cd ${tmpdir()} && tsmodule create test-module`);

  /**
   * `tsmodule create` adds a `@tsmodule/tsmodule` dependency, so re-link it.
   */
  // await shell(`cd ${testModuleDir} && yarn link @tsmodule/tsmodule`);

  t.pass();
});

test.serial("[create] created module package should build", async (t) => {
  process.chdir(testModuleDir);
  await shell(`cd ${testModuleDir} && tsmodule build`);

  t.pass();
});

test.serial("[create] built module should execute", async (t) => {
  process.chdir(testModuleDir);
  await shell(`cd ${testModuleDir} && node dist/index.js`);

  t.pass();
});

test.serial("[dev] should watch for file changes", async (t) => {
  process.chdir(testModuleDir);
  t.timeout(10000);

  await Promise.allSettled([
    shell(`cd ${testModuleDir} && tsmodule dev`),
    (async () => {
      const testFile = resolve(testModuleDir, "src/index.ts");
      await fs.writeFile(
        testFile,
        "export const hello = 'world';"
      );

      await new Promise((resolve) => setTimeout(resolve, 5000));

      const emittedDevFile = resolve(testModuleDir, "dist/index.js");
      const emittedDevModule = await fs.readFile(emittedDevFile, "utf-8");

      t.snapshot(emittedDevModule);
      killShell();
    })(),
  ]);

  t.pass();
  return;
});