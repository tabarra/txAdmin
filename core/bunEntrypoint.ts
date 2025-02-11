/**
 * C compiler testing
 */
import os from 'node:os';
import path from 'node:path';
import { cc } from "bun:ffi";
import source from "./hello.c" with { type: "file" };
import { file } from "bun";

// const sourceBytes = await file(source).text();

//For SFE, we need to write the embedded file to a temporary location
const tmpPath = path.join(os.tmpdir(), 'hello.c');
await Bun.write(tmpPath, await file(source).text());

const compiled = cc({
//   source, //directly from the import doesn't work on single-file executable
  source: tmpPath,
  symbols: {
    hello: {
      args: [],
      returns: "int",
    },
  },
});

const {
  symbols: { hello },
} = compiled;

console.log("What is the answer to the universe?", hello());



/**
 * Import path testing
 */
import './subpath/example.ts';



/**
 * Signals testing
 */
setInterval(() => {
    console.log("Hello, world!");
}, 500);

const die = () => process.exit(0);

process.on("SIGINT", () => {
    console.log("Received SIGINT");
    die();
});
process.on("exit", code => {
    console.log(`Process exited with code ${code}`);
    die();
});
process.on("beforeExit", code => {
    console.log(`Event loop is empty!`);
    die();
});

process.on("exit", code => {
    console.log(`Process is exiting with code ${code}`);
    die();
});


/**
 * Full txAdmin test
 */
import './boot/setupNatives.js';
import './index.js';
//FIXME: need to fix the circular dependencies
// bunx madge --warning --circular --ts-config="core/tsconfig.json" core/index.ts
